import * as cheerio from "cheerio";
import type { Check, AuditContext, CheckResult } from "../types.js";

/**
 * CTA Above the Fold
 *
 * Detection strategy:
 * - anchors, buttons, role="button", input[type="submit"], input[type="button"]
 * - regex-based action vocabulary (catches "Run My Free Beacon Audit", etc.)
 * - tel:/mailto: links within hero scope count as valid CTAs
 * - class-name heuristic for styled CTA elements
 *
 * Hero scope is H1-anchored: find the first H1, climb to its nearest
 * structural ancestor (section, hero-class block, or direct child of main/body).
 * This works whether the hero is a <section>, a <div>, or anything else.
 *
 * Priority: action-language buttons/links first, then tel:/mailto: fallback.
 * This ensures the match reports the REAL CTA, not an incidental phone link.
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
 * Approximate "above the fold": header + the hero block.
 *
 * Anchored on the first H1 — the hero almost always contains it.
 * Climbs from the H1 to its nearest structural ancestor, which gives us
 * the full hero container regardless of whether it's a <section> or <div>.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function heroScope($: cheerio.CheerioAPI): cheerio.Cheerio<any> {
  const header = $("header");

  // Anchor on the H1 — the hero block is the H1's nearest structural ancestor.
  const h1 = $("h1").first();
  let hero = h1.length
    ? h1.closest('section, [class*="hero"], main > div, body > div')
    : $();

  // Fallbacks if no H1 or no structural ancestor matched
  if (hero.length === 0) {
    hero = $('section, [class*="hero"]').first();
  }
  if (hero.length === 0) {
    hero = $("main").children().first();
  }
  if (hero.length === 0) {
    hero = $("body").children().not("header, nav, script, style, link, meta").first();
  }

  return header.add(hero);
}

interface CTAMatch {
  found: boolean;
  label?: string;
  /** Tag name of the matched element — for verification. */
  matchTag?: string;
  /** How the match was found: "action-button" | "tel-mailto" | none */
  matchType?: string;
}

function hasHeroCTA($: cheerio.CheerioAPI): CTAMatch {
  const scope = heroScope($);

  // ── Priority 1: Scan clickable elements for action language ──
  // Buttons/links with action words are the REAL CTA. Check these first
  // so we don't short-circuit on an incidental tel: link.
  let result: CTAMatch = { found: false };

  scope
    .find('a, button, [role="button"], input[type="submit"], input[type="button"]')
    .each((_, el) => {
      if (result.found) return;
      const $el = $(el);
      const tag = ((el as any).tagName || (el as any).name || "").toLowerCase();

      // Skip nav items — "Contact", "Services", etc. are navigation, not CTAs
      if ($el.closest("nav").length > 0) return;

      // Skip bare tel:/mailto: links in this pass — they're fallback
      const href = ($el.attr("href") || "").toLowerCase();
      if (href.startsWith("tel:") || href.startsWith("mailto:")) return;

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
        result = {
          found: true,
          label: blob.slice(0, 80),
          matchTag: tag,
          matchType: "action-button",
        };
      }
    });

  if (result.found) return result;

  // ── Priority 2: tel:/mailto: in hero scope ──
  // Valid CTA for local service businesses, but secondary to real buttons.
  const telMailto = scope.find('a[href^="tel:"], a[href^="mailto:"]');
  if (telMailto.length > 0) {
    const label = telMailto.first().text().trim() || telMailto.first().attr("href") || "tel/mailto link";
    const tag = ((telMailto[0] as any).tagName || (telMailto[0] as any).name || "").toLowerCase();
    return { found: true, label, matchTag: tag, matchType: "tel-mailto" };
  }

  return { found: false };
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
    let pageTag: string | null = null;

    // Scan action buttons/links page-wide
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
        pageTag = ((el as any).tagName || (el as any).name || "").toLowerCase();
      }
    });

    // Also check tel:/mailto: page-wide
    if (!pageCta) {
      const globalTel = $('a[href^="tel:"], a[href^="mailto:"]');
      if (globalTel.length > 0) {
        pageCta = globalTel.first().text().trim() || globalTel.first().attr("href") || "tel/mailto link";
      }
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
