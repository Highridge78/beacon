import * as cheerio from "cheerio";
import type { Check, AuditContext, CheckResult } from "../types.js";

/**
 * Checks footer completeness — a strong footer for local businesses includes:
 * - Business name
 * - Phone number
 * - Address or service area
 * - Hours of operation
 * - Links to key pages (services, about, contact)
 * - Social media links
 * - Copyright / legal
 *
 * NAP (Name, Address, Phone) consistency in the footer is critical for
 * local SEO and builds trust with visitors who scroll to the bottom.
 *
 * Many sites use <div> wrappers instead of <footer>, and JS-rendered sites
 * (React, Vue, Angular) may embed footer content inside <script> state blobs
 * like __PRELOADED_STATE__. We handle both cases.
 */

const PHONE_REGEX = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

/* ── Selectors ── */

/** Primary: standard footer elements */
const PRIMARY_SELECTORS = "footer, [role='contentinfo']";

/** Secondary: div / section / aside with footer-ish class or ID */
const SECONDARY_SELECTORS = [
  "[class*='footer']",
  "[id*='footer']",
  "[class*='Footer']",
  "[id*='Footer']",
  "[class*='site-bottom']",
  "[id*='site-bottom']",
  "[class*='bottom-bar']",
  "[id*='bottom-bar']",
  "[class*='page-bottom']",
  "[id*='page-bottom']",
].join(", ");

/* ── Helpers ── */

/** Pull NAP signals from a text blob */
function extractSignals(text: string, $?: cheerio.CheerioAPI, scope?: cheerio.Cheerio<any>) {
  const lower = text.toLowerCase();
  const signals: string[] = [];
  const missing: string[] = [];

  // 1. Phone number
  if (PHONE_REGEX.test(text)) {
    signals.push("phone number");
  } else {
    missing.push("phone number");
  }

  // 2. Address or service area
  const hasAddress =
    /\b[A-Z]{2}\s+\d{5}\b/.test(text) ||
    /\d+\s+\w+\s+(st|street|rd|road|ave|avenue|blvd|dr|drive|ln|lane|way|ct|court|bypass|pike|hwy|highway)\b/i.test(text);
  const hasServiceArea = /serv(ing|ice)\s+(area|the|all|throughout)/i.test(lower);

  if (hasAddress || hasServiceArea) {
    signals.push("address/service area");
  } else {
    missing.push("address or service area");
  }

  // 3. Hours of operation
  const hasHours =
    /\d{1,2}:\d{2}\s*(am|pm|a\.m\.|p\.m\.)/i.test(text) ||
    lower.includes("hours") ||
    lower.includes("mon") ||
    lower.includes("monday") ||
    lower.includes("24/7") ||
    lower.includes("open daily");

  if (hasHours) {
    signals.push("hours of operation");
  } else {
    missing.push("hours of operation");
  }

  // 4. Copyright / business name
  if (/©|\bcopyright\b/i.test(text) || /\d{4}/.test(text)) {
    signals.push("copyright/business name");
  } else {
    missing.push("copyright/business name");
  }

  // 5. Email or contact link
  const hasEmail = /\S+@\S+\.\S+/.test(text) || /mailto:/i.test(text);
  let hasContactLink = false;
  if ($ && scope) {
    hasContactLink =
      scope.find("a").filter((_, el) => {
        const t = $(el).text().toLowerCase();
        const href = ($(el).attr("href") || "").toLowerCase();
        return t.includes("contact") || href.includes("contact");
      }).length > 0;
  }

  if (hasEmail || hasContactLink) {
    signals.push("email/contact link");
  } else {
    missing.push("email or contact link");
  }

  // 6. Social links
  const socialDomains = [
    "facebook.com",
    "instagram.com",
    "google.com/maps",
    "yelp.com",
    "linkedin.com",
    "x.com",
    "twitter.com",
  ];
  let hasSocial = false;
  if ($ && scope) {
    hasSocial =
      scope.find("a").filter((_, el) => {
        const href = ($(el).attr("href") || "").toLowerCase();
        return socialDomains.some((d) => href.includes(d));
      }).length > 0;
  }
  // Also check text for social URLs (e.g. inside JSON/script blobs)
  if (!hasSocial) {
    hasSocial = socialDomains.some((d) => lower.includes(d));
  }

  if (hasSocial) {
    signals.push("social media links");
  } else {
    missing.push("social media links");
  }

  return { signals, missing };
}

/** Score signals into a CheckResult */
function buildResult(
  check: Check,
  signals: string[],
  missing: string[],
  source: "dom" | "embedded",
): CheckResult {
  const base = {
    id: check.id,
    name: check.name,
    category: check.category,
    weight: check.weight,
  };

  const sourceNote =
    source === "embedded"
      ? " (detected in embedded page data — the site renders its footer with JavaScript)"
      : "";

  if (signals.length >= 5) {
    return {
      ...base,
      status: "pass",
      message: `Complete footer — includes ${signals.join(", ")}${sourceNote}`,
    };
  }

  if (signals.length >= 3) {
    return {
      ...base,
      status: "warn",
      message: `Footer has good basics (${signals.join(", ")}) but is missing: ${missing.join(", ")}${sourceNote}`,
      details:
        "A complete footer includes: phone, address, hours, email, social links, and copyright. Each missing item reduces trust and SEO value.",
      recommendation: `Add these to your footer: ${missing.join(", ")}. Ensure NAP (Name, Address, Phone) matches your Google Business Profile exactly.`,
      impact:
        "Footer NAP consistency is a direct local SEO ranking factor. Google cross-references your footer info with your Google Business Profile.",
    };
  }

  if (signals.length > 0) {
    return {
      ...base,
      status: "fail",
      message: `Footer is incomplete — only has: ${signals.join(", ")}${sourceNote}`,
      details:
        "The footer is the second most-viewed area of a website (after the hero). For local businesses, it's where visitors go to find your phone number, address, and hours.",
      recommendation:
        "Build a complete footer: business name, phone (clickable), address/service area, hours, email, links to service pages, social icons, and copyright.",
      impact:
        "An incomplete footer signals an unfinished or low-effort business. Visitors associate footer quality with business quality.",
    };
  }

  return {
    ...base,
    status: "fail",
    message: "No footer element found — missing essential business information placement",
    details:
      "The footer is where visitors expect to find your phone number, address, and hours. It's also critical for local SEO (NAP consistency).",
    recommendation:
      "Add a footer with: business name, phone number, address/service area, hours of operation, links to services, and social media links.",
    impact:
      "Visitors who scroll to the footer are looking for contact info and trust signals. A missing or empty footer loses these high-intent visitors.",
  };
}

