import * as cheerio from "cheerio";
import type { Check, AuditContext, CheckResult } from "../types.js";

/**
 * Checks whether the site clearly communicates its service area
 * by mentioning specific cities, regions, or geographic terms.
 *
 * Local businesses that mention their service area prominently
 * rank better in local search AND convert better because visitors
 * immediately know "yes, they serve my area."
 */

const GEO_PATTERNS = [
  // "serving [area]" patterns
  /serv(?:ing|ice|es)\s+(?:the\s+)?(?:greater\s+)?[\w\s]+(?:area|region|county|metro)/i,
  // "proudly serving" pattern
  /proudly\s+serv(?:ing|e)/i,
  // "[City], [State]" pattern (US)
  /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,?\s+[A-Z]{2}\b/,
  // County mentions
  /\b\w+\s+county\b/i,
  // "and surrounding areas"
  /surrounding\s+areas?/i,
  // "near [place]"
  /near\s+[A-Z][a-z]+/,
  // "in [City]" (at least 2 occurrences for this to count)
  /\bin\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/,
];

export const serviceAreaCheck: Check = {
  id: "service-area-clarity",
  name: "Service Area Clarity",
  category: "seo",
  weight: 6,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);
    const bodyText = $("body").text();
    const bodyLower = bodyText.toLowerCase();

    // Count city/location mentions
    const cityPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,?\s+[A-Z]{2}\b/g;
    const cityMatches = bodyText.match(cityPattern) || [];
    const uniqueCities = [...new Set(cityMatches)];

    // Check for dedicated service area section
    const hasServiceAreaSection =
      bodyLower.includes("service area") ||
      bodyLower.includes("areas we serve") ||
      bodyLower.includes("where we serve") ||
      bodyLower.includes("locations we serve") ||
      bodyLower.includes("communities we serve") ||
      bodyLower.includes("areas served");

    // Check for geographic patterns
    let geoMatchCount = 0;
    const foundPatterns: string[] = [];
    for (const pattern of GEO_PATTERNS) {
      const match = bodyText.match(pattern);
      if (match) {
        geoMatchCount++;
        foundPatterns.push(match[0].trim().substring(0, 40));
      }
    }

    // Check meta title/description for location
    const title = $("title").text();
    const metaDesc = $('meta[name="description"]').attr("content") || "";
    const metaHasLocation = cityPattern.test(title) || cityPattern.test(metaDesc);

    // Strong: dedicated section + multiple city mentions + meta location
    if (hasServiceAreaSection && uniqueCities.length >= 3 && metaHasLocation) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "pass",
        message: `Strong service area presence — ${uniqueCities.length} locations mentioned, service area section found`,
      };
    }

    // Good: multiple cities or service area section
    if (uniqueCities.length >= 2 || (hasServiceAreaSection && geoMatchCount >= 2)) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "pass",
        message: `Service area clearly communicated — ${uniqueCities.length > 0 ? uniqueCities.slice(0, 3).join(", ") : "geographic mentions found"}`,
      };
    }

    // Partial: some location signals
    if (uniqueCities.length === 1 || geoMatchCount >= 1) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `Limited service area information — ${uniqueCities.length === 1 ? uniqueCities[0] : "only basic geographic reference found"}`,
        details: "Mention specific cities and neighborhoods you serve. Create a dedicated 'Service Area' section. Include your primary city in the meta title.",
        recommendation: "Add a 'Service Areas' section listing every city/town you serve. Mention your primary city in the H1, meta title, and meta description.",
        impact: "46% of Google searches have local intent. Without clear service area signals, you're invisible to customers searching '[service] near me' or '[service] in [city]'.",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "fail",
      message: "No clear service area mentioned — visitors can't tell if you serve their location",
      details: "Local businesses must explicitly state where they operate. Without city/region mentions, Google can't rank you for local searches and visitors won't know if you serve them.",
      recommendation: "Add your primary city to the H1, meta title, and footer. Create a dedicated 'Service Areas' page listing every city you cover.",
      impact: "\"Near me\" searches have grown 500% in 5 years. Without location signals, your site is invisible to the fastest-growing segment of local search traffic.",
    };
  },
};
