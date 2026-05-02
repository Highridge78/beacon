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
}
