/**
 * JSON reporter — machine-readable output
 */

import type { AuditReport } from "../types.js";

export function toJson(report: AuditReport): string {
  return JSON.stringify(report, null, 2);
}
