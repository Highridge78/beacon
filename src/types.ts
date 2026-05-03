/**
 * Core types for Beacon
 */

export type CheckStatus = "pass" | "fail" | "warn" | "skip";

export type CheckCategory = "conversion" | "seo" | "trust" | "technical" | "mobile";

export interface CheckResult {
  /** Unique check identifier */
  id: string;
  /** Human-readable check name */
  name: string;
  /** Category for grouping */
  category: CheckCategory;
  /** Pass, fail, warn, or skip */
  status: CheckStatus;
  /** What we found */
  message: string;
  /** Detailed findings or recommendations */
  details?: string;
  /** Score contribution weight (1-10, higher = more important) */
  weight: number;
  /** Actionable recommendation for fixing the issue */
  recommendation?: string;
  /** Estimated revenue/lead impact of this issue */
  impact?: string;
}

export interface AuditContext {
  /** The URL being audited */
  url: string;
  /** Resolved/final URL after redirects */
  finalUrl: string;
  /** Raw HTML content */
  html: string;
  /** HTTP status code */
  statusCode: number;
  /** Response headers */
  headers: Record<string, string>;
  /** Time to first byte (ms) */
  ttfb: number;
  /** Total load time (ms) */
  loadTime: number;
  /** Whether the URL uses HTTPS */
  isHttps: boolean;
}

export interface Check {
  /** Unique identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Category */
  category: CheckCategory;
  /** Weight (1-10) */
  weight: number;
  /** Run the check against the fetched page */
  run(ctx: AuditContext): Promise<CheckResult> | CheckResult;
}

export interface PriorityFix {
  /** Rank 1-5 */
  rank: number;
  /** Check that flagged the issue */
  checkId: string;
  /** Human-readable check name */
  checkName: string;
  /** Category */
  category: CheckCategory;
  /** What to fix */
  action: string;
  /** Why it matters (revenue/lead impact) */
  impact: string;
  /** How long it typically takes */
  effort: string;
}

export interface ConversionImpact {
  /** Estimated % of leads being lost */
  estimatedLeadLoss: string;
  /** Estimated conversion improvement if all issues fixed */
  potentialImprovement: string;
  /** Plain-english verdict */
  verdict: string;
}

export interface AuditReport {
  /** URL that was audited */
  url: string;
  /** Final URL after redirects */
  finalUrl: string;
  /** When the audit ran */
  timestamp: string;
  /** Overall score 0-100 */
  score: number;
  /** Letter grade A-F */
  grade: string;
  /** Individual check results */
  checks: CheckResult[];
  /** Category scores */
  categories: Record<CheckCategory, { score: number; total: number; passed: number; count: number }>;
  /** Performance metrics */
  performance: {
    ttfb: number;
    loadTime: number;
  };
  /** Top 5 priority fixes ranked by impact */
  topFixes: PriorityFix[];
  /** Estimated conversion impact */
  conversionImpact: ConversionImpact;
  /** Client-facing audit narrative */
  narrative: string;
}
