import * as cheerio from "cheerio";
import type { Check, AuditContext, CheckResult } from "../types.js";

/**
 * Checks for the presence of compelling offers — discounts, guarantees,
 * free estimates, limited-time promotions, or financing options.
 *
 * An offer gives visitors a reason to act NOW instead of later.
 * "Free estimate" is the minimum. The best local business sites
 * stack offers: free estimate + satisfaction guarantee + financing.
 */

interface OfferMatch {
  type: string;
  text: string;
}

export const offersCheck: Check = {
  id: "offer-presence",
  name: "Compelling Offers Present",
  category: "conversion",
  weight: 6,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);
    const bodyText = $("body").text().toLowerCase();

    const offers: OfferMatch[] = [];

    // Free estimate/consultation/quote
    if (/free\s+(estimate|quote|consultation|assessment|inspection|evaluation)/i.test(bodyText)) {
      offers.push({ type: "free-estimate", text: "Free estimate/consultation" });
    }

    // Discount / percentage off
    if (/\d+%\s*off/i.test(bodyText) || /\$\d+\s*off/i.test(bodyText)) {
      offers.push({ type: "discount", text: "Discount offer" });
    }

    // Satisfaction guarantee
    if (/satisfaction\s+guarantee/i.test(bodyText) || /100%\s+guarantee/i.test(bodyText) || /money.back\s+guarantee/i.test(bodyText)) {
      offers.push({ type: "guarantee", text: "Satisfaction guarantee" });
    }

    // Financing / payment plans
    if (/financ/i.test(bodyText) || /payment\s+plan/i.test(bodyText) || /monthly\s+payment/i.test(bodyText) || /easy\s+pay/i.test(bodyText)) {
      offers.push({ type: "financing", text: "Financing available" });
    }

    // Limited time / seasonal
    if (/limited\s+time/i.test(bodyText) || /expires?\b/i.test(bodyText) || /special\s+offer/i.test(bodyText) || /seasonal\s+(special|deal|offer)/i.test(bodyText)) {
      offers.push({ type: "urgency", text: "Limited-time or seasonal offer" });
    }

    // Price match
    if (/price\s+match/i.test(bodyText) || /beat\s+any\s+(price|quote)/i.test(bodyText) || /lowest\s+price/i.test(bodyText)) {
      offers.push({ type: "price-match", text: "Price match guarantee" });
    }

    // Senior/military/first responder discount
    if (/senior\s+discount/i.test(bodyText) || /military\s+discount/i.test(bodyText) || /first\s+responder/i.test(bodyText)) {
      offers.push({ type: "community-discount", text: "Community/group discount" });
    }

    // Warranty
    if (/\d+.year\s+warrant/i.test(bodyText) || /lifetime\s+warrant/i.test(bodyText)) {
      offers.push({ type: "warranty", text: "Warranty offered" });
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
