import * as cheerio from "cheerio";
import type { Check, AuditContext, CheckResult } from "../types.js";

/**
 * Checks whether the navigation clearly lists services.
 *
 * The navigation is the #1 most-used element on any website.
 * For local businesses, the nav should make it immediately obvious
 * what services are offered. A nav that says "Home | About | Contact"
 * tells visitors nothing about what you do.
 */

const SERVICE_KEYWORDS = [
  "services", "our services", "what we do",
  // Common contractor services
  "roofing", "roof", "plumbing", "plumber", "electric", "electrician",
  "hvac", "heating", "cooling", "air conditioning",
  "flooring", "floors", "painting", "remodeling", "renovation",
  "landscaping", "lawn", "pest control", "cleaning",
  "kitchen", "bathroom", "basement", "deck", "fence", "gutter",
  "siding", "window", "door", "concrete", "drywall",
  "water heater", "drain", "sewer", "septic",
  // Professional services
  "dental", "legal", "accounting", "consulting",
  "web design", "marketing", "photography",
  // Auto
  "oil change", "brake", "tire", "transmission", "auto repair",
  // Home services
  "installation", "repair", "replacement", "maintenance",
  "residential", "commercial",
];

const GENERIC_NAV_ITEMS = [
  "home", "about", "about us", "contact", "contact us",
  "blog", "faq", "gallery", "portfolio", "team",
  "testimonials", "reviews", "careers", "privacy", "terms",
];

export const navigationCheck: Check = {
  id: "navigation-clarity",
  name: "Navigation Lists Services",
  category: "conversion",
  weight: 5,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);

    // Extract nav items
    const navElements = $("nav, header nav, .nav, .navbar, #nav, .menu, .main-menu, [role='navigation']");
    const navLinks: string[] = [];

    navElements.find("a").each((_, el) => {
      const text = $(el).text().trim().toLowerCase();
      if (text && text.length > 0 && text.length < 50) {
        navLinks.push(text);
      }
    });

    // Fallback: check header links
    if (navLinks.length === 0) {
      $("header a").each((_, el) => {
        const text = $(el).text().trim().toLowerCase();
        if (text && text.length > 0 && text.length < 50) {
          navLinks.push(text);
        }
      });
    }

    if (navLinks.length === 0) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "fail",
        message: "No navigation menu found — visitors can't find your services",
        details: "A clear navigation is essential. Without it, visitors have to guess where to find your services, pricing, and contact info.",
        recommendation: "Add a navigation menu with clear links: Services (with dropdown of individual services), About, Reviews/Testimonials, Contact.",
        impact: "Without navigation, visitors bounce. They won't scroll to find what they need — they'll go to a competitor who makes it obvious.",
      };
    }

    // Count service-related vs generic nav items
    const serviceItems = navLinks.filter((link) =>
      SERVICE_KEYWORDS.some((kw) => link.includes(kw))
    );
    const genericItems = navLinks.filter((link) =>
      GENERIC_NAV_ITEMS.some((gi) => link === gi || link.startsWith(gi))
    );

    // Has a "Services" dropdown or explicit service listings
    const hasServicesLink = navLinks.some((link) =>
      link === "services" || link === "our services" || link === "what we do"
    );

    if (serviceItems.length >= 3 || (hasServicesLink && serviceItems.length >= 1)) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "pass",
        message: `Navigation clearly lists services — ${serviceItems.length} service-related items found`,
      };
    }

    if (hasServicesLink || serviceItems.length >= 1) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `Navigation has ${serviceItems.length > 0 ? "some service references" : "a \"Services\" link"} but could be more specific`,
        details: "Don't make visitors click \"Services\" to find out what you do. List specific services in the nav or use a mega-menu dropdown.",
        recommendation: "Add individual service pages to the nav (e.g., \"Roof Repair\", \"New Roof Installation\", \"Gutter Service\") instead of hiding everything behind a generic \"Services\" link.",
        impact: "Specific service names in the nav improve both SEO (more pages indexed for specific searches) and conversion (visitors find exactly what they need).",
      };
    }

    // All generic nav items
    if (genericItems.length > 0 && serviceItems.length === 0) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "fail",
        message: `Navigation is entirely generic (${genericItems.slice(0, 4).join(", ")}) — no services visible`,
        details: "\"Home | About | Contact\" tells visitors nothing about what you do. Your nav should immediately communicate your services.",
        recommendation: "Replace generic nav items with service-specific pages. Instead of just \"Services\", add: \"Roof Repair\", \"New Installation\", \"Storm Damage\", etc.",
        impact: "Generic navigation makes your business look like every other website. Specific service pages in the nav generate 3-5x more organic traffic per service.",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "warn",
      message: "Navigation doesn't clearly communicate services offered",
      details: "Visitors use the navigation to understand what you do. If services aren't visible in the nav, they may not realize you offer what they need.",
      recommendation: "Add a Services section to your navigation with specific service names. Each service should link to its own page.",
      impact: "Clear navigation reduces bounce rate and helps visitors self-qualify. If they can't find your services in 5 seconds, they leave.",
    };
  },
};
