import * as cheerio from "cheerio";
import type { Check, AuditContext, CheckResult } from "../types.js";

export const metaTitleCheck: Check = {
  id: "meta-title",
  name: "Meta Title Quality",
  category: "seo",
  weight: 6,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);
    const title = $("title").text().trim();

    if (!title) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "fail",
        message: "No <title> tag found",
        details: "The title tag is the most important on-page SEO element. It appears in search results and browser tabs.",
      };
    }

    const issues: string[] = [];

    if (title.length < 20) {
      issues.push("too short (under 20 characters)");
    } else if (title.length > 60) {
      issues.push(`too long (${title.length} chars — Google truncates at ~60)`);
    }

    // Check for generic titles
    const genericTitles = ["home", "welcome", "untitled", "my site", "website"];
    if (genericTitles.some((g) => title.toLowerCase() === g)) {
      issues.push("generic/default title");
    }

    // Check for location (important for local businesses)
    // This is a soft check — we can't know the business location
    const hasLocation = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,?\s+[A-Z]{2}\b/.test(title);

    if (issues.length > 0) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `Title found but has issues: ${issues.join(", ")}`,
        details: `Current title: "${title}". For local businesses, include your primary service + city in the title (e.g., "Expert Roof Repair in Asheville, NC | Company Name").`,
      };
    }

    if (!hasLocation) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `Title looks good but may be missing a location`,
        details: `Current title: "${title}". Local businesses should include their city/area in the title tag for local search visibility.`,
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "pass",
      message: `Good title tag (${title.length} chars): "${title}"`,
    };
  },
};

export const metaDescriptionCheck: Check = {
  id: "meta-description",
  name: "Meta Description Quality",
  category: "seo",
  weight: 5,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);
    const desc =
      $('meta[name="description"]').attr("content")?.trim() || "";

    if (!desc) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "fail",
        message: "No meta description found",
        details:
          "Meta descriptions appear in search results and influence click-through rates. Write a compelling 120-155 character description with your services and location.",
      };
    }

    const issues: string[] = [];

    if (desc.length < 70) {
      issues.push("too short (under 70 characters)");
    } else if (desc.length > 160) {
      issues.push(`too long (${desc.length} chars — Google truncates at ~155)`);
    }

    if (issues.length > 0) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `Meta description found but ${issues.join(", ")}`,
        details: `Current description (${desc.length} chars): "${desc.substring(0, 100)}..."`,
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "pass",
      message: `Good meta description (${desc.length} chars)`,
    };
  },
};

export const h1Check: Check = {
  id: "h1-tag",
  name: "H1 Heading Present",
  category: "seo",
  weight: 5,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);
    const h1s = $("h1");

    if (h1s.length === 0) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "fail",
        message: "No H1 heading found",
        details:
          "Every page needs exactly one H1 tag that clearly states what the page is about. It's a key SEO signal.",
      };
    }

    if (h1s.length > 1) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `${h1s.length} H1 tags found — should have exactly one`,
        details: "Multiple H1 tags dilute the page's topical focus. Use one H1 for the main heading, H2-H6 for subheadings.",
      };
    }

    const h1Text = h1s.first().text().trim();
    if (h1Text.length < 5) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `H1 found but too short: "${h1Text}"`,
        details: "Your H1 should clearly describe your service and location (e.g., 'Professional Roofing Services in Asheville').",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "pass",
      message: `H1 found: "${h1Text.substring(0, 80)}${h1Text.length > 80 ? "..." : ""}"`,
    };
  },
};
