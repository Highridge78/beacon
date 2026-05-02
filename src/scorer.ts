/**
 * Scoring algorithm — converts check results into an overall score and grade
 */

import type { AuditReport, CheckCategory, CheckResult } from "./types.js";

export function calculateScore(checks: CheckResult[]): {
  score: number;
  grade: string;
  categories: AuditReport["categories"];
} {
  const categories: AuditReport["categories"] = {
    conversion: { score: 0, total: 0, passed: 0, count: 0 },
    seo: { score: 0, total: 0, passed: 0, count: 0 },
    trust: { score: 0, total: 0, passed: 0, count: 0 },
    technical: { score: 0, total: 0, passed: 0, count: 0 },
    mobile: { score: 0, total: 0, passed: 0, count: 0 },
  };

  let totalWeight = 0;
  let earnedWeight = 0;

  for (const check of checks) {
    if (check.status === "skip") continue;

    const cat = categories[check.category];
    cat.count++;
    cat.total += check.weight;
    totalWeight += check.weight;

    if (check.status === "pass") {
      cat.passed++;
      cat.score += check.weight;
      earnedWeight += check.weight;
    } else if (check.status === "warn") {
      // Partial credit for warnings
      cat.score += check.weight * 0.5;
      earnedWeight += check.weight * 0.5;
    }
  }

  // Calculate category percentages
  for (const key of Object.keys(categories) as CheckCategory[]) {
    const cat = categories[key];
    if (cat.total > 0) {
      cat.score = Math.round((cat.score / cat.total) * 100);
    }
  }

  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  const grade = scoreToGrade(score);

  return { score, grade, categories };
}

function scoreToGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "A-";
  if (score >= 70) return "B";
  if (score >= 60) return "B-";
  if (score >= 50) return "C";
  if (score >= 40) return "C-";
  if (score >= 30) return "D";
  if (score >= 20) return "D-";
  return "F";
}
