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
        recommendation: "Add a title tag under 60 characters with format: \"[Primary Service] in [City], [State] | [Business Name]\".",
        impact: "The title tag is what people see in Google search results. Without it, Google generates its own (usually poorly), and your click-through rate drops significantly.",
      };
    }

    const issues: string[] = [];

    if (title.length < 20) {
      issues.push("too short (under 20 characters)");
    } else if (title.length > 60) {
      issues.push(`too long (${title.length} chars — Google truncates at ~60)`);
    }

    const genericTitles = ["home", "welcome", "untitled", "my site", "website"];
    if (genericTitles.some((g) => title.toLowerCase() === g)) {
      issues.push("generic/default title");
    }

    const hasLocation = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,?\s+[A-Z]{2}\b/.test(title);

    if (issues.length > 0) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `Title found but has issues: ${issues.join(", ")}`,
        details: `Current title: "${title}". For local businesses, include your primary service + city in the title.`,
        recommendation: `Rewrite to: "[Your Primary Service] in [City], [State] | [Business Name]". Keep under 60 characters. Example: "Expert Roof Repair in Asheville, NC | Smith Roofing".`,
        impact: "Title tag issues directly affect your Google click-through rate. A well-optimized title can increase search traffic 20-30% with zero additional ranking effort.",
      };
    }

    if (!hasLocation) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `Title looks good but may be missing a location`,
        details: `Current title: "${title}". Local businesses should include their city/area in the title tag.`,
        recommendation: `Add your primary city and state to the title. Format: "[Service] in [City], [State] | [Business Name]".`,
        impact: "Without a city in your title, you're invisible for \"[service] in [city]\" searches — the highest-intent local search pattern.",
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
        details: "Meta descriptions appear in search results and influence click-through rates.",
        recommendation: "Write a 120-155 character meta description that includes: what you do, where, and a call to action. Example: \"Licensed roofers in Asheville, NC. Free inspections, same-day estimates. Call (828) 555-0100.\"",
        impact: "A compelling meta description can increase your search click-through rate by 5-15%. Google uses it as the snippet below your page title in results.",
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
        recommendation: "Rewrite to 120-155 characters. Include your primary service, location, a key differentiator, and phone number if it fits.",
        impact: "An improperly sized meta description gets truncated or ignored by Google, reducing your search snippet quality and click-through rate.",
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
        details: "Every page needs exactly one H1 tag that clearly states what the page is about. It's a key SEO signal.",
        recommendation: "Add a single H1 tag that includes your primary service and location. Place it as the main headline of the page.",
        impact: "The H1 is the strongest on-page SEO signal after the title tag. Without it, Google has less confidence about what your page is about.",
      };
    }

    if (h1s.length > 1) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `${h1s.length} H1 tags found — should have exactly one`,
        details: "Multiple H1 tags dilute the page's topical focus. Use one H1 for the main heading, H2-H6 for subheadings.",
        recommendation: "Keep only one H1 tag. Change the others to H2 or H3. The H1 should be your primary keyword + location.",
        impact: "Multiple H1s confuse search engines about the main topic of your page, potentially diluting your ranking for your primary keyword.",
      };
    }

    const h1Text = h1s.first().text().trim();
    if (h1Text.length < 5) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `H1 found but too short: "${h1Text}"`,
        details: "Your H1 should clearly describe your service and location.",
        recommendation: `Expand to: "[Primary Service] in [City] — [Key Benefit]". Example: "Professional Roofing Services in Asheville — Licensed & Insured".`,
        impact: "A short H1 misses the opportunity to target local keywords and communicate value to both visitors and search engines.",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "pass",
      message: `H1 found: "${h1Text.substring(0, 80)}${h1Text.length > 80 ? "..." : ""}"`,
    };
  },
};
