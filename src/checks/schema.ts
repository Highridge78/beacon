import * as cheerio from "cheerio";
import type { Check, AuditContext, CheckResult } from "../types.js";

export const localBusinessSchemaCheck: Check = {
  id: "schema-local-business",
  name: "LocalBusiness Schema Markup",
  category: "seo",
  weight: 7,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);

    // Look for JSON-LD structured data
    const jsonLdScripts = $('script[type="application/ld+json"]');
    const schemas: any[] = [];

    jsonLdScripts.each((_, el) => {
      try {
        const content = $(el).html();
        if (content) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            schemas.push(...parsed);
          } else {
            schemas.push(parsed);
          }
        }
      } catch {
        // Invalid JSON-LD, skip
      }
    });

    // Check for LocalBusiness or subtypes
    const localBusinessTypes = [
      "LocalBusiness",
      "HomeAndConstructionBusiness",
      "Plumber",
      "Electrician",
      "RoofingContractor",
      "GeneralContractor",
      "HVACBusiness",
      "LocksmithService",
      "MovingCompany",
      "PestControl",
      "AutoRepair",
      "Dentist",
      "LegalService",
      "RealEstateAgent",
      "Restaurant",
      "Store",
      "ProfessionalService",
    ];

    const localBiz = schemas.find((s) => {
      const type = s["@type"];
      if (Array.isArray(type)) {
        return type.some((t: string) => localBusinessTypes.includes(t));
      }
      return localBusinessTypes.includes(type);
    });

    if (!localBiz) {
      // Check for microdata as fallback
      const hasMicrodata =
        ctx.html.includes('itemtype="http://schema.org/LocalBusiness"') ||
        ctx.html.includes('itemtype="https://schema.org/LocalBusiness"');

      if (hasMicrodata) {
        return {
          id: this.id,
          name: this.name,
          category: this.category,
          weight: this.weight,
          status: "warn",
          message: "LocalBusiness markup found as microdata — JSON-LD is preferred",
          details:
            "Google recommends JSON-LD format for structured data. It's easier to maintain and less error-prone than microdata.",
        };
      }

      return {
        id: this.id,
        name: this.name,
        category: this.category,
        weight: this.weight,
        status: "fail",
        message: "No LocalBusiness schema markup found",
        details:
          "LocalBusiness structured data helps Google understand your business type, location, hours, and services. It directly impacts local pack rankings and rich snippets.",
      };
    }

    // Validate completeness
    const missing: string[] = [];
    if (!localBiz.name) missing.push("name");
    if (!localBiz.address) missing.push("address");
    if (!localBiz.telephone) missing.push("telephone");
    if (!localBiz.openingHours && !localBiz.openingHoursSpecification) missing.push("openingHours");
    if (!localBiz.url) missing.push("url");

    if (missing.length > 0) {
      return {
        id: this.id,
        name: this.name,
        category: this.category,
        weight: this.weight,
        status: "warn",
        message: `LocalBusiness schema found but missing: ${missing.join(", ")}`,
        details: `Complete schema markup improves your chances of appearing in Google's local pack. Add: ${missing.join(", ")}.`,
      };
    }

    return {
      id: this.id,
      name: this.name,
      category: this.category,
      weight: this.weight,
      status: "pass",
      message: `Complete LocalBusiness schema found (${localBiz["@type"]})`,
    };
  },
};

export const serviceSchemaCheck: Check = {
  id: "schema-service",
  name: "Service Schema Markup",
  category: "seo",
  weight: 4,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);
    const jsonLdScripts = $('script[type="application/ld+json"]');

    let hasService = false;

    jsonLdScripts.each((_, el) => {
      try {
        const content = $(el).html();
        if (content) {
          const text = content;
          if (text.includes('"Service"') || text.includes('"hasOfferCatalog"') || text.includes('"makesOffer"')) {
            hasService = true;
          }
        }
      } catch {
        // skip
      }
    });

    if (!hasService) {
      return {
        id: this.id,
        name: this.name,
        category: this.category,
        weight: this.weight,
        status: "warn",
        message: "No Service schema markup found",
        details:
          "Adding Service structured data helps search engines understand what services you offer and can improve visibility in service-related searches.",
      };
    }

    return {
      id: this.id,
      name: this.name,
      category: this.category,
      weight: this.weight,
      status: "pass",
      message: "Service schema markup found",
    };
  },
};
