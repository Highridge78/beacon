import * as cheerio from "cheerio";
import type { Check, AuditContext, CheckResult } from "../types.js";

/**
 * Detects whether the site embeds or links to Google Reviews.
 * Google Reviews are the #1 trust signal for local businesses —
 * they carry more weight than any other platform because they
 * show up directly in local search results.
 */
export const googleReviewsCheck: Check = {
  id: "google-reviews",
  name: "Google Reviews Integration",
  category: "trust",
  weight: 6,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);
    const html = ctx.html.toLowerCase();
    const bodyText = $("body").text().toLowerCase();

    // Check for Google Reviews widget embeds
    const googleReviewSignals = [
      // Direct Google embeds
      "google.com/maps/embed",
      "maps.googleapis.com",
      // Common Google Reviews widget providers
      "elfsight.com",
      "trustindex.io",
      "embedsocial.com",
      "reviewsonmywebsite.com",
      "widgetpack.com",
      "grade.us",
      "birdeye.com",
      "podium.com",
      "reputation.com",
      // Google-specific review indicators
      "google-reviews",
      "google_reviews",
      "googlereviews",
      "google review",
    ];

    const hasGoogleWidget = googleReviewSignals.some((sig) => html.includes(sig));

    // Check for Google Business Profile links
    const hasGbpLink = $("a").filter((_, el) => {
      const href = ($(el).attr("href") || "").toLowerCase();
      return (
        href.includes("google.com/maps") ||
        href.includes("g.page") ||
        href.includes("business.google.com") ||
        href.includes("maps.app.goo.gl")
      );
    }).length > 0;

    // Check for Google star ratings displayed
    const hasGoogleStars =
      bodyText.includes("google") &&
      (bodyText.includes("★") || bodyText.includes("⭐") ||
       bodyText.includes("star") || bodyText.includes("rating") ||
       bodyText.includes("reviews on google") || bodyText.includes("google reviews"));

    // Check for aggregate rating schema mentioning Google
    const hasRatingSchema =
      html.includes('"aggregaterating"') || html.includes('"AggregateRating"');

    if (hasGoogleWidget || (hasGbpLink && hasGoogleStars)) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "pass",
        message: "Google Reviews integration detected",
        details: hasRatingSchema
          ? "AggregateRating schema also found — this enables star ratings in search results."
          : "Consider adding AggregateRating schema markup to display stars in Google search results.",
      };
    }

    if (hasGbpLink) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: "Google Business Profile linked but reviews not embedded on the page",
        details: "Linking to your GBP is good, but embedding Google Reviews directly on the page shows social proof without requiring visitors to leave your site.",
        recommendation: "Embed Google Reviews on your homepage using a widget (Elfsight, TrustIndex, or EmbedSocial) so visitors see your 5-star reputation instantly.",
        impact: "90% of consumers read reviews before visiting a business. Showing Google Reviews on your site keeps visitors from leaving to check reviews elsewhere.",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "fail",
      message: "No Google Reviews integration found",
      details: "Google Reviews are the most trusted review source for local businesses. Embedding them on your site eliminates the need for visitors to leave and check reviews themselves.",
      recommendation: "Create a Google Business Profile (if you don't have one), collect 10+ reviews, then embed them on your homepage with a widget.",
      impact: "Businesses with visible Google Reviews see 35-50% higher contact rates. Missing reviews is one of the biggest conversion killers for local businesses.",
    };
  },
};
