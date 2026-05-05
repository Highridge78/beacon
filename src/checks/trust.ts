import * as cheerio from "cheerio";
import type { Check, AuditContext, CheckResult } from "../types.js";
import { extractEmbeddedSocialLinks, extractEmbeddedHtmlWidgets, extractRawStateBlob, isJsRenderedPage } from "../embedded-content.js";

export const reviewsCheck: Check = {
  id: "reviews-testimonials",
  name: "Reviews / Testimonials",
  category: "trust",
  weight: 7,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);
    const bodyText = $("body").text().toLowerCase();
    const bodyHtml = ctx.html.toLowerCase();

    const reviewIndicators = [
      "testimonial", "review", "what our customers say",
      "what people say", "what clients say", "customer stories",
      "client feedback", "hear from our", "★★★★", "⭐⭐⭐",
      "star rating", "5-star", "5 star",
    ];

    const hasReviews = reviewIndicators.some((ind) => bodyText.includes(ind));

    const hasReviewWidget =
      bodyHtml.includes("google.com/maps") ||
      bodyHtml.includes("elfsight") ||
      bodyHtml.includes("birdeye") ||
      bodyHtml.includes("podium") ||
      bodyHtml.includes("trustpilot") ||
      bodyHtml.includes("yelp.com/biz");

    const hasReviewSchema =
      bodyHtml.includes('"review"') ||
      bodyHtml.includes('"aggregaterating"') ||
      bodyHtml.includes('"AggregateRating"');

    if (hasReviews || hasReviewWidget) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "pass",
        message: "Reviews or testimonials section found",
        details: hasReviewSchema
          ? "Review schema markup also detected — great for rich snippets."
          : "Consider adding Review schema markup to get star ratings in search results.",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "fail",
      message: "No reviews or testimonials found on the page",
      details: "88% of consumers trust online reviews as much as personal recommendations. Show real customer testimonials with names and details.",
      recommendation: "Add 3-5 customer testimonials with: full name, service received, and star rating. Better yet, embed your Google Reviews directly. Place them mid-page where visitors are evaluating.",
      impact: "Testimonials are the #1 trust builder for local businesses. Sites without reviews see 35-50% lower contact rates because visitors can't verify your quality.",
    };
  },
};

export const trustSignalsCheck: Check = {
  id: "trust-signals",
  name: "Trust Signals (Experience, Guarantees)",
  category: "trust",
  weight: 6,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);
    const bodyText = $("body").text().toLowerCase();

    const signals: string[] = [];

    if (/\d+\+?\s*years?\s*(of\s+)?experience/i.test(bodyText) || /since\s+\d{4}/i.test(bodyText)) {
      signals.push("years of experience");
    }

    if (bodyText.includes("licensed") || bodyText.includes("insured") || bodyText.includes("bonded")) {
      signals.push("licensed/insured");
    }

    if (bodyText.includes("guarantee") || bodyText.includes("warranty") || bodyText.includes("satisfaction")) {
      signals.push("guarantee/warranty");
    }

    if (bodyText.includes("free estimate") || bodyText.includes("free quote") || bodyText.includes("free consultation")) {
      signals.push("free estimate/quote");
    }

    if (
      bodyText.includes("family owned") || bodyText.includes("family-owned") ||
      bodyText.includes("locally owned") || bodyText.includes("local business") ||
      bodyText.includes("generation")
    ) {
      signals.push("family/locally owned");
    }

    if (bodyText.includes("certified") || bodyText.includes("accredited") || bodyText.includes("bbb")) {
      signals.push("certifications");
    }

    // Real estate credentials (Realtor, MLS, NAR, Equal Housing)
    if (
      bodyText.includes("realtor") || bodyText.includes("mls") ||
      bodyText.includes("national association of realtors") ||
      bodyText.includes("equal housing") || bodyText.includes("fair housing") ||
      bodyText.includes("broker") || bodyText.includes("nar")
    ) {
      if (!signals.includes("certifications")) {
        signals.push("industry credentials");
      }
    }

    // Also check embedded data (JS-rendered sites store badges/designations in state)
    if (signals.length < 3) {
      const rawState = extractRawStateBlob(ctx.html);
      if (rawState) {
        const stateLower = rawState.toLowerCase();
        if (stateLower.includes("realtor") || stateLower.includes("equal-housing") || stateLower.includes("mls")) {
          if (!signals.includes("certifications") && !signals.includes("industry credentials")) {
            signals.push("industry credentials");
          }
        }
      }
    }

    if (signals.length >= 3) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "pass",
        message: `Strong trust signals: ${signals.join(", ")}`,
      };
    }

    if (signals.length > 0) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `Some trust signals found (${signals.join(", ")}) but could be stronger`,
        details: "Add more trust builders: years in business, licensed & insured, satisfaction guarantee, free estimates, certifications.",
        recommendation: "Create a trust bar near the top of your page showing: \"X+ Years Experience | Licensed & Insured | Satisfaction Guaranteed | Free Estimates\". Use icons for visual impact.",
        impact: "Each trust signal reduces buyer hesitation. Going from 1-2 signals to 4+ can increase conversion rates by 25-40%.",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "fail",
      message: "No trust signals found on the page",
      details: "Local customers need reassurance. Add: years in business, licensed & insured, satisfaction guarantee, free estimates, family-owned.",
      recommendation: "Add a prominent trust bar: \"[X]+ Years | Licensed & Insured | Free Estimates | 100% Satisfaction Guarantee\". This is a 30-minute fix with major impact.",
      impact: "Without trust signals, visitors are choosing between you and a competitor they can verify. You're losing every comparison because you're giving them nothing to compare.",
    };
  },
};

