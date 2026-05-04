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
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fetchPage } from "./fetcher.js";
import { allChecks } from "./checks/index.js";
import { calculateScore } from "./scorer.js";
import { generateTopFixes, estimateConversionImpact, generateNarrative } from "./narrative.js";
import { detectBusinessType } from "./business-type.js";
import { applyContextualRecommendations, getBusinessContext } from "./recommendations.js";
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
  .option("-o, --output <file>", "Save output to a file (or 'html'/'json' for format selection)")
  .option("--checks", "List all available checks")
  .action(async (url: string, options: { json?: boolean; html?: boolean; output?: string }) => {
    const spinner = ora({ color: "cyan" });

    // Handle --output html / --output json as format selectors
    let wantHtml = options.html || false;
    let wantJson = options.json || false;
    let outputFile = options.output;

    if (outputFile === "html") {
      wantHtml = true;
      outputFile = undefined; // auto-generate filename
    } else if (outputFile === "json") {
      wantJson = true;
      outputFile = undefined;
    }

    try {
      // Stage 1: Fetching
      spinner.start(`${chalk.bold("Fetching")} ${chalk.cyan(url)}`);
      const ctx = await fetchPage(url);
      spinner.succeed(`${chalk.bold("Fetched")} ${chalk.cyan(ctx.finalUrl)} ${chalk.gray(`(${(ctx.loadTime / 1000).toFixed(2)}s)`)}`);

      // Stage 1.5: Detect business type
      const { type: businessType, confidence: businessTypeConfidence } = detectBusinessType(ctx.html);
      const bizCtx = getBusinessContext(businessType);
      console.log(chalk.gray(`  Business type: ${bizCtx.label} (${Math.round(businessTypeConfidence * 100)}% confidence)`));

      // Stage 2: Analyzing
      spinner.start(`${chalk.bold("Analyzing")} ${chalk.gray(`${allChecks.length} checks across 5 categories`)}`);
      const rawResults: CheckResult[] = [];
      for (const check of allChecks) {
        try {
          const result = await check.run(ctx);
          rawResults.push(result);
        } catch (error) {
          rawResults.push({
            id: check.id,
            name: check.name,
            category: check.category,
            weight: check.weight,
            status: "skip",
            message: `Check failed to run: ${error instanceof Error ? error.message : "unknown error"}`,
          });
        }
      }

      // Apply contextual recommendations
      const results = applyContextualRecommendations(rawResults, businessType);

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
        businessType,
        businessTypeConfidence,
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
      if (wantJson) {
        const json = toJson(report);
        if (outputFile) {
          writeFileSync(outputFile, json, "utf-8");
          console.log(chalk.green(`✔ JSON report saved to ${outputFile}`));
        } else if (!wantHtml) {
          // Auto-generate filename for --output json
          const reportsDir = resolve("reports");
          if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });
          const domain = extractDomain(report.finalUrl);
          const autoFile = resolve(reportsDir, `${domain}.json`);
          writeFileSync(autoFile, json, "utf-8");
          console.log(chalk.green(`✔ JSON report saved to ${autoFile}`));
        } else {
          console.log(json);
        }
        if (!wantHtml) return;
      }

      if (wantHtml) {
        const html = toHtml(report);
        let htmlFile = outputFile;
        if (!htmlFile) {
          // Auto-generate to reports/ directory
          const reportsDir = resolve("reports");
          if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });
          const domain = extractDomain(report.finalUrl);
          htmlFile = resolve(reportsDir, `${domain}.html`);
        }
        writeFileSync(htmlFile, html, "utf-8");
        console.log(chalk.green(`✔ HTML report saved to ${htmlFile}`));
        printReport(report);
        return;
      }

      // Default: terminal output
      printReport(report);

      if (outputFile) {
        const json = toJson(report);
        writeFileSync(outputFile, json, "utf-8");
        console.log(chalk.green(`✔ Results saved to ${outputFile}`));
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

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

program.parse();
