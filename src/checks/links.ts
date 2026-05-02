import * as cheerio from "cheerio";
import type { Check, AuditContext, CheckResult } from "../types.js";

export const internalLinksCheck: Check = {
  id: "internal-links",
  name: "Internal Linking Structure",
  category: "seo",
  weight: 4,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);

    const baseUrl = new URL(ctx.finalUrl);
    const baseDomain = baseUrl.hostname;

    let internalLinks = 0;
    let externalLinks = 0;
    const uniqueInternalPaths = new Set<string>();

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";

      // Skip anchors, javascript, mailto, tel
      if (href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      try {
        const linkUrl = new URL(href, ctx.finalUrl);
        if (linkUrl.hostname === baseDomain) {
          internalLinks++;
          uniqueInternalPaths.add(linkUrl.pathname);
        } else {
          externalLinks++;
        }
      } catch {
        // Relative link
        internalLinks++;
      }
    });

    if (uniqueInternalPaths.size >= 4) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "pass",
        message: `Good internal linking: ${internalLinks} internal links across ${uniqueInternalPaths.size} unique pages`,
      };
    }

    if (uniqueInternalPaths.size >= 2) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `${internalLinks} internal links but only ${uniqueInternalPaths.size} unique pages linked`,
        details:
          "Add links to service pages, about page, gallery/portfolio, and contact page. Strong internal linking helps SEO and keeps visitors on your site.",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "fail",
      message: `Weak internal linking: only ${uniqueInternalPaths.size} unique pages linked`,
      details:
        "Your site needs clear navigation linking to service pages, about, portfolio/gallery, and contact. This improves both UX and SEO.",
    };
  },
};
