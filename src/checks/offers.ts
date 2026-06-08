import * as cheerio from "cheerio";
import type { Check, AuditContext, CheckResult } from "../types.js";

/**
 * Checks for the presence of compelling offers — discounts, guarantees,
 * free estimates, limited-time promotions, or financing options.
 *
 * An offer gives visitors a reason to act NOW instead of later.
 * "Free estimate" is the minimum. The best local business sites
 * stack offers: free estimate + satisfaction guarantee + financing.
 *
 * Broadened from exact multi-word phrases to regex vocabulary that
 * catches real offer language ("free Beacon audit", "zero-risk guarantee",
 * "no signup required", etc.) without rescuing genuinely bare pages.
 */

interface OfferMatch {
  type: string;
  text: string;
}

/**
 * Each entry: a type label, a human description, and one or more patterns.
 * A page earns a match if ANY pattern in the group fires.
 */
const OFFER_GROUPS: Array<{
  type: string;
  text: string;
  patterns: RegExp[];
}> = [
  {
    type: "free-offer",
    text: "Free service/offer",
    patterns: [
      /free\s+(estimate|quote|consultation|assessment|inspection|evaluation|audit|analysis|review|score|report|demo|trial)/i,
      /\bfree instant\b/i,
      /\bno[- ]?cost\b/i,
      /\bcomplimentary\b/i,
    ],
  },
  {
    type: "no-obligation",
    text: "No-obligation / no-commitment",
    patterns: [
      /\bno obligation\b/i,
      /\bno commitment\b/i,
      /\bno[- ]?sign[- ]?up\b/i,
      /\bno pressure\b/i,
    ],
  },
  {
    type: "guarantee",
    text: "Guarantee",
    patterns: [
      /satisfaction\s+guarantee/i,
      /100%\s+guarantee/i,
      /money[- ]?back\s+guarantee/i,
      /\bguaranteed?\b/i,
      /\brisk[- ]?free\b/i,
      /\bzero[- ]?risk\b/i,
    ],
  },
  {
    type: "discount",
    text: "Discount offer",
    patterns: [
      /\d+%\s*off/i,
      /\$\d+\s*off/i,
      /\bspecial offer\b/i,
      /\bdiscount\b/i,
    ],
  },
  {
    type: "financing",
    text: "Financing available",
    patterns: [
      /\bfinanc/i,
      /\bpayment\s+plan/i,
      /\bmonthly\s+payment/i,
      /\beasy\s+pay/i,
    ],
  },
  {
    type: "urgency",
    text: "Limited-time or seasonal offer",
    patterns: [
      /\blimited\s+time\b/i,
      /\bexpires?\b/i,
      /\bseasonal\s+(special|deal|offer)/i,
      /\bsame[- ]?day\b/i,
    ],
  },
  {
    type: "price-match",
    text: "Price match guarantee",
    patterns: [
      /\bprice\s+match\b/i,
      /\bbeat\s+any\s+(price|quote)\b/i,
      /\blowest\s+price\b/i,
    ],
  },
  {
    type: "community-discount",
    text: "Community/group discount",
    patterns: [
      /\bsenior\s+discount\b/i,
      /\bmilitary\s+discount\b/i,
      /\bfirst\s+responder\b/i,
    ],
  },
  {
    type: "warranty",
    text: "Warranty offered",
    patterns: [
      /\d+[- ]?year\s+warrant/i,
      /\blifetime\s+warrant/i,
      /\bwarranty\b/i,
    ],
  },
  {
    type: "fixed-pricing",
    text: "Fixed/transparent pricing",
    patterns: [
      /\bfixed\s+pric/i,
      /\btransparent\s+pric/i,
      /\bno\s+(hidden|surprise)\s+(fees?|charges?|costs?|invoices?)\b/i,
      /\bno\s+scope\s+creep\b/i,
    ],
  },
  {
    type: "ownership",
    text: "Full ownership / no lock-in",
    patterns: [
      /\bno\s+lock[- ]?in\b/i,
      /\bfull\s+ownership\b/i,
      /\byou\s+own\s+everything\b/i,
    ],
  },
];

export const offersCheck: Check = {
  id: "offer-presence",
  name: "Compelling Offers Present",
  category: "conversion",
  weight: 6,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);
    const bodyText = $("body").text().toLowerCase().replace(/\s+/g, " ");

    const offers: OfferMatch[] = [];

    for (const group of OFFER_GROUPS) {
      if (group.patterns.some((re) => re.test(bodyText))) {
        offers.push({ type: group.type, text: group.text });
      }
    }

    if (offers.length >= 3) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "pass",
        message: `Strong offer stack: ${offers.map((o) => o.text).join(", ")}`,
      };
    }

    if (offers.length >= 1) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `Some offers present (${offers.map((o) => o.text).join(", ")}) but could be stronger`,
        details: "Stack multiple offers to reduce buyer hesitation. The winning formula for contractors: free estimate + satisfaction guarantee + financing available.",
        recommendation: "Add at least 2 more value signals: a satisfaction guarantee, financing options, a seasonal promotion, or a community discount.",
        impact: "Sites with 3+ offers convert 25-40% better than those with just one. Each offer removes a different objection.",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "fail",
      message: "No compelling offers found — visitors have no reason to act now",
      details: "Without a clear offer, visitors browse and leave. A \"free estimate\" is the minimum. Add a guarantee and financing to create urgency.",
      recommendation: "Add these three offers prominently: (1) \"Free Estimate\" in the hero, (2) \"100% Satisfaction Guarantee\" near testimonials, (3) \"Financing Available\" near pricing/services.",
      impact: "A page without offers converts like a brochure — people read it and move on. Offers create urgency and reduce the risk of taking action.",
    };
  },
};
