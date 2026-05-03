import * as cheerio from "cheerio";
import type { Check, AuditContext, CheckResult } from "../types.js";

const CTA_KEYWORDS = [
  "get a quote",
  "get quote",
  "free quote",
  "free estimate",
  "get estimate",
  "get started",
  "contact us",
  "call now",
  "call today",
  "book now",
  "book a call",
  "schedule",
  "request a quote",
  "request quote",
  "get in touch",
  "let's talk",
  "reach out",
  "start your project",
  "hire us",
];

export const ctaCheck: Check = {
  id: "cta-above-fold",
  name: "CTA Above the Fold",
  category: "conversion",
  weight: 9,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);

    // Look for CTA buttons/links in header, hero, or first sections
    const aboveFoldSelectors = [
      "header",
      "nav",
      ".hero",
      "#hero",
      "[class*='hero']",
      "section:first-of-type",
      ".banner",
      ".jumbotron",
      "[class*='banner']",
    ];

    const aboveFoldLinks = aboveFoldSelectors.flatMap((sel) =>
      $(sel)
        .find("a, button")
        .map((_, el) => $(el).text().toLowerCase().trim())
        .get(),
    );

    const allLinks = $("a, button")
      .map((_, el) => $(el).text().toLowerCase().trim())
      .get();

    const aboveFoldCtas = aboveFoldLinks.filter((text) =>
      CTA_KEYWORDS.some((kw) => text.includes(kw)),
    );

    const allCtas = allLinks.filter((text) =>
      CTA_KEYWORDS.some((kw) => text.includes(kw)),
    );

    if (aboveFoldCtas.length > 0) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "pass",
        message: `CTA found above the fold: "${aboveFoldCtas[0]}"`,
      };
    }

    if (allCtas.length > 0) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `CTA found ("${allCtas[0]}") but not in the hero/header area`,
        details: "Move your primary CTA into the hero section. Users decide within 3-5 seconds whether to stay on a page.",
        recommendation: "Add a large, high-contrast CTA button (\"Get Free Quote\" or \"Call Now\") to your hero section, above the fold. Make it the most visually prominent element.",
        impact: "Visitors who can't find a next step within 5 seconds leave. Moving a CTA above the fold typically increases conversions 20-30%.",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "fail",
      message: "No clear call-to-action found on the page",
      details: "Every local business page needs a clear CTA button — \"Get Free Quote\", \"Call Now\", \"Schedule Today\". Without one, visitors leave without converting.",
      recommendation: "Add a CTA button to your hero section immediately. Use action language: \"Get Your Free Estimate\", \"Call Now for Same-Day Service\", or \"Book Your Free Consultation\".",
      impact: "This is the single highest-impact fix. A page without a CTA is a dead end — visitors literally cannot take the next step, even if they want to.",
    };
  },
};
