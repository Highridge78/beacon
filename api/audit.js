/**
 * Beacon Web UI — Vercel serverless function (POST /api/audit)
 *
 * Thin wrapper around Beacon's existing audit engine. It calls the same
 * `audit()` orchestrator and renders the existing `toHtml()` report verbatim.
 * No AI / LLM. Pure fetch + Cheerio (inherited from the engine).
 *
 * Vercel runs `npm run build` (see vercel.json) before bundling this function,
 * so the compiled engine in ../dist is available at import time.
 */

import { audit } from "../dist/auditor.js";
import { toHtml } from "../dist/reporter/html.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  const { url } = req.body || {};
  if (!url || typeof url !== "string" || url.trim().length === 0) {
    res.status(400).json({ error: "A valid URL is required." });
    return;
  }

  try {
    const report = await audit(url.trim());
    const html = toHtml(report);
    res.status(200).json({
      html,
      score: report.score,
      grade: report.grade,
      url: report.finalUrl,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Audit failed.",
    });
  }
}
