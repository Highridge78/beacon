import * as cheerio from "cheerio";
import type { Check, AuditContext, CheckResult } from "../types.js";

/**
 * Evaluates whether the above-the-fold headline (H1) is clear, specific,
 * and customer-focused rather than generic or vague.
 *
 * A strong headline for a local business should:
 * - State what the business does
 * - Mention who it's for or where
 * - Convey a benefit or outcome
 */

const WEAK_HEADLINES = [
  "welcome", "home", "hello", "about us", "our company",
  "we are", "our mission", "our story", "the best",
];

const STRONG_INDICATORS = [
  // Service keywords
  "repair", "install", "replace", "build", "design", "clean", "maintain",
  "roof", "plumb", "electric", "hvac", "floor", "paint", "remodel", "renovate",
  "landscap", "pest", "move", "haul",
  // Benefit/outcome words
  "free", "fast", "reliable", "trusted", "affordable", "guaranteed", "expert",
  "professional", "licensed", "quality", "top-rated",
  // Location signals (these add relevance)
  "near", "local", "serving", "area",
];

export const headlineCheck: Check = {
  id: "headline-clarity",
  name: "Above-the-Fold Headline Clarity",
  category: "conversion",
  weight: 8,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);

    // Get the H1 text
    const h1 = $("h1").first().text().trim();

    if (!h1) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "fail",
        message: "No H1 headline found — visitors don't know what this site is about",
        details: "Your headline is the first thing people read. It should immediately tell them what you do and why they should care.",
        recommendation: "Add a clear H1 headline that states your service + location + benefit. Example: \"Expert Roof Repair in [City] — Fast, Licensed, Guaranteed.\"",
        impact: "Without a clear headline, visitors bounce within 3 seconds. You're losing the majority of your traffic before they even scroll.",
      };
    }

    const h1Lower = h1.toLowerCase();
    const wordCount = h1.split(/\s+/).length;

    // Check for weak/generic headlines
    const isWeak = WEAK_HEADLINES.some((w) => h1Lower.startsWith(w) || h1Lower === w);

    // Count strong indicators
    const strongMatches = STRONG_INDICATORS.filter((ind) => h1Lower.includes(ind));

    // Check for specificity signals
    const hasNumber = /\d+/.test(h1); // "20+ years", "100% guaranteed"
    const hasLocation = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,?\s+[A-Z]{2}\b/.test(h1) ||
      h1Lower.includes("near you") || h1Lower.includes("local") ||
      h1Lower.includes("serving") || h1Lower.includes("in your area");

    if (isWeak) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "fail",
        message: `Weak headline: "${h1.substring(0, 80)}" — too generic to convert`,
        details: "Generic headlines like \"Welcome\" or \"About Us\" don't tell visitors what you do or why they should stay.",
        recommendation: `Replace with a specific, benefit-driven headline. Instead of "${h1.substring(0, 40)}", try: "[Your Service] in [Your City] — [Key Benefit]."`,
        impact: "Generic headlines fail to differentiate. Visitors can't tell you apart from competitors and leave within seconds.",
      };
    }

    if (wordCount < 3) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `Headline is too short: "${h1}" — not enough information to convert`,
        details: "Short headlines miss the chance to communicate what you do and where. Aim for 6-12 words.",
        recommendation: `Expand your headline to include your service, location, and a benefit. Example: "${h1} — [Benefit] in [City]."`,
        impact: "Short, vague headlines don't give visitors enough reason to stay. They need to instantly understand your value.",
      };
    }

    // Score the headline quality
    let qualityScore = 0;
    if (strongMatches.length >= 2) qualityScore += 2;
    else if (strongMatches.length >= 1) qualityScore += 1;
    if (hasLocation) qualityScore += 1;
    if (hasNumber) qualityScore += 1;
    if (wordCount >= 5 && wordCount <= 15) qualityScore += 1;

    if (qualityScore >= 3) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "pass",
        message: `Strong headline: "${h1.substring(0, 80)}${h1.length > 80 ? "..." : ""}"`,
      };
    }

    if (qualityScore >= 1) {
      const missing: string[] = [];
      if (strongMatches.length === 0) missing.push("a service keyword");
      if (!hasLocation) missing.push("a location");
      if (!hasNumber) missing.push("a specificity signal (number, guarantee)");

      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `Headline is decent but could be stronger: "${h1.substring(0, 70)}${h1.length > 70 ? "..." : ""}"`,
        details: `Consider adding: ${missing.join(", ")}. The best local business headlines combine service + location + benefit.`,
        recommendation: `Strengthen your headline by adding ${missing[0] || "more specificity"}. Strong example: "Licensed [Service] in [City] — Free Estimates, Guaranteed Work."`,
        impact: "A stronger headline can increase time-on-page by 20-30%, giving visitors more reason to engage and convert.",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "warn",
      message: `Headline lacks specificity: "${h1.substring(0, 70)}${h1.length > 70 ? "..." : ""}"`,
      details: "Your headline doesn't clearly communicate what service you provide, where, or why a customer should choose you.",
      recommendation: "Rewrite to include: (1) what you do, (2) where you do it, (3) why choose you. Keep it under 15 words.",
      impact: "Visitors decide in 3-5 seconds whether to stay. A vague headline means most leave before seeing your best content.",
    };
  },
};
