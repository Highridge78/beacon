/**
 * Main audit orchestrator — fetches the page, runs all checks, produces report
 */

import { fetchPage } from "./fetcher.js";
import { allChecks } from "./checks/index.js";
import { calculateScore } from "./scorer.js";
import type { AuditReport, CheckResult } from "./types.js";

export async function audit(url: string): Promise<AuditReport> {
  // Fetch the page
  const ctx = await fetchPage(url);

  // Run all checks
  const results: CheckResult[] = [];

  for (const check of allChecks) {
    try {
      const result = await check.run(ctx);
      results.push(result);
    } catch (error) {
      // If a check crashes, record it as skipped
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

  // Calculate scores
  const { score, grade, categories } = calculateScore(results);

  return {
    url: ctx.url,
    finalUrl: ctx.finalUrl,
    timestamp: new Date().toISOString(),
    score,
    grade,
    checks: results,
    categories,
    performance: {
      ttfb: ctx.ttfb,
      loadTime: ctx.loadTime,
    },
  };
}
