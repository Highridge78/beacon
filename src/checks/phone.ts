import * as cheerio from "cheerio";
import type { Check, AuditContext, CheckResult } from "../types.js";

// Common phone patterns (US-focused)
const PHONE_REGEX =
  /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

export const phoneCheck: Check = {
  id: "phone-number",
  name: "Phone Number Visible",
  category: "conversion",
  weight: 8,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);

    const bodyText = $("body").text();
    const phones = bodyText.match(PHONE_REGEX) || [];

    const headerText = $("header, nav, .header, .navbar, #header, #nav, .top-bar, .topbar").text();
    const headerPhones = headerText.match(PHONE_REGEX) || [];

    if (phones.length === 0) {
      return {
        ...base(this),
        status: "fail",
        message: "No phone number found on the page",
        details: "Local businesses need a visible phone number. 60% of mobile searchers call directly from search results.",
        recommendation: "Add your phone number to the header/navigation area with a click-to-call link. Make it large and prominent — don't hide it in the footer.",
        impact: "60% of local searches result in a phone call. No visible phone number means you're losing the majority of your highest-intent leads.",
      };
    }

    if (headerPhones.length > 0) {
      return {
        ...base(this),
        status: "pass",
        message: `Phone number found above the fold: ${headerPhones[0]}`,
      };
    }

    return {
      ...base(this),
      status: "warn",
      message: `Phone number found (${phones[0]}) but not in the header/navigation area`,
      details: "Move your phone number to the header so it's visible without scrolling. Above-the-fold phone numbers increase calls by 30-40%.",
      recommendation: "Move the phone number to your header/navigation bar. On mobile, use a sticky \"Call Now\" button that's always visible.",
      impact: "Phone numbers buried in the footer get 30-40% fewer calls than those in the header. Every scroll between the visitor and your number costs you leads.",
    };
  },
};

export const clickToCallCheck: Check = {
  id: "click-to-call",
  name: "Click-to-Call Link",
  category: "mobile",
  weight: 7,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);
    const telLinks = $('a[href^="tel:"]');

    if (telLinks.length === 0) {
      const bodyText = $("body").text();
      const hasPhone = PHONE_REGEX.test(bodyText);

      return {
        ...base(this),
        status: "fail",
        message: hasPhone
          ? "Phone number exists but no click-to-call link (tel:)"
          : "No click-to-call link found",
        details: "Wrap phone numbers in <a href=\"tel:+1XXXXXXXXXX\"> tags. Over 70% of mobile searches for local businesses result in a call.",
        recommendation: hasPhone
          ? "Wrap your existing phone number in a tel: link: <a href=\"tel:+1XXXXXXXXXX\">Your Number</a>. This takes 30 seconds and is the easiest conversion win."
          : "Add a phone number to your site and make it clickable with a tel: link for mobile users.",
        impact: "On mobile, a non-clickable phone number requires users to memorize it, switch apps, and dial manually. Most won't bother — you lose 70%+ of mobile callers.",
      };
    }

    return {
      ...base(this),
      status: "pass",
      message: `Click-to-call link found (${telLinks.length} tel: link${telLinks.length > 1 ? "s" : ""})`,
    };
  },
};

function base(check: Check) {
  return {
    id: check.id,
    name: check.name,
    category: check.category,
    weight: check.weight,
  };
}
