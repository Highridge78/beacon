import * as cheerio from "cheerio";
import type { Check, AuditContext, CheckResult } from "../types.js";

// Common phone patterns (US-focused)
const PHONE_REGEX =
  /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

const TEL_LINK_REGEX = /href\s*=\s*["']tel:/i;

export const phoneCheck: Check = {
  id: "phone-number",
  name: "Phone Number Visible",
  category: "conversion",
  weight: 8,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);

    // Check for phone numbers in the page text
    const bodyText = $("body").text();
    const phones = bodyText.match(PHONE_REGEX) || [];

    // Check if phone is in the header/nav area (above the fold proxy)
    const headerText = $("header, nav, .header, .navbar, #header, #nav, .top-bar, .topbar").text();
    const headerPhones = headerText.match(PHONE_REGEX) || [];

    if (phones.length === 0) {
      return {
        ...base(this),
        status: "fail",
        message: "No phone number found on the page",
        details:
          "Local businesses need a visible phone number. 60% of mobile searchers call directly from search results.",
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
      details:
        "Move your phone number to the header so it's visible without scrolling. Above-the-fold phone numbers increase calls by 30-40%.",
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
      // Check if there's a phone but no tel: link
      const bodyText = $("body").text();
      const hasPhone = PHONE_REGEX.test(bodyText);

      return {
        ...base(this),
        status: "fail",
        message: hasPhone
          ? "Phone number exists but no click-to-call link (tel:)"
          : "No click-to-call link found",
        details:
          "Wrap phone numbers in <a href=\"tel:+1XXXXXXXXXX\"> tags. Over 70% of mobile searches for local businesses result in a call.",
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
