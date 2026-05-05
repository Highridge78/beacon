import * as cheerio from "cheerio";
import type { Check, AuditContext, CheckResult } from "../types.js";
import { extractRawStateBlob, extractEmbeddedHtmlWidgets } from "../embedded-content.js";

/**
 * Meta-check that evaluates whether the site stacks multiple trust signals
 * together for maximum persuasion effect.
 *
 * Individual trust signals are good. Trust STACKING is what closes deals.
 * The best local business sites combine 5+ of these:
 * - Years in business
 * - Licensed & insured
 * - Reviews/testimonials
 * - Guarantees
 * - Certifications/awards
 * - Before/after photos
 * - Team photos (real people)
 * - Association badges (BBB, Chamber of Commerce)
 */
export const trustStackCheck: Check = {
  id: "trust-stacking",
  name: "Trust Signal Stacking",
  category: "trust",
  weight: 7,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);
    const bodyText = $("body").text().toLowerCase();
    const html = ctx.html.toLowerCase();

    const signals: string[] = [];

    // 1. Years in business / established date
    if (/\d+\+?\s*years?\s*(of\s+)?experience/i.test(bodyText) || /since\s+\d{4}/i.test(bodyText) || /established\s+\d{4}/i.test(bodyText)) {
      signals.push("years in business");
    }

    // 2. Licensed & insured
    if (bodyText.includes("licensed") || bodyText.includes("insured") || bodyText.includes("bonded")) {
      signals.push("licensed/insured");
    }

    // 3. Reviews / testimonials present (check DOM and embedded data)
    if (bodyText.includes("testimonial") || bodyText.includes("review") || bodyText.includes("what our customers") || bodyText.includes("★") || bodyText.includes("⭐")) {
      signals.push("reviews/testimonials");
    }
    if (!signals.includes("reviews/testimonials")) {
      const fullHtml = ctx.html.toLowerCase();
      if (fullHtml.includes("testimonial") || fullHtml.includes("testimonialslideshowcount") || fullHtml.includes("homepagetestimonialcount")) {
        signals.push("reviews/testimonials");
      }
    }

    // 4. Guarantees
    if (bodyText.includes("guarantee") || bodyText.includes("warranty") || bodyText.includes("satisfaction")) {
      signals.push("guarantee/warranty");
    }

    // 5. Certifications / awards / industry credentials
    if (bodyText.includes("certified") || bodyText.includes("accredited") || bodyText.includes("award") || bodyText.includes("recognition")) {
      signals.push("certifications/awards");
    }

    // Real estate / industry credential badges (Realtor, MLS, NAR, Equal Housing)
    if (!signals.includes("certifications/awards")) {
      const fullHtml = ctx.html.toLowerCase();
      if (
        fullHtml.includes("realtor") || fullHtml.includes("equal-housing") ||
        fullHtml.includes("equal housing") || fullHtml.includes("fair housing") ||
        (fullHtml.includes("mls") && fullHtml.includes("board"))
      ) {
        signals.push("certifications/awards");
      }
    }

    // 6. Before/after imagery
    if (bodyText.includes("before") && bodyText.includes("after")) {
      signals.push("before/after portfolio");
    }

    // 7. Team / owner photos (check for people-related image alts)
    const peopleImages = $("img").filter((_, el) => {
      const alt = ($(el).attr("alt") || "").toLowerCase();
      return alt.includes("team") || alt.includes("owner") || alt.includes("founder") || alt.includes("staff") || alt.includes("crew");
    });
    if (peopleImages.length > 0 || bodyText.includes("meet the team") || bodyText.includes("our team") || bodyText.includes("about the owner")) {
      signals.push("team/owner visibility");
    }

    // 8. Association badges (BBB, Chamber, trade associations, real estate boards)
    if (
      bodyText.includes("bbb") || bodyText.includes("better business bureau") ||
      bodyText.includes("chamber of commerce") || bodyText.includes("angi") ||
      bodyText.includes("home advisor") || bodyText.includes("homeadvisor") ||
      bodyText.includes("board of realtors") || bodyText.includes("association of realtors") ||
      bodyText.includes("national association of realtors")
    ) {
      signals.push("association memberships");
    }
    // Fallback: check full HTML source for association references in embedded data
    if (!signals.includes("association memberships")) {
      const fullHtml = ctx.html.toLowerCase();
      if (fullHtml.includes("board of realtors") || fullHtml.includes("association of realtors")) {
        signals.push("association memberships");
      }
    }

    // 9. Number of projects / customers served
    if (/\d+\+?\s*(projects?|homes?|customers?|clients?|jobs?)\s*(completed|served|finished|helped)/i.test(bodyText) || /served\s+\d+/i.test(bodyText)) {
      signals.push("project/customer count");
    }

    // 10. Real photos (not stock) — check for multiple images
    const imageCount = $("img").length;
    if (imageCount >= 5) {
      signals.push("visual portfolio");
    }

    if (signals.length >= 5) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "pass",
        message: `Excellent trust stacking — ${signals.length} signals: ${signals.join(", ")}`,
      };
    }

    if (signals.length >= 3) {
      const missing = getMissingRecommendations(signals);
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `Good trust foundation (${signals.length} signals) but not fully stacked`,
        details: `Found: ${signals.join(", ")}. Missing: ${missing.join(", ")}. The highest-converting sites stack 5+ trust signals.`,
        recommendation: `Add ${missing.slice(0, 2).join(" and ")} to strengthen your trust stack. Each additional signal compounds the others.`,
        impact: "Trust stacking creates a compound effect — each signal reinforces the others. Sites with 5+ trust signals convert 40-60% better than those with 1-2.",
      };
    }

    if (signals.length >= 1) {
      const missing = getMissingRecommendations(signals);
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `Weak trust stack — only ${signals.length} signal${signals.length === 1 ? "" : "s"}: ${signals.join(", ")}`,
        details: `Visitors need multiple reasons to trust you. Add: ${missing.slice(0, 3).join(", ")}.`,
        recommendation: "Build your trust stack: (1) Add years in business or 'since YYYY', (2) Show 'Licensed & Insured', (3) Add customer testimonials with names, (4) Include a satisfaction guarantee.",
        impact: "With only 1-2 trust signals, visitors have to take a leap of faith. Most won't. You're losing 30-50% of potential leads to trust anxiety.",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "fail",
      message: "No trust signals detected — visitors have zero reason to trust this business",
      details: "This site gives visitors no evidence that the business is real, established, licensed, reviewed, or guaranteed. This is the #1 conversion killer for local businesses.",
      recommendation: "Start with these 4: (1) \"Serving [City] Since [Year]\", (2) \"Licensed & Insured\", (3) Real customer testimonials, (4) \"100% Satisfaction Guarantee\". Place them prominently on the homepage.",
      impact: "Without trust signals, your site functions as an anonymous brochure. You're losing the majority of visitors who need reassurance before calling a stranger.",
    };
  },
};

function getMissingRecommendations(existing: string[]): string[] {
  const all = [
    "years in business",
    "licensed/insured",
    "reviews/testimonials",
    "guarantee/warranty",
    "certifications/awards",
    "before/after portfolio",
    "team/owner visibility",
    "association memberships",
  ];

  return all.filter((item) => !existing.includes(item));
}
