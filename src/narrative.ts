/**
 * Narrative generator — creates a client-facing summary paragraph
 * that explains what's wrong, why it matters, and what to fix first.
 *
 * This is the "sales layer" — the output that wins clients.
 */

import type { AuditReport, CheckCategory, CheckResult, PriorityFix, ConversionImpact } from "./types.js";

/**
 * Impact weights — estimated % of conversions lost per failed check.
 * Conservative but defensible from marketing research.
 */
const IMPACT_WEIGHTS: Record<string, number> = {
  "cta-above-fold": 25,
  "phone-number": 20,
  "click-to-call": 15,
  "headline-clarity": 15,
  "sticky-header-cta": 10,
  "contact-form": 15,
  "offer-presence": 10,
  "navigation-clarity": 5,
  "reviews-testimonials": 15,
  "trust-stacking": 15,
  "google-reviews": 10,
  "trust-signals": 10,
  "address-visible": 5,
  "footer-completeness": 3,
  "social-links": 3,
  "privacy-policy": 2,
  "schema-local-business": 8,
  "meta-title": 5,
  "meta-description": 3,
  "h1-tag": 5,
  "service-area-clarity": 5,
  "schema-service": 2,
  "image-alt-tags": 3,
  "internal-links": 3,
  "ssl-https": 20,
  "page-speed": 10,
  "viewport-meta": 15,
};

const EFFORT_MAP: Record<string, string> = {
  "cta-above-fold": "30 minutes",
  "phone-number": "15 minutes",
  "click-to-call": "5 minutes",
  "headline-clarity": "30 minutes",
  "sticky-header-cta": "1-2 hours",
  "contact-form": "1-2 hours",
  "offer-presence": "1 hour",
  "navigation-clarity": "1-2 hours",
  "reviews-testimonials": "2-4 hours",
  "trust-stacking": "2-4 hours",
  "google-reviews": "2-3 hours",
  "trust-signals": "1-2 hours",
  "address-visible": "15 minutes",
  "footer-completeness": "1-2 hours",
  "social-links": "30 minutes",
  "privacy-policy": "30 minutes",
  "schema-local-business": "1-2 hours",
  "meta-title": "15 minutes",
  "meta-description": "15 minutes",
  "h1-tag": "15 minutes",
  "service-area-clarity": "2-3 hours",
  "schema-service": "1 hour",
  "image-alt-tags": "1 hour",
  "internal-links": "1-2 hours",
  "ssl-https": "30 minutes",
  "page-speed": "2-4 hours",
  "viewport-meta": "5 minutes",
};

/**
 * Generate the Top 5 priority fixes ranked by impact
 */
export function generateTopFixes(checks: CheckResult[]): PriorityFix[] {
  const failed = checks.filter((c) => c.status === "fail" || c.status === "warn");

  // Sort by impact weight × check weight (descending)
  const ranked = failed.sort((a, b) => {
    const aImpact = (IMPACT_WEIGHTS[a.id] || 5) * a.weight;
    const bImpact = (IMPACT_WEIGHTS[b.id] || 5) * b.weight;
    // Prefer "fail" over "warn" at same score
    if (aImpact === bImpact) {
      return a.status === "fail" ? -1 : 1;
    }
    return bImpact - aImpact;
  });

  return ranked.slice(0, 5).map((check, i) => ({
    rank: i + 1,
    checkId: check.id,
    checkName: check.name,
    category: check.category,
    action: check.recommendation || check.details || check.message,
    impact: check.impact || getDefaultImpact(check),
    effort: EFFORT_MAP[check.id] || "1-2 hours",
  }));
}

/**
 * Estimate conversion impact from failed checks
 */
