import type { Check, AuditContext, CheckResult } from "../types.js";
import * as cheerio from "cheerio";

export const sslCheck: Check = {
  id: "ssl-https",
  name: "SSL Certificate (HTTPS)",
  category: "technical",
  weight: 8,

  run(ctx: AuditContext): CheckResult {
    if (ctx.isHttps) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "pass",
        message: `Site is served over HTTPS (${ctx.finalUrl})`,
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "fail",
      message: "Site is not using HTTPS",
      details: "Google flags non-HTTPS sites as \"Not Secure\" in Chrome. This destroys trust and hurts rankings.",
      recommendation: "Install an SSL certificate immediately. Most hosting providers offer free SSL through Let's Encrypt. This is a 10-minute fix with massive impact.",
      impact: "Chrome shows a \"Not Secure\" warning to every visitor. 85% of users will leave a site flagged as insecure. Google also ranks HTTPS sites higher.",
    };
  },
};

export const pageSpeedCheck: Check = {
  id: "page-speed",
  name: "Page Load Speed",
  category: "technical",
  weight: 6,

  run(ctx: AuditContext): CheckResult {
    const loadTimeSec = ctx.loadTime / 1000;

    if (loadTimeSec <= 2) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "pass",
        message: `Fast load time: ${loadTimeSec.toFixed(2)}s`,
      };
    }

    if (loadTimeSec <= 4) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `Moderate load time: ${loadTimeSec.toFixed(2)}s — should be under 3s`,
        details: "53% of mobile users leave if a page takes over 3 seconds to load. Optimize images, enable caching, and minimize JavaScript.",
        recommendation: "Compress images (use WebP format), enable browser caching, minimize CSS/JS, and use a CDN. Target under 2 seconds for best results.",
        impact: "Every additional second of load time increases bounce rate by 32%. At ${loadTimeSec.toFixed(1)}s, you're losing a meaningful percentage of mobile visitors.",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "fail",
      message: `Slow load time: ${loadTimeSec.toFixed(2)}s — well over the 3s threshold`,
      details: "Pages taking over 4 seconds to load lose 25% of visitors. This is likely caused by unoptimized images, too much JavaScript, or a slow server.",
      recommendation: "Immediate fixes: (1) Compress all images to WebP, (2) Lazy-load below-fold images, (3) Minimize render-blocking JS, (4) Enable server-side caching. Consider switching to a faster host.",
      impact: "At ${loadTimeSec.toFixed(1)}s, you're losing roughly 25-40% of visitors before they even see your content. This undermines every other optimization.",
    };
  },
};

export const viewportCheck: Check = {
  id: "viewport-meta",
  name: "Mobile Viewport",
  category: "mobile",
  weight: 6,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);
    const viewport = $('meta[name="viewport"]').attr("content");

    if (!viewport) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "fail",
        message: "No viewport meta tag — site won't display correctly on mobile",
        details: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> to the <head> section.",
        recommendation: "Add the viewport meta tag to your HTML <head>. This is a one-line fix that's essential for mobile display.",
        impact: "Without a viewport tag, mobile users see a desktop-sized page shrunk to fit their screen. Text is unreadable, buttons are untappable. You lose nearly all mobile visitors.",
      };
    }

    if (!viewport.includes("width=device-width")) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `Viewport meta found but may not be optimal: ${viewport}`,
        details: "Use `width=device-width, initial-scale=1` for best mobile rendering.",
        recommendation: "Update to: <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
        impact: "An improperly configured viewport can cause layout issues on specific devices, leading to a frustrating experience for a portion of mobile users.",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "pass",
      message: "Viewport meta tag properly configured",
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
        status: "skip",
        message: "No images found on the page",
      };
    }

    const withAlt = images.filter((_, el) => {
      const alt = $(el).attr("alt");
      return alt !== undefined && alt.trim().length > 0;
    }).length;

    const missing = total - withAlt;
    const percentage = Math.round((withAlt / total) * 100);

    if (missing === 0) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "pass",
        message: `All ${total} images have alt text`,
      };
    }

    if (percentage >= 70) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `${missing} of ${total} images missing alt text (${percentage}% covered)`,
        details: "Use descriptive alt text that includes relevant keywords. Don't keyword-stuff — describe what's in the image.",
        recommendation: "Add descriptive alt text to the remaining images. For local businesses, include service + location when relevant. Example: alt=\"roof repair in Asheville NC\".",
        impact: "Alt tags help Google understand your images and rank you in image search. Missing alt tags are a missed SEO opportunity and an accessibility issue.",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "fail",
      message: `${missing} of ${total} images missing alt text (only ${percentage}% covered)`,
      details: "Alt text is important for both SEO and accessibility. Describe each image with relevant keywords.",
      recommendation: "Add alt text to all images. Use natural descriptions with keywords: alt=\"licensed plumber installing water heater in Asheville home\". Never use generic text like \"image1\".",
      impact: "Google Image Search drives 23% of all web searches. Without alt tags, your images are invisible to this traffic source. It's also an accessibility compliance issue.",
    };
  },
};

export const privacyPolicyCheck: Check = {
  id: "privacy-policy",
  name: "Privacy Policy Page",
  category: "trust",
  weight: 3,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);

    const privacyLinks = $("a").filter((_, el) => {
      const text = $(el).text().toLowerCase();
      const href = ($(el).attr("href") || "").toLowerCase();
      return (
        text.includes("privacy") ||
        href.includes("privacy") ||
        text.includes("data protection")
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
      details: "A privacy policy is legally required if you collect any user data (forms, analytics, cookies). It's also required for Google Ads and Facebook Ads.",
      recommendation: "Add a privacy policy page and link to it in the footer. Use a generator (Termly, TermsFeed) for a compliant policy. This takes 15 minutes.",
      impact: "Without a privacy policy, you can't run Google Ads or Facebook Ads — they'll reject your account. It's also a legal liability if you have a contact form.",
    };
  },
};