export const addressCheck: Check = {
  id: "address-visible",
  name: "Physical Address / Service Area",
  category: "trust",
  weight: 5,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);
    const bodyText = $("body").text();

    const hasStateZip = /\b[A-Z]{2}\s+\d{5}(-\d{4})?\b/.test(bodyText);
    const hasStreetAddress = /\d+\s+\w+\s+(st|street|rd|road|ave|avenue|blvd|boulevard|dr|drive|ln|lane|way|ct|court)\b/i.test(bodyText);

    const hasMaps =
      ctx.html.includes("google.com/maps") ||
      ctx.html.includes("maps.googleapis.com") ||
      ctx.html.includes("maps.google.com");

    const hasServiceArea = /serv(ice|ing)\s+(area|the|all of|throughout|across)/i.test(bodyText);

    if ((hasStateZip && hasStreetAddress) || hasMaps) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "pass",
        message: hasMaps
          ? "Physical address and Google Maps embed found"
          : "Physical address found on the page",
      };
    }

    if (hasServiceArea || hasStateZip) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: "Service area or partial address found",
        details: "Include your full address or at minimum a Google Maps embed showing your service area.",
        recommendation: "Add a Google Maps embed showing your location or service area. Include your full address in the footer. Make sure it matches your Google Business Profile exactly.",
        impact: "Address visibility is a local SEO ranking factor. Google cross-references your on-page address with your GBP. Inconsistencies hurt rankings.",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "fail",
      message: "No physical address or service area found",
      details: "Local businesses must show where they operate.",
      recommendation: "Add your address to the footer and a Google Maps embed to your contact page. If you're a service-area business, list every city/town you serve.",
      impact: "Visitors can't trust a business with no address. Google can't rank you locally without location signals. This hurts both trust and SEO simultaneously.",
    };
  },
};

export const socialLinksCheck: Check = {
  id: "social-links",
  name: "Social Media Links",
  category: "trust",
  weight: 3,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);

    const socialDomains = [
      "facebook.com", "instagram.com", "twitter.com", "x.com",
      "linkedin.com", "youtube.com", "tiktok.com", "nextdoor.com", "yelp.com",
    ];

    const foundSocials: string[] = [];

    // Stage 1: Check DOM <a> tags
    $("a").each((_, el) => {
      const href = $(el).attr("href") || "";
      for (const domain of socialDomains) {
        const name = domain.replace(".com", "");
        if (href.includes(domain) && !foundSocials.includes(name)) {
          foundSocials.push(name);
        }
      }
    });

    // Stage 2: Scan full HTML source (catches links in embedded widgets / script data)
    if (foundSocials.length < 2) {
      const htmlLower = ctx.html.toLowerCase();
      for (const domain of socialDomains) {
        const name = domain.replace(".com", "");
        if (!foundSocials.includes(name) && htmlLower.includes(domain)) {
          foundSocials.push(name);
        }
      }
    }

    // Stage 3: Check embedded state data for structured social link configs
    if (foundSocials.length < 2) {
      const embeddedSocials = extractEmbeddedSocialLinks(ctx.html);
      for (const s of embeddedSocials) {
        const name = s.platform.toLowerCase();
        if (!foundSocials.includes(name)) {
          foundSocials.push(name);
        }
      }
    }

    const isJs = isJsRenderedPage(ctx.html);
    const sourceNote = isJs && foundSocials.length > 0
      ? " (detected in embedded page data — rendered by JavaScript)"
      : "";

    if (foundSocials.length >= 2) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "pass",
        message: `Social links found: ${foundSocials.join(", ")}${sourceNote}`,
      };
    }

    if (foundSocials.length === 1) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `Only one social link found (${foundSocials[0]})${sourceNote}`,
        details: "Add at least Facebook and Google Business Profile links.",
        recommendation: "Add links to Facebook and Google Business Profile at minimum. Place social icons in the footer.",
        impact: "Social profiles serve as independent verification that your business exists and is active. Missing social links raise questions about legitimacy.",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "fail",
      message: "No social media links found",
      details: "Social profiles build credibility. At minimum, link to your Facebook page and Google Business Profile.",
      recommendation: "Create and link to your Facebook Business Page and Google Business Profile. These are free, take 15 minutes each, and immediately boost your online presence.",
      impact: "Zero social presence signals a business that's either brand new, inactive, or not legitimate. Visitors will check — and if they find nothing, they leave.",
    };
  },
};
