/**
 * Beacon Web UI — local server
 *
 * A thin Express wrapper around Beacon's existing audit engine.
 * It does NOT reimplement any scoring or checks. It calls the engine's
 * `audit()` orchestrator and renders its existing `toHtml()` report verbatim.
 *
 * No AI / LLM is used anywhere. The engine is pure fetch + Cheerio.
 *
 * Run:  npm start   (builds the engine, then starts this server)
 * Port: process.env.PORT || 3000
 */

import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { audit } from "./dist/auditor.js";
import { toHtml } from "./dist/reporter/html.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(join(__dirname, "public")));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Run an audit and return the engine's HTML report verbatim
app.post("/api/audit", async (req, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== "string" || url.trim().length === 0) {
    res.status(400).json({ error: "A valid URL is required." });
    return;
  }

  try {
    const report = await audit(url.trim());
    const html = toHtml(report);
    res.json({
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
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  Beacon Web UI  →  http://localhost:${PORT}\n`);
});
