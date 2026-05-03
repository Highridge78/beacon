#!/usr/bin/env node

/**
 * Beacon CLI
 *
 * A local site audit tool for the conversion, SEO, and trust signals
 * Lighthouse misses.
 *
 * Usage:
 *   npx beacon https://example-plumber.com
 *   npx beacon https://example.com --json
 *   npx beacon https://example.com --html --output report.html
 */

import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import { writeFileSync } from "node:fs";
import { fetchPage } from "./fetcher.js";
import { allChecks } from "./checks/index.js";
import { calculateScore } from "./scorer.js";
import { generateTopFixes, estimateConversionImpact, generateNarrative } from "./narrative.js";
import { printReport } from "./reporter/terminal.js";
import { toJson } from "./reporter/json.js";
import { toHtml } from "./reporter/html.js";
import type { AuditReport, CheckResult } from "./types.js";

const program = new Command();

program
  .name("beacon")
  .description(
    "Audit local business websites for the conversion, SEO, and trust signals Lighthouse misses.",
  )
  .version("0.2.0")
  .argument("<url>", "URL to audit (e.g., https://example-plumber.com)")
  .option("--json", "Output results as JSON")
  .option("--html", "Generate an HTML report")
  .option("-o, --output <file>", "Save output to a file")
  .option("--checks", "List all available checks")
  .action(async (url: string, options: { json?: boolean; html?: boolean; output?: string }) => {
    const spinner = ora({ color: "cyan" });

    try {
      // Stage 1: Fetching
      spinner.start(`${chalk.bold("Fetching")} ${chalk.cyan(url)}`);
      const ctx = await fetchPage(url);
      spinner.succeed(`${chalk.bold("Fetched")} ${chalk.cyan(ctx.finalUrl)} ${chalk.gray(`(${(ctx.loadTime / 1000).toFixed(2)}s)`)}`);

      // Stage 2: Analyzing
      spinner.start(`${chalk.bold("Analyzing")} ${chalk.gray(`${allChecks.length} checks across 5 categories`)}`);
      const results: CheckResult[] = [];
      for (const check of allChecks) {
        try {
          const result = await check.run(ctx);
          results.push(result);
        } catch (error) {
          results.push({
            id: check.id,
            name: check.name,
            category: check.category,
            weight: check.weight,
            status: "skip",
            message: `Check failed to run: ${error instanceof Error ? error.message : "unknown error"}`,
          });
        }
      }
      const passed = results.filter((c) => c.status === "pass").length;
      const failed = results.filter((c) => c.status === "fail").length;
      spinner.succeed(`${chalk.bold("Analyzed")} ${chalk.green(`${passed} passed`)} · ${chalk.red(`${failed} failed`)} · ${chalk.gray(`${results.length} total`)}`);

      // Stage 3: Scoring
      spinner.start(`${chalk.bold("Scoring")} and ranking priorities`);
      const { score, grade, categories } = calculateScore(results);
      const topFixes = generateTopFixes(results);
      const conversionImpact = estimateConversionImpact(results);
      spinner.succeed(`${chalk.bold("Score:")} ${score}/100 (${grade})`);

      // Stage 4: Generating report
      spinner.start(`${chalk.bold("Generating")} report`);
      const report: AuditReport = {
        url: ctx.url,
        finalUrl: ctx.finalUrl,
        timestamp: new Date().toISOString(),
        score,
        grade,
        checks: results,
        categories,
        performance: { ttfb: ctx.ttfb, loadTime: ctx.loadTime },
        topFixes,
        conversionImpact,
        narrative: "",
      };
      report.narrative = generateNarrative(report);
      spinner.succeed(`${chalk.bold("Complete")}`);
      console.log("");

      // Output
      if (options.json) {
        const json = toJson(report);
        if (options.output) {
          writeFileSync(options.output, json, "utf-8");
          console.log(chalk.green(`✔ JSON report saved to ${options.output}`));
        } else {
          console.log(json);
        }
        return;
      }

      if (options.html) {
        const html = toHtml(report);
        const outputFile = options.output || `beacon-${new URL(report.finalUrl).hostname}.html`;
        writeFileSync(outputFile, html, "utf-8");
        console.log(chalk.green(`✔ HTML report saved to ${outputFile}`));
        printReport(report);
        return;
      }

      // Default: terminal output
      printReport(report);

      if (options.output) {
        const json = toJson(report);
        writeFileSync(options.output, json, "utf-8");
        console.log(chalk.green(`✔ Results saved to ${options.output}`));
      }
    } catch (error) {
      spinner.fail(
        chalk.red(
          `Failed to audit ${url}: ${error instanceof Error ? error.message : "unknown error"}`,
        ),
      );
      process.exit(1);
    }
  });

// List checks command
program.on("option:checks", () => {
  import("./checks/index.js").then(({ allChecks }) => {
    console.log(chalk.bold("\n  Beacon — Available Checks\n"));
    const categories = new Map<string, typeof allChecks>();
    for (const check of allChecks) {
      const cat = categories.get(check.category) || [];
      cat.push(check);
      categories.set(check.category, cat);
    }
    for (const [cat, checks] of categories) {
      console.log(chalk.bold(`  ${cat.toUpperCase()}`));
      for (const check of checks) {
        console.log(
          `    ${chalk.gray("•")} ${check.name} ${chalk.gray(`(weight: ${check.weight})`)}`,
        );
      }
      console.log("");
    }
    process.exit(0);
  });
});

program.parse();
