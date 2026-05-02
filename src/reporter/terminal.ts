/**
 * Terminal reporter — color-coded score card output
 */

import chalk from "chalk";
import type { AuditReport, CheckCategory, CheckResult } from "../types.js";

const STATUS_ICONS = {
  pass: chalk.green("✔"),
  fail: chalk.red("✘"),
  warn: chalk.yellow("⚠"),
  skip: chalk.gray("○"),
};

const CATEGORY_LABELS: Record<CheckCategory, string> = {
  conversion: "🎯 Conversion",
  seo: "🔍 SEO",
  trust: "🤝 Trust",
  technical: "⚙️  Technical",
  mobile: "📱 Mobile",
};

const GRADE_COLORS: Record<string, (s: string) => string> = {
  A: chalk.green.bold,
  "A-": chalk.green,
  B: chalk.greenBright,
  "B-": chalk.greenBright,
  C: chalk.yellow,
  "C-": chalk.yellow,
  D: chalk.red,
  "D-": chalk.red,
  F: chalk.redBright.bold,
};

export function printReport(report: AuditReport): void {
  const gradeColor = GRADE_COLORS[report.grade] || chalk.white;

  // Header
  console.log("");
  console.log(chalk.bold("━".repeat(60)));
  console.log(chalk.bold("  BEACON"));
  console.log(chalk.gray(`  ${report.url}`));
  if (report.url !== report.finalUrl) {
    console.log(chalk.gray(`  → ${report.finalUrl}`));
  }
  console.log(chalk.bold("━".repeat(60)));
  console.log("");

  // Score
  console.log(
    `  Overall Score: ${gradeColor(`${report.score}/100`)}  Grade: ${gradeColor(report.grade)}`,
  );
  console.log(
    chalk.gray(
      `  Load time: ${(report.performance.loadTime / 1000).toFixed(2)}s | TTFB: ${(report.performance.ttfb / 1000).toFixed(2)}s`,
    ),
  );
  console.log("");

  // Category breakdown
  console.log(chalk.bold("  Category Scores"));
  console.log(chalk.gray("  " + "─".repeat(45)));

  for (const [key, label] of Object.entries(CATEGORY_LABELS)) {
    const cat = report.categories[key as CheckCategory];
    if (cat.count === 0) continue;

    const barWidth = 20;
    const filled = Math.round((cat.score / 100) * barWidth);
    const empty = barWidth - filled;

    const barColor =
      cat.score >= 70 ? chalk.green : cat.score >= 40 ? chalk.yellow : chalk.red;

    const bar = barColor("█".repeat(filled)) + chalk.gray("░".repeat(empty));

    console.log(
      `  ${label.padEnd(18)} ${bar} ${String(cat.score).padStart(3)}%  (${cat.passed}/${cat.count} passed)`,
    );
  }

  console.log("");

  // Detailed results by category
  const categorized = groupByCategory(report.checks);

  for (const [key, label] of Object.entries(CATEGORY_LABELS)) {
    const checks = categorized[key as CheckCategory];
    if (!checks || checks.length === 0) continue;

    console.log(chalk.bold(`  ${label}`));
    console.log(chalk.gray("  " + "─".repeat(45)));

    for (const check of checks) {
      const icon = STATUS_ICONS[check.status];
      const nameColor =
        check.status === "pass"
          ? chalk.white
          : check.status === "fail"
            ? chalk.red
            : check.status === "warn"
              ? chalk.yellow
              : chalk.gray;

      console.log(`  ${icon} ${nameColor(check.name)}`);
      console.log(chalk.gray(`    ${check.message}`));

      if (check.details && check.status !== "pass") {
        console.log(chalk.dim(`    💡 ${check.details}`));
      }
    }

    console.log("");
  }

  // Summary
  const passed = report.checks.filter((c) => c.status === "pass").length;
  const failed = report.checks.filter((c) => c.status === "fail").length;
  const warned = report.checks.filter((c) => c.status === "warn").length;

  console.log(chalk.bold("━".repeat(60)));
  console.log(
    `  ${chalk.green(`${passed} passed`)}  ${chalk.red(`${failed} failed`)}  ${chalk.yellow(`${warned} warnings`)}  ${chalk.gray(`${report.checks.length} total checks`)}`,
  );
  console.log(chalk.bold("━".repeat(60)));
  console.log("");
}

function groupByCategory(
  checks: CheckResult[],
): Record<CheckCategory, CheckResult[]> {
  const groups: Record<CheckCategory, CheckResult[]> = {
    conversion: [],
    seo: [],
    trust: [],
    technical: [],
    mobile: [],
  };

  for (const check of checks) {
    groups[check.category].push(check);
  }

  return groups;
}
