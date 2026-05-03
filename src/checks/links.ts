import * as cheerio from "cheerio";
import type { Check, AuditContext, CheckResult } from "../types.js";

export const internalLinksCheck: Check = {
  id: "internal-links",
  name: "Internal Linking Structure",
  category: "seo",
  weight: 4,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);

    let url: URL;
    try {
      url = new URL(ctx.finalUrl);
    } catch {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "skip",
        message: "Could not parse URL for internal link analysis",
      };
    }

    const links = $("a[href]");
    let internal = 0;
    let external = 0;

    links.each((_, el) => {
      const href = $(el).attr("href") || "";
      try {
        const linkUrl = new URL(href, ctx.finalUrl);
        if (linkUrl.hostname === url.hostname) {
          internal++;
        } else if (linkUrl.protocol.startsWith("http")) {
          external++;
        }
      } catch {
        if (href.startsWith("/") || href.startsWith("#") || href.startsWith("./")) {
          internal++;
        }
      }
    });

    if (internal >= 10) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "pass",
        message: `Good internal linking: ${internal} internal links, ${external} external links`,
      };
    }

    if (internal >= 5) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `${internal} internal links found — could be stronger`,
        details: "Link to your service pages, about page, and contact page from the homepage. More internal links help Google discover and rank all your pages.",
        recommendation: "Add links to every service page from your homepage. Each service page should link back to related services. Aim for 15+ internal links on the homepage.",
        impact: "Internal links help Google crawl and index your pages. Without enough links, your inner pages may not appear in search results at all.",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "fail",
      message: `Only ${internal} internal links found — weak site structure`,
      details: "A well-linked homepage should have 10+ internal links pointing to service pages, about, contact, and other key pages.",
      recommendation: "Create internal links to every important page: each service, about, contact, reviews, service areas. Use descriptive anchor text like \"roof repair services\" instead of \"click here\".",
      impact: "Weak internal linking means Google can't find or properly value your inner pages. This limits your entire site to ranking for just homepage keywords.",
    };
  },
};
