/**
 * HTML reporter — generates a shareable audit report
 */

import type { AuditReport, CheckCategory, CheckResult } from "../types.js";

const STATUS_ICONS: Record<string, string> = {
  pass: "✔",
  fail: "✘",
  warn: "⚠",
  skip: "○",
};

const STATUS_COLORS: Record<string, string> = {
  pass: "#22c55e",
  fail: "#ef4444",
  warn: "#eab308",
  skip: "#9ca3af",
};

const CATEGORY_LABELS: Record<CheckCategory, { label: string; emoji: string }> = {
  conversion: { label: "Conversion", emoji: "🎯" },
  seo: { label: "SEO", emoji: "🔍" },
  trust: { label: "Trust", emoji: "🤝" },
  technical: { label: "Technical", emoji: "⚙️" },
  mobile: { label: "Mobile", emoji: "📱" },
};

function gradeColor(grade: string): string {
  if (grade.startsWith("A")) return "#22c55e";
  if (grade.startsWith("B")) return "#84cc16";
  if (grade.startsWith("C")) return "#eab308";
  if (grade.startsWith("D")) return "#f97316";
  return "#ef4444";
}

function scoreColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#eab308";
  return "#ef4444";
}

export function toHtml(report: AuditReport): string {
  const passed = report.checks.filter((c) => c.status === "pass").length;
  const failed = report.checks.filter((c) => c.status === "fail").length;
  const warned = report.checks.filter((c) => c.status === "warn").length;

  const categorized = groupByCategory(report.checks);
  const date = new Date(report.timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Site Audit: ${escapeHtml(report.url)} — ${report.score}/100</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      line-height: 1.6;
    }
    .container { max-width: 800px; margin: 0 auto; padding: 2rem 1.5rem; }

    /* Header */
    .header { text-align: center; margin-bottom: 3rem; }
    .header h1 { font-size: 1.5rem; font-weight: 700; color: #f8fafc; margin-bottom: 0.25rem; }
    .header .url { color: #94a3b8; font-size: 0.95rem; word-break: break-all; }
    .header .date { color: #64748b; font-size: 0.85rem; margin-top: 0.5rem; }

    /* Score card */
    .score-card {
      display: flex; align-items: center; justify-content: center; gap: 2rem;
      background: #1e293b; border-radius: 16px; padding: 2rem;
      margin-bottom: 2rem; border: 1px solid #334155;
    }
    .score-circle {
      width: 120px; height: 120px; border-radius: 50%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      border: 4px solid ${gradeColor(report.grade)};
      background: ${gradeColor(report.grade)}15;
    }
    .score-number { font-size: 2.5rem; font-weight: 800; color: ${gradeColor(report.grade)}; line-height: 1; }
    .score-label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
    .grade { font-size: 3rem; font-weight: 900; color: ${gradeColor(report.grade)}; }
    .stats { display: flex; gap: 1.5rem; }
    .stat { text-align: center; }
    .stat-number { font-size: 1.5rem; font-weight: 700; }
    .stat-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }

    /* Category bars */
    .categories { margin-bottom: 2rem; }
    .category-bar {
      display: flex; align-items: center; gap: 1rem;
      padding: 0.75rem 1rem; border-bottom: 1px solid #1e293b;
    }
    .cat-label { width: 130px; font-size: 0.9rem; font-weight: 500; }
    .bar-track {
      flex: 1; height: 8px; background: #1e293b; border-radius: 4px; overflow: hidden;
    }
    .bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
    .cat-score { width: 45px; text-align: right; font-weight: 600; font-size: 0.9rem; }

    /* Checks */
    .section { margin-bottom: 2rem; }
    .section-title {
      font-size: 1.1rem; font-weight: 700; padding: 0.75rem 0;
      border-bottom: 2px solid #334155; margin-bottom: 0.5rem;
    }
    .check {
      padding: 0.75rem 0; border-bottom: 1px solid #1e293b1a;
    }
    .check-header { display: flex; align-items: flex-start; gap: 0.75rem; }
    .check-icon { font-size: 1rem; flex-shrink: 0; margin-top: 2px; }
    .check-name { font-weight: 600; font-size: 0.95rem; }
    .check-message { color: #94a3b8; font-size: 0.85rem; margin-top: 0.15rem; }
    .check-details {
      margin-top: 0.5rem; margin-left: 1.75rem;
      padding: 0.5rem 0.75rem; background: #1e293b;
      border-radius: 6px; font-size: 0.85rem; color: #cbd5e1;
      border-left: 3px solid #334155;
    }

    /* Footer */
    .footer {
      text-align: center; padding-top: 2rem; margin-top: 2rem;
      border-top: 1px solid #1e293b; color: #475569; font-size: 0.8rem;
    }
    .footer a { color: #64748b; text-decoration: none; }
    .footer a:hover { color: #94a3b8; }

    /* Performance */
    .perf {
      display: flex; gap: 1rem; justify-content: center;
      margin-bottom: 2rem; color: #64748b; font-size: 0.85rem;
    }

    @media (max-width: 640px) {
      .score-card { flex-direction: column; gap: 1.5rem; }
      .stats { justify-content: center; }
      .category-bar { flex-wrap: wrap; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Beacon Audit</h1>
      <div class="url">${escapeHtml(report.url)}</div>
      <div class="date">${date}</div>
    </div>

    <div class="score-card">
      <div class="score-circle">
        <div class="score-number">${report.score}</div>
        <div class="score-label">out of 100</div>
      </div>
      <div class="grade">${report.grade}</div>
      <div class="stats">
        <div class="stat">
          <div class="stat-number" style="color: #22c55e">${passed}</div>
          <div class="stat-label">Passed</div>
        </div>
        <div class="stat">
          <div class="stat-number" style="color: #ef4444">${failed}</div>
          <div class="stat-label">Failed</div>
        </div>
        <div class="stat">
          <div class="stat-number" style="color: #eab308">${warned}</div>
          <div class="stat-label">Warnings</div>
        </div>
      </div>
    </div>

    <div class="perf">
      <span>Load time: ${(report.performance.loadTime / 1000).toFixed(2)}s</span>
      <span>·</span>
      <span>TTFB: ${(report.performance.ttfb / 1000).toFixed(2)}s</span>
    </div>

    <div class="categories">
      ${Object.entries(CATEGORY_LABELS)
        .map(([key, { label, emoji }]) => {
          const cat = report.categories[key as CheckCategory];
          if (cat.count === 0) return "";
          return `
      <div class="category-bar">
        <div class="cat-label">${emoji} ${label}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${cat.score}%; background: ${scoreColor(cat.score)};"></div>
        </div>
        <div class="cat-score" style="color: ${scoreColor(cat.score)}">${cat.score}%</div>
      </div>`;
        })
        .join("")}
    </div>

    ${Object.entries(CATEGORY_LABELS)
      .map(([key, { label, emoji }]) => {
        const checks = categorized[key as CheckCategory];
        if (!checks || checks.length === 0) return "";
        return `
    <div class="section">
      <div class="section-title">${emoji} ${label}</div>
      ${checks
        .map(
          (check) => `
      <div class="check">
        <div class="check-header">
          <span class="check-icon" style="color: ${STATUS_COLORS[check.status]}">${STATUS_ICONS[check.status]}</span>
          <div>
            <div class="check-name" style="color: ${check.status === "pass" ? "#e2e8f0" : STATUS_COLORS[check.status]}">${escapeHtml(check.name)}</div>
            <div class="check-message">${escapeHtml(check.message)}</div>
          </div>
        </div>
        ${check.details && check.status !== "pass" ? `<div class="check-details">💡 ${escapeHtml(check.details)}</div>` : ""}
      </div>`,
        )
        .join("")}
    </div>`;
      })
      .join("")}

    <div class="footer">
      <p>Generated by <a href="https://github.com/Highridge78/beacon">Beacon</a></p>
    </div>
  </div>
</body>
</html>`;
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
