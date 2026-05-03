/**
 * Terminal reporter — client-ready terminal output with narrative,
 * Top 5 Fixes, conversion impact, and category breakdown
 */

import chalk from "chalk";
import type { AuditReport, CheckCategory, CheckResult, PriorityFix } from "../types.js";

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

  // ═══ HEADER ═══
  console.log("");
  console.log(chalk.bold("━".repeat(64)));
  console.log(chalk.bold("  BEACON SITE AUDIT"));
  console.log(chalk.gray(`  ${report.url}`));
  if (report.url !== report.finalUrl) {
    console.log(chalk.gray(`  → ${report.finalUrl}`));
  }
  console.log(chalk.bold("━".repeat(64)));
  console.log("");

  // ═══ SCORE + GRADE ═══
  const passed = report.checks.filter((c) => c.status === "pass").length;
  const failed = report.checks.filter((c) => c.status === "fail").length;
  const warned = report.checks.filter((c) => c.status === "warn").length;

  console.log(
    `  ${chalk.bold("Score:")} ${gradeColor(`${report.score}/100`)}  ${chalk.bold("Grade:")} ${gradeColor(report.grade)}`,
  );
  console.log(
    `  ${chalk.green(`${passed} passed`)}  ${chalk.red(`${failed} failed`)}  ${chalk.yellow(`${warned} warnings`)}  ${chalk.gray(`${report.checks.length} total checks`)}`,
  );
  console.log(
    chalk.gray(
      `  Load time: ${(report.performance.loadTime / 1000).toFixed(2)}s | TTFB: ${(report.performance.ttfb / 1000).toFixed(2)}s`,
    ),
  );
  console.log("");

  // ═══ NARRATIVE ═══
  if (report.narrative) {
    console.log(chalk.bold("  📋 Summary"));
    console.log(chalk.gray("  " + "─".repeat(60)));
    wrapText(report.narrative, 60, "  ").forEach((line) => console.log(line));
    console.log("");
  }

  // ═══ CONVERSION IMPACT ═══
  if (report.conversionImpact) {
    const ci = report.conversionImpact;
    console.log(chalk.bold("  📊 Estimated Conversion Impact"));
    console.log(chalk.gray("  " + "─".repeat(60)));
    console.log(`  Estimated lead loss:       ${chalk.red.bold(ci.estimatedLeadLoss)}`);
    console.log(`  Potential improvement:     ${chalk.green.bold(ci.potentialImprovement)}`);
    console.log("");
  }

  // ═══ TOP 5 FIXES ═══
  if (report.topFixes && report.topFixes.length > 0) {
    console.log(chalk.bold("  🔧 Top 5 Priority Fixes"));
    console.log(chalk.gray("  " + "─".repeat(60)));

    for (const fix of report.topFixes) {
      const catEmoji = CATEGORY_LABELS[fix.category]?.split(" ")[0] || "•";
      console.log(`  ${chalk.bold(`#${fix.rank}`)} ${catEmoji} ${chalk.bold(fix.checkName)} ${chalk.gray(`(${fix.effort})`)}`);
      wrapText(fix.action, 56, "     ").forEach((line) => console.log(chalk.dim(line)));
    }
    console.log("");
  }

  // ═══ CATEGORY BARS ═══
  console.log(chalk.bold("  Category Scores"));
  console.log(chalk.gray("  " + "─".repeat(60)));

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

  // ═══ DETAILED RESULTS ═══
  const categorized = groupByCategory(report.checks);

  for (const [key, label] of Object.entries(CATEGORY_LABELS)) {
    const checks = categorized[key as CheckCategory];
    if (!checks || checks.length === 0) continue;

    console.log(chalk.bold(`  ${label}`));
    console.log(chalk.gray("  " + "─".repeat(60)));

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

      if (check.recommendation && check.status !== "pass") {
        console.log(chalk.dim(`    🔧 ${check.recommendation}`));
      }
    }

    console.log("");
  }

  // ═══ FOOTER ═══
  console.log(chalk.bold("━".repeat(64)));
  console.log(chalk.gray("  Generated by Beacon — https://github.com/Highridge78/beacon"));
  console.log(chalk.bold("━".repeat(64)));
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

function wrapText(text: string, width: number, indent: string): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = indent;

  for (const word of words) {
    if (current.length + word.length + 1 > width + indent.length && current !== indent) {
      lines.push(current);
      current = indent + word;
    } else {
      current += (current === indent ? "" : " ") + word;
    }
  }

  if (current !== indent) lines.push(current);
  return lines;
}
