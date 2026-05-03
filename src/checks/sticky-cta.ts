import * as cheerio from "cheerio";
import type { Check, AuditContext, CheckResult } from "../types.js";

/**
 * Checks whether the site's header/navigation is sticky (fixed/sticky position)
 * AND contains a CTA button or phone link — the highest-converting pattern
 * for local business sites.
 */
export const stickyCtaCheck: Check = {
  id: "sticky-header-cta",
  name: "Sticky Header with CTA",
  category: "conversion",
  weight: 7,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);

    // Check for sticky/fixed positioning in inline styles
    const headerEls = $("header, nav, .header, .navbar, #header, #nav, .top-bar, .topbar, [class*='header'], [class*='navbar']");

    let hasStickyHeader = false;
    let hasCtaInHeader = false;

    // Check inline styles for sticky/fixed
    headerEls.each((_, el) => {
      const style = $(el).attr("style") || "";
      const classes = $(el).attr("class") || "";

      if (
        style.includes("position: fixed") ||
        style.includes("position: sticky") ||
        style.includes("position:fixed") ||
        style.includes("position:sticky") ||
        classes.includes("fixed") ||
        classes.includes("sticky")
      ) {
        hasStickyHeader = true;
      }
    });

    // Also check for common framework patterns (Tailwind, Bootstrap)
    if ($("[class*='fixed-top'], [class*='sticky-top'], .fixed, .sticky").length > 0) {
      hasStickyHeader = true;
    }

    // Check embedded <style> blocks for sticky/fixed on header/nav
    $("style").each((_, el) => {
      const css = $(el).html() || "";
      if (
        (css.includes("header") || css.includes("nav")) &&
        (css.includes("position: fixed") || css.includes("position: sticky") ||
         css.includes("position:fixed") || css.includes("position:sticky"))
      ) {
        hasStickyHeader = true;
      }
    });

    // Check for CTA in header area
    const ctaKeywords = [
      "get a quote", "get quote", "free quote", "free estimate",
      "call now", "call today", "book now", "schedule",
      "contact us", "get started", "request",
    ];

    headerEls.each((_, el) => {
      const headerText = $(el).text().toLowerCase();
      const headerLinks = $(el).find("a, button");

      // Check for tel: links
      if ($(el).find('a[href^="tel:"]').length > 0) {
        hasCtaInHeader = true;
      }

      // Check for CTA text in buttons/links
      headerLinks.each((__, link) => {
        const linkText = $(link).text().toLowerCase().trim();
        if (ctaKeywords.some((kw) => linkText.includes(kw))) {
          hasCtaInHeader = true;
        }
      });
    });

    if (hasStickyHeader && hasCtaInHeader) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "pass",
        message: "Sticky header with CTA detected — visitors can always take action",
      };
    }

    if (hasStickyHeader && !hasCtaInHeader) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: "Header is sticky but has no CTA button or phone link",
        details: "A sticky header without a call-to-action wastes its highest-value real estate. Add a phone number or \"Get Quote\" button.",
        recommendation: "Add a CTA button (\"Get Free Quote\" or \"Call Now\") or a clickable phone number to your sticky header.",
        impact: "Sticky headers with CTAs see 15-20% more conversions than those without. Every scroll is a missed opportunity.",
      };
    }

    if (!hasStickyHeader && hasCtaInHeader) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: "Header has a CTA but is not sticky — disappears on scroll",
        details: "When visitors scroll, your CTA disappears. Make the header sticky so the CTA is always one click away.",
        recommendation: "Add `position: sticky; top: 0;` to your header element so the CTA stays visible as users scroll.",
        impact: "Once visitors scroll past the header, you lose their attention. A sticky CTA keeps the exit path visible at all times.",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "fail",
      message: "No sticky header with CTA — visitors lose the ability to act as they scroll",
      details: "The header should stay fixed at the top of the page and include a clear CTA or phone number. This is the highest-converting pattern for local business sites.",
      recommendation: "Make your header sticky (CSS `position: sticky`) and add a prominent CTA button or phone number to it.",
      impact: "Without a persistent CTA, visitors who scroll past your hero have no easy way to contact you. You're losing leads on every page.",
    };
  },
};
