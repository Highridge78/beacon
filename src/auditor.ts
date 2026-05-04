/**
 * Main audit orchestrator — fetches the page, runs all checks, produces report
 */

import { fetchPage } from "./fetcher.js";
import { allChecks } from "./checks/index.js";
import { calculateScore } from "./scorer.js";
import { generateTopFixes, estimateConversionImpact, generateNarrative } from "./narrative.js";
import { detectBusinessType } from "./business-type.js";
import { applyContextualRecommendations } from "./recommendations.js";
import type { AuditReport, CheckResult } from "./types.js";

export async function audit(url: string): Promise<AuditReport> {
  // Fetch the page
  const ctx = await fetchPage(url);

  // Detect business type from page content
  const { type: businessType, confidence: businessTypeConfidence } = detectBusinessType(ctx.html);

  // Run all checks
  const rawResults: CheckResult[] = [];

  for (const check of allChecks) {
    try {
      const result = await check.run(ctx);
      rawResults.push(result);
    } catch (error) {
      // If a check crashes, record it as skipped
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

  // Apply contextual recommendations based on business type
  const results = applyContextualRecommendations(rawResults, businessType);

  // Calculate scores
  const { score, grade, categories } = calculateScore(results);

  // Generate priority fixes (using contextualized results)
  const topFixes = generateTopFixes(results);

  // Estimate conversion impact
  const conversionImpact = estimateConversionImpact(results);

  // Build report (narrative needs the full report context)
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
    performance: {
      ttfb: ctx.ttfb,
      loadTime: ctx.loadTime,
    },
    topFixes,
    conversionImpact,
    narrative: "", // placeholder — generated below
  };

  // Generate narrative (needs the full report)
  report.narrative = generateNarrative(report);

  return report;
}
