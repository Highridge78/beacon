import * as cheerio from "cheerio";
import type { Check, AuditContext, CheckResult } from "../types.js";

/**
 * CTA Above the Fold
 *
 * Broadened from exact-phrase matching on <button> to:
 * - anchors, buttons, role="button", input[type="submit"], input[type="button"]
 * - regex-based action vocabulary (catches "Run My Free Beacon Audit", etc.)
 * - tel:/mailto: links within hero scope count as valid CTAs
 * - class-name heuristic for styled CTA elements
 *
 * "Above the fold" is approximated as header + first hero block (Cheerio has no layout).
 */

const CTA_ACTION: RegExp[] = [
  /\bget\b/, /\bstart\b/, /\bget started\b/, /\bbook\b/, /\bschedule\b/,
  /\brequest\b/, /\brun\b/, /\bclaim\b/, /\bcontact\b/, /\bcall\b/,
  /\bquote\b/, /\bconsultation\b/, /\baudit\b/, /\bestimate\b/, /\bfree\b/,
  /\blearn more\b/, /\bsign up\b/, /\bapply\b/, /\breach out\b/,
  /\btalk to\b/, /\bspeak\b/, /\bbook now\b/, /\banalyze\b/,
  /\bhire\b/, /\blet['']?s talk\b/, /\bget in touch\b/,
];

const BUTTON_CLASS = /\b(btn|button|cta|hero-?cta|primary|action)\b/i;

/**
 * Approximate "above the fold": <header> + the first hero-like block.
 * Heuristic — Cheerio has no viewport, so we use DOM structure.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function heroScope($: cheerio.CheerioAPI): cheerio.Cheerio<any> {
  const header = $("header");

  // Try explicit hero selectors first
  let hero = $(".hero, #hero, [class*='hero'], .banner, [class*='banner'], .jumbotron").first();

  if (hero.length === 0) {
    // Fallback: first <section> inside <main>, or first <section> on the page
    hero = $("main > section").first();
    if (hero.length === 0) {
      hero = $("body > section, section").first();
    }
  }

  if (hero.length === 0) {
    // Last resort: first significant block after header
    hero = $("main").children().first().length
      ? $("main").children().first()
      : $("body").children().not("header, nav, script, style, link, meta").first();
  }

  return header.add(hero);
}

function hasHeroCTA($: cheerio.CheerioAPI): { found: boolean; label?: string } {
  const scope = heroScope($);

  // tel:/mailto: in the hero is a valid CTA for a local service business
  const telMailto = scope.find('a[href^="tel:"], a[href^="mailto:"]');
  if (telMailto.length > 0) {
    const label = telMailto.first().text().trim() || telMailto.first().attr("href") || "tel/mailto link";
    return { found: true, label };
  }

  // Scan clickable elements for action language
  let result: { found: boolean; label?: string } = { found: false };

  scope
    .find('a, button, [role="button"], input[type="submit"], input[type="button"]')
    .each((_, el) => {
      if (result.found) return;
      const $el = $(el);
      const tag = ((el as any).tagName || (el as any).name || "").toLowerCase();

      const blob = [
        $el.text(),
        $el.attr("value"),
        $el.attr("aria-label"),
        $el.attr("title"),
      ]
        .filter(Boolean)
        .join(" ")
        .trim()
        .toLowerCase();

      if (!blob) return;

      const actionMatch = CTA_ACTION.some((re) => re.test(blob));
      const looksClickable =
        tag === "button" ||
        tag === "input" ||
        tag === "a" ||
        BUTTON_CLASS.test($el.attr("class") || "") ||
        $el.attr("role") === "button";

      if (actionMatch && looksClickable) {
        result = { found: true, label: blob.slice(0, 80) };
      }
    });

  return result;
}

export const ctaCheck: Check = {
  id: "cta-above-fold",
  name: "CTA Above the Fold",
  category: "conversion",
  weight: 9,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);

    // Check hero scope for CTA
    const hero = hasHeroCTA($);
    if (hero.found) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "pass",
        message: `CTA found above the fold: "${hero.label}"`,
      };
    }

    // Fallback: check the entire page for any CTA (same broadened logic)
    let pageCta: string | null = null;

    // Check tel:/mailto: anywhere
    const globalTel = $('a[href^="tel:"], a[href^="mailto:"]');
    if (globalTel.length > 0) {
      pageCta = globalTel.first().text().trim() || globalTel.first().attr("href") || "tel/mailto link";
    }

    if (!pageCta) {
      $('a, button, [role="button"], input[type="submit"], input[type="button"]').each((_, el) => {
        if (pageCta) return;
        const $el = $(el);
        const blob = [
          $el.text(),
          $el.attr("value"),
          $el.attr("aria-label"),
          $el.attr("title"),
        ]
          .filter(Boolean)
          .join(" ")
          .trim()
          .toLowerCase();

        if (!blob) return;
        if (CTA_ACTION.some((re) => re.test(blob))) {
          pageCta = blob.slice(0, 80);
        }
      });
    }

    if (pageCta) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `CTA found ("${pageCta}") but not in the hero/header area`,
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
