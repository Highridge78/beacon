/**
 * HTML reporter — generates a client-ready, shareable audit report
 * designed to win clients, not just display data.
 *
 * Structure:
 * 1. Score hero (grade + score circle)
 * 2. Narrative summary
 * 3. Conversion impact estimate
 * 4. Top 5 Priority Fixes (the money section)
 * 5. Category breakdown with progress bars
 * 6. Detailed check results
 * 7. Footer with branding
 */

import type { AuditReport, CheckCategory, CheckResult, PriorityFix } from "../types.js";

const STATUS_ICONS: Record<string, string> = {
  pass: "✔",
  fail: "✘",
  warn: "⚠",
  skip: "○",
};

const STATUS_COLORS: Record<string, string> = {
  pass: "#22c55e",
  fail: "#ef4444",
  warn: "#f59e0b",
  skip: "#9ca3af",
};

const CATEGORY_META: Record<CheckCategory, { label: string; emoji: string; desc: string }> = {
  conversion: { label: "Conversion", emoji: "🎯", desc: "Will this site get leads?" },
  seo: { label: "SEO", emoji: "🔍", desc: "Will people find this site?" },
  trust: { label: "Trust", emoji: "🤝", desc: "Will visitors feel confident?" },
  technical: { label: "Technical", emoji: "⚙️", desc: "Does the foundation work?" },
  mobile: { label: "Mobile", emoji: "📱", desc: "Does it work on phones?" },
};

function gradeColor(grade: string): string {
  if (grade.startsWith("A")) return "#22c55e";
  if (grade.startsWith("B")) return "#84cc16";
  if (grade.startsWith("C")) return "#f59e0b";
  if (grade.startsWith("D")) return "#f97316";
  return "#ef4444";
}

function scoreColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f59e0b";
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

  const gc = gradeColor(report.grade);
  const domain = extractDomain(report.url);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Beacon Audit: ${escapeHtml(domain)} — ${report.score}/100 (${report.grade})</title>
  <style>
    :root {
      --grade: ${gc};
      --grade-bg: ${gc}15;
      --bg: #0a0e1a;
      --surface: #111827;
      --surface-2: #1a2234;
      --border: #1e293b;
      --text: #e2e8f0;
      --text-dim: #94a3b8;
      --text-muted: #64748b;
      --pass: #22c55e;
      --fail: #ef4444;
      --warn: #f59e0b;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.65;
      -webkit-font-smoothing: antialiased;
    }
    .container { max-width: 840px; margin: 0 auto; padding: 2.5rem 1.5rem; }

    /* Hero / Score Section */
    .hero {
      text-align: center;
      padding: 3rem 2rem;
      background: linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%);
      border-radius: 20px;
      border: 1px solid var(--border);
      margin-bottom: 2rem;
    }
    .hero-title {
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }
    .hero-url {
      font-size: 1.15rem;
      color: var(--text-dim);
      word-break: break-all;
      margin-bottom: 2rem;
    }
    .hero-score {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2.5rem;
      margin-bottom: 1.5rem;
    }
    .score-ring {
      width: 140px;
      height: 140px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 5px solid var(--grade);
      background: var(--grade-bg);
      position: relative;
    }
    .score-ring::after {
      content: '';
      position: absolute;
      inset: -5px;
      border-radius: 50%;
      border: 5px solid var(--grade);
      opacity: 0.3;
      filter: blur(8px);
    }
    .score-num { font-size: 3rem; font-weight: 800; color: var(--grade); line-height: 1; }
    .score-of { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
    .grade-badge {
      font-size: 4rem;
      font-weight: 900;
      color: var(--grade);
      text-shadow: 0 0 40px ${gc}40;
    }
    .hero-stats {
      display: flex;
      gap: 2rem;
      justify-content: center;
      margin-bottom: 1rem;
    }
    .stat { text-align: center; }
    .stat-num { font-size: 1.6rem; font-weight: 700; line-height: 1.2; }
    .stat-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); }
    .hero-date { font-size: 0.8rem; color: var(--text-muted); }
    .hero-perf {
      display: flex;
      gap: 1rem;
      justify-content: center;
      font-size: 0.82rem;
      color: var(--text-muted);
      margin-top: 0.5rem;
    }

    /* Section cards */
    .card {
      background: var(--surface);
      border-radius: 16px;
      border: 1px solid var(--border);
      padding: 1.75rem;
      margin-bottom: 1.5rem;
    }
    .card-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .card-title-icon { font-size: 1.2rem; }

    /* Narrative */
    .narrative {
      font-size: 1rem;
      line-height: 1.75;
      color: var(--text-dim);
    }

    /* Conversion Impact */
    .impact-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .impact-box {
      background: var(--surface-2);
      border-radius: 12px;
      padding: 1.25rem;
      text-align: center;
    }
    .impact-value { font-size: 1.8rem; font-weight: 800; line-height: 1.2; }
    .impact-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 0.25rem; }
    .impact-verdict { color: var(--text-dim); font-size: 0.92rem; line-height: 1.6; }

    /* Top 5 Fixes */
    .fix {
      display: flex;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid var(--border);
    }
    .fix:last-child { border-bottom: none; }
    .fix-rank {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.9rem;
      background: var(--grade-bg);
      color: var(--grade);
      border: 2px solid var(--grade);
    }
    .fix-content { flex: 1; }
    .fix-name { font-weight: 600; font-size: 0.95rem; }
    .fix-meta { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.15rem; }
    .fix-action { font-size: 0.88rem; color: var(--text-dim); margin-top: 0.4rem; line-height: 1.6; }
    .fix-impact { font-size: 0.82rem; color: var(--warn); margin-top: 0.3rem; font-style: italic; }

    /* Category bars */
    .cat-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border);
    }
    .cat-row:last-child { border-bottom: none; }
    .cat-label { width: 140px; font-size: 0.9rem; font-weight: 500; }
    .cat-desc { font-size: 0.75rem; color: var(--text-muted); font-weight: 400; }
    .bar-track {
      flex: 1;
      height: 10px;
      background: var(--surface-2);
      border-radius: 5px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      border-radius: 5px;
      transition: width 0.5s ease;
    }
    .cat-score {
      width: 50px;
      text-align: right;
      font-weight: 700;
      font-size: 0.95rem;
    }
    .cat-count {
      width: 60px;
      text-align: right;
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    /* Check details */
    .section-title {
      font-size: 1.05rem;
      font-weight: 700;
      padding: 0.75rem 0 0.5rem;
      border-bottom: 2px solid var(--border);
      margin-bottom: 0.5rem;
    }
    .check {
      padding: 0.75rem 0;
      border-bottom: 1px solid #1e293b30;
    }
    .check:last-child { border-bottom: none; }
    .check-header {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
    }
    .check-icon { font-size: 0.95rem; flex-shrink: 0; margin-top: 2px; }
    .check-name { font-weight: 600; font-size: 0.92rem; }
    .check-msg { color: var(--text-dim); font-size: 0.82rem; margin-top: 0.1rem; }
    .check-detail {
      margin-top: 0.4rem;
      margin-left: 1.55rem;
      padding: 0.5rem 0.75rem;
      background: var(--surface-2);
      border-radius: 8px;
      font-size: 0.82rem;
      color: var(--text-dim);
      border-left: 3px solid var(--border);
      line-height: 1.6;
    }
    .check-rec {
      margin-top: 0.3rem;
      margin-left: 1.55rem;
      padding: 0.5rem 0.75rem;
      background: #22c55e08;
      border-radius: 8px;
      font-size: 0.82rem;
      color: #86efac;
      border-left: 3px solid #22c55e40;
      line-height: 1.6;
    }

    /* Footer */
    .footer {
      text-align: center;
      padding: 2rem 0;
      color: var(--text-muted);
      font-size: 0.8rem;
    }
    .footer a { color: var(--text-muted); text-decoration: none; }
    .footer a:hover { color: var(--text-dim); }
    .footer-brand {
      font-weight: 600;
      font-size: 0.85rem;
      margin-bottom: 0.25rem;
    }

    @media (max-width: 640px) {
      .container { padding: 1rem; }
      .hero { padding: 2rem 1rem; }
      .hero-score { flex-direction: column; gap: 1rem; }
      .impact-grid { grid-template-columns: 1fr; }
      .hero-stats { flex-wrap: wrap; }
      .cat-row { flex-wrap: wrap; gap: 0.5rem; }
      .cat-label { width: 100%; }
    }
  </style>
</head>
<body>
  <div class="container">

    <!-- HERO -->
    <div class="hero">
      <div class="hero-title">Beacon Site Audit</div>
      <div class="hero-url">${escapeHtml(report.url)}</div>
      <div class="hero-score">
        <div class="score-ring">
          <div class="score-num">${report.score}</div>
          <div class="score-of">out of 100</div>
        </div>
        <div class="grade-badge">${report.grade}</div>
      </div>
      <div class="hero-stats">
        <div class="stat">
          <div class="stat-num" style="color: var(--pass)">${passed}</div>
          <div class="stat-label">Passed</div>
        </div>
        <div class="stat">
          <div class="stat-num" style="color: var(--fail)">${failed}</div>
          <div class="stat-label">Failed</div>
        </div>
        <div class="stat">
          <div class="stat-num" style="color: var(--warn)">${warned}</div>
          <div class="stat-label">Warnings</div>
        </div>
        <div class="stat">
          <div class="stat-num" style="color: var(--text-dim)">${report.checks.length}</div>
          <div class="stat-label">Total Checks</div>
        </div>
      </div>
      <div class="hero-date">${date}</div>
      <div class="hero-perf">
        <span>Load time: ${(report.performance.loadTime / 1000).toFixed(2)}s</span>
        <span>·</span>
        <span>TTFB: ${(report.performance.ttfb / 1000).toFixed(2)}s</span>
      </div>
    </div>

    <!-- NARRATIVE -->
    ${report.narrative ? `
    <div class="card">
      <div class="card-title"><span class="card-title-icon">📋</span> Summary</div>
      <div class="narrative">${escapeHtml(report.narrative)}</div>
    </div>` : ""}

    <!-- CONVERSION IMPACT -->
    ${report.conversionImpact ? `
    <div class="card">
      <div class="card-title"><span class="card-title-icon">📊</span> Estimated Conversion Impact</div>
      <div class="impact-grid">
        <div class="impact-box">
          <div class="impact-value" style="color: var(--fail)">${escapeHtml(report.conversionImpact.estimatedLeadLoss)}</div>
          <div class="impact-label">Estimated Lead Loss</div>
        </div>
        <div class="impact-box">
          <div class="impact-value" style="color: var(--pass)">${escapeHtml(report.conversionImpact.potentialImprovement)}</div>
          <div class="impact-label">Potential Improvement</div>
        </div>
      </div>
      <div class="impact-verdict">${escapeHtml(report.conversionImpact.verdict)}</div>
    </div>` : ""}

    <!-- TOP 5 FIXES -->
    ${report.topFixes && report.topFixes.length > 0 ? `
    <div class="card">
      <div class="card-title"><span class="card-title-icon">🔧</span> Top ${report.topFixes.length} Priority Fixes</div>
      ${report.topFixes.map((fix) => `
      <div class="fix">
        <div class="fix-rank">${fix.rank}</div>
        <div class="fix-content">
          <div class="fix-name">${escapeHtml(fix.checkName)}</div>
          <div class="fix-meta">${CATEGORY_META[fix.category]?.emoji || ""} ${CATEGORY_META[fix.category]?.label || fix.category} · Est. ${fix.effort}</div>
          <div class="fix-action">${escapeHtml(fix.action)}</div>
          <div class="fix-impact">⚡ ${escapeHtml(fix.impact)}</div>
        </div>
      </div>`).join("")}
    </div>` : ""}

    <!-- CATEGORY SCORES -->
    <div class="card">
      <div class="card-title"><span class="card-title-icon">📈</span> Category Scores</div>
      ${Object.entries(CATEGORY_META)
        .map(([key, meta]) => {
          const cat = report.categories[key as CheckCategory];
          if (cat.count === 0) return "";
          const sc = scoreColor(cat.score);
          return `
      <div class="cat-row">
        <div class="cat-label">${meta.emoji} ${meta.label}<br><span class="cat-desc">${meta.desc}</span></div>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${cat.score}%; background: ${sc};"></div>
        </div>
        <div class="cat-score" style="color: ${sc}">${cat.score}%</div>
        <div class="cat-count">${cat.passed}/${cat.count}</div>
      </div>`;
        })
        .join("")}
    </div>

    <!-- DETAILED RESULTS -->
    <div class="card">
      <div class="card-title"><span class="card-title-icon">🔎</span> Detailed Results</div>
    ${Object.entries(CATEGORY_META)
      .map(([key, meta]) => {
        const checks = categorized[key as CheckCategory];
        if (!checks || checks.length === 0) return "";
        return `
      <div class="section-title">${meta.emoji} ${meta.label}</div>
      ${checks
        .map(
          (check) => `
      <div class="check">
        <div class="check-header">
          <span class="check-icon" style="color: ${STATUS_COLORS[check.status]}">${STATUS_ICONS[check.status]}</span>
          <div>
            <div class="check-name" style="color: ${check.status === "pass" ? "var(--text)" : STATUS_COLORS[check.status]}">${escapeHtml(check.name)}</div>
            <div class="check-msg">${escapeHtml(check.message)}</div>
          </div>
        </div>
        ${check.details && check.status !== "pass" ? `<div class="check-detail">💡 ${escapeHtml(check.details)}</div>` : ""}
        ${check.recommendation && check.status !== "pass" ? `<div class="check-rec">🔧 ${escapeHtml(check.recommendation)}</div>` : ""}
      </div>`,
        )
        .join("")}`;
      })
      .join("")}
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <div class="footer-brand">Generated by Beacon</div>
      <a href="https://github.com/Highridge78/beacon">github.com/Highridge78/beacon</a>
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

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
