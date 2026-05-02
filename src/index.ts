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
import { audit } from "./auditor.js";
import { printReport } from "./reporter/terminal.js";
import { toJson } from "./reporter/json.js";
import { toHtml } from "./reporter/html.js";

const program = new Command();

program
  .name("beacon")
  .description(
    "A local site audit tool for the conversion, SEO, and trust signals Lighthouse misses.",
  )
  .version("0.1.0")
  .argument("<url>", "URL to audit (e.g., https://example-plumber.com)")
  .option("--json", "Output results as JSON")
  .option("--html", "Generate an HTML report")
  .option("-o, --output <file>", "Save output to a file")
  .option("--checks", "List all available checks")
  .action(async (url: string, options: { json?: boolean; html?: boolean; output?: string }) => {
    const spinner = ora({
      text: `Auditing ${chalk.cyan(url)}...`,
      color: "cyan",
    }).start();

    try {
      const report = await audit(url);
      spinner.stop();

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
