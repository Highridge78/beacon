import * as cheerio from "cheerio";
import type { Check, AuditContext, CheckResult } from "../types.js";

export const reviewsCheck: Check = {
  id: "reviews-testimonials",
  name: "Reviews / Testimonials",
  category: "trust",
  weight: 7,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);
    const bodyText = $("body").text().toLowerCase();
    const bodyHtml = ctx.html.toLowerCase();

    // Look for review/testimonial sections
    const reviewIndicators = [
      "testimonial",
      "review",
      "what our customers say",
      "what people say",
      "what clients say",
      "customer stories",
      "client feedback",
      "hear from our",
      "★★★★",
      "⭐⭐⭐",
      "star rating",
      "5-star",
      "5 star",
    ];

    const hasReviews = reviewIndicators.some((ind) => bodyText.includes(ind));

    // Also check for Google Reviews widget, Yelp badge, etc.
    const hasReviewWidget =
      bodyHtml.includes("google.com/maps") ||
      bodyHtml.includes("elfsight") ||
      bodyHtml.includes("birdeye") ||
      bodyHtml.includes("podium") ||
      bodyHtml.includes("trustpilot") ||
      bodyHtml.includes("yelp.com/biz");

    // Check for review schema
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
      details:
        "88% of consumers trust online reviews as much as personal recommendations. Show real customer testimonials with names and details.",
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

    // Years in business
    if (/\d+\+?\s*years?\s*(of\s+)?experience/i.test(bodyText) || /since\s+\d{4}/i.test(bodyText)) {
      signals.push("years of experience");
    }

    // Licensed/insured
    if (bodyText.includes("licensed") || bodyText.includes("insured") || bodyText.includes("bonded")) {
      signals.push("licensed/insured");
    }

    // Guarantee
    if (bodyText.includes("guarantee") || bodyText.includes("warranty") || bodyText.includes("satisfaction")) {
      signals.push("guarantee/warranty");
    }

    // Free estimate/quote
    if (bodyText.includes("free estimate") || bodyText.includes("free quote") || bodyText.includes("free consultation")) {
      signals.push("free estimate/quote");
    }

    // Family/local/community
    if (
      bodyText.includes("family owned") ||
      bodyText.includes("family-owned") ||
      bodyText.includes("locally owned") ||
      bodyText.includes("local business") ||
      bodyText.includes("generation")
    ) {
      signals.push("family/locally owned");
    }

    // Certifications
    if (bodyText.includes("certified") || bodyText.includes("accredited") || bodyText.includes("bbb")) {
      signals.push("certifications");
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
        details:
          "Add more trust builders: years in business, licensed & insured, satisfaction guarantee, free estimates, certifications. These reduce buyer hesitation.",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "fail",
      message: "No trust signals found on the page",
      details:
        "Local customers need reassurance. Add: years in business, licensed & insured, satisfaction guarantee, free estimates, family-owned. These directly impact conversion rates.",
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

    // Look for address patterns
    const hasStateZip = /\b[A-Z]{2}\s+\d{5}(-\d{4})?\b/.test(bodyText);
    const hasStreetAddress = /\d+\s+\w+\s+(st|street|rd|road|ave|avenue|blvd|boulevard|dr|drive|ln|lane|way|ct|court)\b/i.test(bodyText);

    // Look for Google Maps embed
    const hasMaps =
      ctx.html.includes("google.com/maps") ||
      ctx.html.includes("maps.googleapis.com") ||
      ctx.html.includes("maps.google.com");

    // Look for service area mentions
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
        details:
          "Include your full address or at minimum a Google Maps embed showing your service area. This builds trust and helps with local SEO.",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "fail",
      message: "No physical address or service area found",
      details:
        "Local businesses must show where they operate. Add your address, a Google Maps embed, or at minimum a clear service area description.",
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
      "facebook.com",
      "instagram.com",
      "twitter.com",
      "x.com",
      "linkedin.com",
      "youtube.com",
      "tiktok.com",
      "nextdoor.com",
      "yelp.com",
    ];

    const foundSocials: string[] = [];

    $("a").each((_, el) => {
      const href = $(el).attr("href") || "";
      for (const domain of socialDomains) {
        if (href.includes(domain) && !foundSocials.includes(domain)) {
          foundSocials.push(domain.replace(".com", ""));
        }
      }
    });

    if (foundSocials.length >= 2) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "pass",
        message: `Social links found: ${foundSocials.join(", ")}`,
      };
    }

    if (foundSocials.length === 1) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `Only one social link found (${foundSocials[0]})`,
        details: "Add at least Facebook and Google Business Profile links. For contractors, Nextdoor and Yelp are also valuable.",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "fail",
      message: "No social media links found",
      details:
        "Social profiles build credibility. At minimum, link to your Facebook page and Google Business Profile.",
    };
  },
};
