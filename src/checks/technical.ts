import * as cheerio from "cheerio";
import type { Check, AuditContext, CheckResult } from "../types.js";

export const sslCheck: Check = {
  id: "ssl-certificate",
  name: "SSL Certificate (HTTPS)",
  category: "technical",
  weight: 8,

  run(ctx: AuditContext): CheckResult {
    if (ctx.isHttps) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "pass",
        message: "Site uses HTTPS",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "fail",
      message: "Site does NOT use HTTPS",
      details:
        "Google marks HTTP sites as 'Not Secure' in Chrome. This kills trust immediately. HTTPS is also a ranking factor. Most hosts offer free SSL via Let's Encrypt.",
    };
  },
};

export const mobileViewportCheck: Check = {
  id: "mobile-viewport",
  name: "Mobile Viewport Meta Tag",
  category: "mobile",
  weight: 8,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);
    const viewport = $('meta[name="viewport"]').attr("content");

    if (!viewport) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "fail",
        message: "No viewport meta tag found",
        details:
          'Without <meta name="viewport" content="width=device-width, initial-scale=1">, your site won\'t render properly on mobile. Over 60% of local searches happen on phones.',
      };
    }

    if (!viewport.includes("width=device-width")) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `Viewport tag found but may not be optimal: "${viewport}"`,
        details: 'Use: <meta name="viewport" content="width=device-width, initial-scale=1">',
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "pass",
      message: "Mobile viewport properly configured",
    };
  },
};

export const pageSpeedCheck: Check = {
  id: "page-speed",
  name: "Page Load Time",
  category: "technical",
  weight: 6,

  run(ctx: AuditContext): CheckResult {
    const loadTime = ctx.loadTime;

    if (loadTime < 2000) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "pass",
        message: `Page loaded in ${(loadTime / 1000).toFixed(2)}s — fast`,
      };
    }

    if (loadTime < 4000) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `Page loaded in ${(loadTime / 1000).toFixed(2)}s — could be faster`,
        details:
          "Google recommends pages load in under 3 seconds. 53% of mobile users abandon sites that take over 3 seconds to load.",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "fail",
      message: `Page loaded in ${(loadTime / 1000).toFixed(2)}s — too slow`,
      details:
        "Slow load times kill conversions and hurt SEO rankings. Optimize images, enable compression, and consider a CDN.",
    };
  },
};

export const imageAltCheck: Check = {
  id: "image-alt-tags",
  name: "Image Alt Tags",
  category: "seo",
  weight: 4,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);
    const images = $("img");
    const total = images.length;

    if (total === 0) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: "No images found on the page",
        details: "Local business sites should show real project photos. Images build trust and improve engagement.",
      };
    }

    let withAlt = 0;
    let emptyAlt = 0;

    images.each((_, el) => {
      const alt = $(el).attr("alt");
      if (alt && alt.trim().length > 0) {
        withAlt++;
      } else if (alt === "") {
        emptyAlt++; // Decorative image, technically OK
      }
    });

    const meaningfulImages = total - emptyAlt;
    const percentage = meaningfulImages > 0 ? Math.round((withAlt / meaningfulImages) * 100) : 100;

    if (percentage === 100) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "pass",
        message: `All ${withAlt} meaningful images have alt text`,
      };
    }

    if (percentage >= 70) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `${withAlt}/${meaningfulImages} images have alt text (${percentage}%)`,
        details: "Add descriptive alt text to all images. Include service keywords where natural (e.g., 'hardwood floor installation in living room').",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "fail",
      message: `Only ${withAlt}/${meaningfulImages} images have alt text (${percentage}%)`,
      details:
        "Missing alt tags hurts accessibility and SEO. Describe what's in each image — use service + location keywords where natural.",
    };
  },
};

export const privacyPolicyCheck: Check = {
  id: "privacy-policy",
  name: "Privacy Policy",
  category: "trust",
  weight: 4,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);

    const privacyLinks = $("a").filter((_, el) => {
      const text = $(el).text().toLowerCase();
      const href = ($(el).attr("href") || "").toLowerCase();
      return (
        text.includes("privacy") ||
        href.includes("privacy") ||
        href.includes("privacypolicy")
      );
    });

    if (privacyLinks.length > 0) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "pass",
        message: "Privacy policy link found",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "fail",
      message: "No privacy policy link found",
      details:
        "A privacy policy is legally required if you collect any user data (forms, cookies, analytics). It's also required for running Google Ads and Meta Ads.",
    };
  },
};