/**
 * Attempt to extract NAP/footer content from embedded script data.
 * Handles __PRELOADED_STATE__, JSON-LD, Next.js __NEXT_DATA__, and similar
 * patterns where JS-rendered sites store widget/component content.
 */
function extractEmbeddedFooterContent(html: string): string | null {
  // Patterns for embedded state blobs
  const statePatterns = [
    /__PRELOADED_STATE__\s*=\s*({[\s\S]*?});\s*<\/script>/,
    /__NEXT_DATA__\s*=\s*({[\s\S]*?});\s*<\/script>/,
    /window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});\s*<\/script>/,
  ];

  for (const pattern of statePatterns) {
    const match = html.match(pattern);
    if (match) {
      try {
        const stateStr = match[1];
        // Look for footer-like widget content in the state blob
        // Many platforms store widget HTML as escaped strings in JSON
        const footerHtmlChunks: string[] = [];

        // Extract all "html" values from the JSON that contain NAP-like info
        const htmlValues = stateStr.matchAll(/"html"\s*:\s*"((?:[^"\\]|\\.)*)"/g);
        for (const m of htmlValues) {
          // Unescape JSON string
          const decoded = m[1]
            .replace(/\\r\\n/g, "\n")
            .replace(/\\n/g, "\n")
            .replace(/\\t/g, "\t")
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, "\\")
            .replace(/\\u003c/gi, "<")
            .replace(/\\u003e/gi, ">")
            .replace(/\\u0026/gi, "&")
            .replace(/\\u002F/gi, "/");

          // Keep chunks that look like they have NAP info
          if (PHONE_REGEX.test(decoded) || /\b\d{5}\b/.test(decoded)) {
            footerHtmlChunks.push(decoded);
          }
        }

        if (footerHtmlChunks.length > 0) {
          return footerHtmlChunks.join("\n");
        }

        // Also check if the raw state string has phone+address together
        if (PHONE_REGEX.test(stateStr) && /\b[A-Z]{2}\s+\d{5}\b/.test(stateStr)) {
          return stateStr;
        }
      } catch {
        // JSON parse failed, continue to next pattern
      }
    }
  }

  // Fallback: check for NAP clusters in ANY <script> tag content
  const scriptPattern = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch;
  while ((scriptMatch = scriptPattern.exec(html)) !== null) {
    const content = scriptMatch[1];
    // Only consider scripts that have BOTH a phone number and an address-like pattern
    if (
      PHONE_REGEX.test(content) &&
      (/\b[A-Z]{2}\s+\d{5}\b/.test(content) ||
        /\d+\s+\w+\s+(st|street|rd|road|ave|avenue|blvd|dr|drive|ln|lane|way|ct|court|bypass|pike|hwy|highway)\b/i.test(content)) &&
      /mailto:|@\w+\.\w+/.test(content)
    ) {
      return content;
    }
  }

  return null;
}

export const footerCheck: Check = {
  id: "footer-completeness",
  name: "Footer Completeness (NAP + Info)",
  category: "trust",
  weight: 5,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);

    /* ── Stage 1: standard footer elements ── */
    let footer: cheerio.Cheerio<cheerio.AnyNode> = $(PRIMARY_SELECTORS);

    /* ── Stage 2: div/section/aside with footer-like class/ID ── */
    if (footer.length === 0) {
      footer = $(SECONDARY_SELECTORS);
      // Filter out tiny nav-only footers (e.g. <span class="footer_links">)
      // by keeping only containers with substantial content
      if (footer.length > 0) {
        const substantial = footer.filter((_, el) => {
          const text = $(el).text().trim();
          return text.length > 50;
        });
        if (substantial.length > 0) {
          footer = substantial;
        }
      }
    }

    /* ── Stage 3: evaluate DOM footer if found ── */
    if (footer.length > 0) {
      const footerText = footer.text();
      const { signals, missing } = extractSignals(footerText, $, footer);
      return buildResult(this, signals, missing, "dom");
    }

    /* ── Stage 4: JS-rendered fallback — check embedded state data ── */
    const embedded = extractEmbeddedFooterContent(ctx.html);
    if (embedded) {
      // Strip HTML tags from the extracted content for text analysis
      const stripped = embedded.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
      const { signals, missing } = extractSignals(stripped);
      if (signals.length > 0) {
        return buildResult(this, signals, missing, "embedded");
      }
    }

    /* ── Stage 5: nothing found ── */
    return buildResult(this, [], [], "dom");
  },
};
