import * as cheerio from "cheerio";
import type { Check, AuditContext, CheckResult } from "../types.js";

/**
 * Checks footer completeness — a strong footer for local businesses includes:
 * - Business name
 * - Phone number
 * - Address or service area
 * - Hours of operation
 * - Links to key pages (services, about, contact)
 * - Social media links
 * - Copyright / legal
 *
 * NAP (Name, Address, Phone) consistency in the footer is critical for
 * local SEO and builds trust with visitors who scroll to the bottom.
 */

const PHONE_REGEX = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

export const footerCheck: Check = {
  id: "footer-completeness",
  name: "Footer Completeness (NAP + Info)",
  category: "trust",
  weight: 5,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);

    const footer = $("footer, .footer, #footer, [role='contentinfo']");

    if (footer.length === 0) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "fail",
        message: "No footer element found — missing essential business information placement",
        details: "The footer is where visitors expect to find your phone number, address, and hours. It's also critical for local SEO (NAP consistency).",
        recommendation: "Add a footer with: business name, phone number, address/service area, hours of operation, links to services, and social media links.",
        impact: "Visitors who scroll to the footer are looking for contact info and trust signals. A missing or empty footer loses these high-intent visitors.",
      };
    }

    const footerText = footer.text();
    const footerLower = footerText.toLowerCase();
    const footerHtml = footer.html() || "";

    const signals: string[] = [];
    const missing: string[] = [];

    // 1. Phone number
    if (PHONE_REGEX.test(footerText)) {
      signals.push("phone number");
    } else {
      missing.push("phone number");
    }

    // 2. Address or service area
    const hasAddress = /\b[A-Z]{2}\s+\d{5}\b/.test(footerText) ||
      /\d+\s+\w+\s+(st|street|rd|road|ave|avenue|blvd|dr|drive|ln|lane|way|ct|court)\b/i.test(footerText);
    const hasServiceArea = /serv(ing|ice)\s+(area|the|all|throughout)/i.test(footerLower);

    if (hasAddress || hasServiceArea) {
      signals.push("address/service area");
    } else {
      missing.push("address or service area");
    }

    // 3. Hours of operation
    const hasHours = /\d{1,2}:\d{2}\s*(am|pm|a\.m\.|p\.m\.)/i.test(footerText) ||
      footerLower.includes("hours") ||
      footerLower.includes("mon") ||
      footerLower.includes("monday") ||
      footerLower.includes("24/7") ||
      footerLower.includes("open daily");

    if (hasHours) {
      signals.push("hours of operation");
    } else {
      missing.push("hours of operation");
    }

    // 4. Copyright / business name
    if (/©|\bcopyright\b/i.test(footerText) || /\d{4}/.test(footerText)) {
      signals.push("copyright/business name");
    } else {
      missing.push("copyright/business name");
    }

    // 5. Email or contact link
    const hasEmail = footer.find('a[href^="mailto:"]').length > 0 ||
      /\S+@\S+\.\S+/.test(footerText);
    const hasContactLink = footer.find("a").filter((_, el) => {
      const text = $(el).text().toLowerCase();
      const href = ($(el).attr("href") || "").toLowerCase();
      return text.includes("contact") || href.includes("contact");
    }).length > 0;

    if (hasEmail || hasContactLink) {
      signals.push("email/contact link");
    } else {
      missing.push("email or contact link");
    }

    // 6. Social links
    const socialDomains = ["facebook.com", "instagram.com", "google.com/maps", "yelp.com", "linkedin.com", "x.com", "twitter.com"];
    const hasSocial = footer.find("a").filter((_, el) => {
      const href = ($(el).attr("href") || "").toLowerCase();
      return socialDomains.some((d) => href.includes(d));
    }).length > 0;

    if (hasSocial) {
      signals.push("social media links");
    } else {
      missing.push("social media links");
    }

    // Score the footer
    if (signals.length >= 5) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "pass",
        message: `Complete footer — includes ${signals.join(", ")}`,
      };
    }

    if (signals.length >= 3) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `Footer has good basics (${signals.join(", ")}) but is missing: ${missing.join(", ")}`,
        details: "A complete footer includes: phone, address, hours, email, social links, and copyright. Each missing item reduces trust and SEO value.",
        recommendation: `Add these to your footer: ${missing.join(", ")}. Ensure NAP (Name, Address, Phone) matches your Google Business Profile exactly.`,
        impact: "Footer NAP consistency is a direct local SEO ranking factor. Google cross-references your footer info with your Google Business Profile.",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "fail",
      message: `Footer is incomplete — only has: ${signals.length > 0 ? signals.join(", ") : "minimal content"}`,
      details: "The footer is the second most-viewed area of a website (after the hero). For local businesses, it's where visitors go to find your phone number, address, and hours.",
      recommendation: "Build a complete footer: business name, phone (clickable), address/service area, hours, email, links to service pages, social icons, and copyright.",
      impact: "An incomplete footer signals an unfinished or low-effort business. Visitors associate footer quality with business quality.",
    };
  },
};