export function estimateConversionImpact(checks: CheckResult[]): ConversionImpact {
  const failed = checks.filter((c) => c.status === "fail");
  const warned = checks.filter((c) => c.status === "warn");

  // Calculate weighted loss — use diminishing returns (not additive)
  let retainRate = 1.0;
  for (const check of failed) {
    const impact = (IMPACT_WEIGHTS[check.id] || 5) / 100;
    retainRate *= (1 - impact);
  }
  for (const check of warned) {
    const impact = ((IMPACT_WEIGHTS[check.id] || 5) / 100) * 0.5; // Warnings at half impact
    retainRate *= (1 - impact);
  }

  const lossPercent = Math.round((1 - retainRate) * 100);
  const improvementPercent = Math.min(lossPercent, 60); // Cap improvement estimate

  let verdict: string;
  if (lossPercent >= 50) {
    verdict = "This site is losing the majority of its potential leads. Critical fixes needed immediately.";
  } else if (lossPercent >= 30) {
    verdict = "Significant lead leakage — roughly 1 in 3 potential customers is being lost to fixable issues.";
  } else if (lossPercent >= 15) {
    verdict = "Moderate room for improvement — the foundation is there but leads are slipping through gaps.";
  } else {
    verdict = "This site is well-optimized. Minor tweaks could still improve conversions.";
  }

  return {
    estimatedLeadLoss: `~${lossPercent}%`,
    potentialImprovement: `Up to ${improvementPercent}% more leads`,
    verdict,
  };
}

/**
 * Generate a client-facing narrative paragraph
 */
export function generateNarrative(report: AuditReport): string {
  const { score, grade, checks, url, categories, topFixes, conversionImpact } = report;

  const domain = extractDomain(url);
  const failed = checks.filter((c) => c.status === "fail");
  const warned = checks.filter((c) => c.status === "warn");
  const passed = checks.filter((c) => c.status === "pass");
  const total = checks.length;

  // Find worst category
  const catEntries = Object.entries(categories) as [CheckCategory, { score: number; count: number }][];
  const worstCat = catEntries
    .filter(([_, v]) => v.count > 0)
    .sort((a, b) => a[1].score - b[1].score)[0];

  const catLabels: Record<CheckCategory, string> = {
    conversion: "conversion readiness",
    seo: "search visibility",
    trust: "trust and credibility",
    technical: "technical foundation",
    mobile: "mobile experience",
  };

  // Build the narrative
  const parts: string[] = [];

  // Opening — overall assessment
  if (score >= 85) {
    parts.push(`${domain} scored ${score}/100 (${grade}) — a strong foundation with a few areas to tighten up. ${passed.length} of ${total} checks passed.`);
  } else if (score >= 65) {
    parts.push(`${domain} scored ${score}/100 (${grade}). The site has good fundamentals but ${failed.length} issues are holding it back from converting at its full potential. ${passed.length} of ${total} checks passed.`);
  } else if (score >= 45) {
    parts.push(`${domain} scored ${score}/100 (${grade}) — below average for a local business site. ${failed.length} checks failed outright and ${warned.length} need improvement. There is significant room to improve.`);
  } else {
    parts.push(`${domain} scored ${score}/100 (${grade}). This site has fundamental issues that are actively losing leads. ${failed.length} of ${total} checks failed. Most visitors are leaving without contacting the business.`);
  }

  // Biggest problem area
  if (worstCat && worstCat[1].score < 60) {
    parts.push(`The biggest gap is in ${catLabels[worstCat[0]]} (${worstCat[1].score}%).`);
  }

  // Conversion impact
  parts.push(conversionImpact.verdict);

  // Top fix preview
  if (topFixes.length > 0) {
    const fix1 = topFixes[0];
    parts.push(`The #1 priority fix: ${fix1.checkName.toLowerCase()} (estimated effort: ${fix1.effort}).`);
  }

  return parts.join(" ");
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getDefaultImpact(check: CheckResult): string {
  const impacts: Record<CheckCategory, string> = {
    conversion: "Directly reducing the number of leads this site generates.",
    seo: "Reducing visibility in search results, limiting organic traffic.",
    trust: "Making visitors less likely to contact or trust this business.",
    technical: "Creating barriers that prevent visitors from using the site effectively.",
    mobile: "Losing mobile visitors who can't use the site properly on their phone.",
  };
  return impacts[check.category];
}
