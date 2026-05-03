/**
 * Beacon tests — at least 1 test per category + error handling
 */

import { describe, test, expect } from "vitest";
import type { AuditContext } from "../src/types.js";
import { ctaCheck } from "../src/checks/cta.js";
import { phoneCheck, clickToCallCheck } from "../src/checks/phone.js";
import { formCheck } from "../src/checks/form.js";
import { headlineCheck } from "../src/checks/headline.js";
import { stickyCtaCheck } from "../src/checks/sticky-cta.js";
import { offersCheck } from "../src/checks/offers.js";
import { navigationCheck } from "../src/checks/navigation.js";
import { metaTitleCheck, metaDescriptionCheck, h1Check } from "../src/checks/meta.js";
import { localBusinessSchemaCheck } from "../src/checks/schema.js";
import { serviceAreaCheck } from "../src/checks/service-area.js";
import { internalLinksCheck } from "../src/checks/links.js";
import { reviewsCheck, trustSignalsCheck, addressCheck, socialLinksCheck } from "../src/checks/trust.js";
import { googleReviewsCheck } from "../src/checks/google-reviews.js";
import { trustStackCheck } from "../src/checks/trust-stack.js";
import { footerCheck } from "../src/checks/footer.js";
import { sslCheck, pageSpeedCheck, viewportCheck, imageAltCheck } from "../src/checks/technical.js";
import { calculateScore } from "../src/scorer.js";
import { generateTopFixes, estimateConversionImpact, generateNarrative } from "../src/narrative.js";

function makeCtx(htmlOverride?: string, overrides?: Partial<AuditContext>): AuditContext {
  return {
    url: "https://example-plumber.com",
    finalUrl: "https://example-plumber.com/",
    html: htmlOverride || "<html><head><title>Test</title></head><body></body></html>",
    statusCode: 200,
    headers: {},
    ttfb: 200,
    loadTime: 500,
    isHttps: true,
    ...overrides,
  };
}

// ═══ CONVERSION CHECKS ═══

describe("Conversion Checks", () => {
  test("CTA: passes when CTA button is in hero", () => {
    const ctx = makeCtx(`<html><body>
      <header><a href="/contact">Get a Quote</a></header>
    </body></html>`);
    const result = ctaCheck.run(ctx);
    expect(result.status).toBe("pass");
  });

  test("CTA: fails when no CTA found", () => {
    const ctx = makeCtx(`<html><body><p>Hello world</p></body></html>`);
    const result = ctaCheck.run(ctx);
    expect(result.status).toBe("fail");
    expect(result.recommendation).toBeTruthy();
    expect(result.impact).toBeTruthy();
  });

  test("Phone: passes when phone in header", () => {
    const ctx = makeCtx(`<html><body>
      <header>(555) 123-4567</header>
    </body></html>`);
    const result = phoneCheck.run(ctx);
    expect(result.status).toBe("pass");
  });

  test("Phone: warns when phone not in header", () => {
    const ctx = makeCtx(`<html><body>
      <div>Some content</div>
      <footer>(555) 123-4567</footer>
    </body></html>`);
    const result = phoneCheck.run(ctx);
    expect(result.status).toBe("warn");
  });

  test("Phone: fails when no phone found", () => {
    const ctx = makeCtx(`<html><body><p>No phone here</p></body></html>`);
    const result = phoneCheck.run(ctx);
    expect(result.status).toBe("fail");
  });

  test("Headline: passes with strong headline", () => {
    const ctx = makeCtx(`<html><body>
      <h1>Expert Roof Repair in Asheville, NC — Licensed & Fast</h1>
    </body></html>`);
    const result = headlineCheck.run(ctx);
    expect(result.status).toBe("pass");
  });

  test("Headline: fails with weak headline", () => {
    const ctx = makeCtx(`<html><body>
      <h1>Welcome</h1>
    </body></html>`);
    const result = headlineCheck.run(ctx);
    expect(result.status).toBe("fail");
  });

  test("Headline: fails with no H1", () => {
    const ctx = makeCtx(`<html><body><p>No headline</p></body></html>`);
    const result = headlineCheck.run(ctx);
    expect(result.status).toBe("fail");
  });

  test("Form: passes when form with fields found", () => {
    const ctx = makeCtx(`<html><body>
      <form>
        <input name="name" type="text">
        <input name="email" type="email">
        <textarea name="message"></textarea>
      </form>
    </body></html>`);
    const result = formCheck.run(ctx);
    expect(result.status).toBe("pass");
  });

  test("Form: fails when no form found", () => {
    const ctx = makeCtx(`<html><body><p>No form</p></body></html>`);
    const result = formCheck.run(ctx);
    expect(result.status).toBe("fail");
  });

  test("Offers: passes with 3+ offers", () => {
    const ctx = makeCtx(`<html><body>
      <p>Free estimate today! 100% satisfaction guarantee. We also offer financing options for larger projects.</p>
    </body></html>`);
    const result = offersCheck.run(ctx);
    expect(result.status).toBe("pass");
  });

  test("Offers: fails when no offers", () => {
    const ctx = makeCtx(`<html><body><p>We do roofing.</p></body></html>`);
    const result = offersCheck.run(ctx);
    expect(result.status).toBe("fail");
  });

  test("Navigation: passes when services in nav", () => {
    const ctx = makeCtx(`<html><body>
      <nav>
        <a href="/">Home</a>
        <a href="/roofing">Roofing</a>
        <a href="/plumbing">Plumbing</a>
        <a href="/electrical">Electrical</a>
      </nav>
    </body></html>`);
    const result = navigationCheck.run(ctx);
    expect(result.status).toBe("pass");
  });

  test("Navigation: fails when nav is all generic", () => {
    const ctx = makeCtx(`<html><body>
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
      </nav>
    </body></html>`);
    const result = navigationCheck.run(ctx);
    expect(result.status).toBe("fail");
  });
});

// ═══ SEO CHECKS ═══

describe("SEO Checks", () => {
  test("Meta title: passes with good title", () => {
    const ctx = makeCtx(`<html><head>
      <title>Expert Plumber in Denver, CO | Fast Plumbing</title>
    </head><body></body></html>`);
    const result = metaTitleCheck.run(ctx);
    expect(result.status).toBe("pass");
  });

  test("Meta title: fails when no title", () => {
    const ctx = makeCtx(`<html><head></head><body></body></html>`);
    const result = metaTitleCheck.run(ctx);
    expect(result.status).toBe("fail");
  });

  test("Meta description: passes with correct length", () => {
    const ctx = makeCtx(`<html><head>
      <meta name="description" content="Professional plumbing services in Denver, CO. Licensed, insured, 20+ years experience. Call (303) 555-1234 for a free estimate today.">
    </head><body></body></html>`);
    const result = metaDescriptionCheck.run(ctx);
    expect(result.status).toBe("pass");
  });

  test("H1: passes with good H1", () => {
    const ctx = makeCtx(`<html><body><h1>Denver's Trusted Plumbing Experts Since 2003</h1></body></html>`);
    const result = h1Check.run(ctx);
    expect(result.status).toBe("pass");
  });

  test("H1: warns with multiple H1s", () => {
    const ctx = makeCtx(`<html><body><h1>First</h1><h1>Second</h1></body></html>`);
    const result = h1Check.run(ctx);
    expect(result.status).toBe("warn");
  });

  test("LocalBusiness schema: passes with complete schema", () => {
    const ctx = makeCtx(`<html><head>
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Plumber",
        "name": "Fast Plumbing",
        "address": { "@type": "PostalAddress", "addressLocality": "Denver" },
        "telephone": "+1-303-555-1234",
        "openingHours": "Mo-Fr 08:00-18:00",
        "url": "https://fastplumbing.com"
      }
      </script>
    </head><body></body></html>`);
    const result = localBusinessSchemaCheck.run(ctx);
    expect(result.status).toBe("pass");
  });

  test("Service area: passes with multiple city mentions", () => {
    const ctx = makeCtx(`<html><body>
      <p>Serving Denver, CO and the surrounding area including Aurora, CO and Lakewood, CO.</p>
    </body></html>`);
    const result = serviceAreaCheck.run(ctx);
    expect(result.status).toBe("pass");
  });

  test("Internal links: passes with 10+ internal links", () => {
    const links = Array.from({ length: 12 }, (_, i) => `<a href="/page-${i}">Page ${i}</a>`).join("\n");
    const ctx = makeCtx(`<html><body>${links}</body></html>`);
    const result = internalLinksCheck.run(ctx);
    expect(result.status).toBe("pass");
  });
});

// ═══ TRUST CHECKS ═══

describe("Trust Checks", () => {
  test("Reviews: passes when testimonials section found", () => {
    const ctx = makeCtx(`<html><body>
      <section>
        <h2>What Our Customers Say</h2>
        <p>"Great work!" - John D. ★★★★★</p>
      </section>
    </body></html>`);
    const result = reviewsCheck.run(ctx);
    expect(result.status).toBe("pass");
  });

  test("Reviews: fails when no reviews", () => {
    const ctx = makeCtx(`<html><body><p>Just a page</p></body></html>`);
    const result = reviewsCheck.run(ctx);
    expect(result.status).toBe("fail");
  });

  test("Trust signals: passes with 3+ signals", () => {
    const ctx = makeCtx(`<html><body>
      <p>20+ years of experience. Licensed and insured. 100% satisfaction guarantee. Free estimates.</p>
    </body></html>`);
    const result = trustSignalsCheck.run(ctx);
    expect(result.status).toBe("pass");
  });

  test("Trust stack: passes with 5+ signals", () => {
    const ctx = makeCtx(`<html><body>
      <p>Since 2003 — 20+ years of experience.</p>
      <p>Licensed, insured, and bonded.</p>
      <p>Read our testimonials and reviews.</p>
      <p>100% satisfaction guarantee.</p>
      <p>BBB accredited business.</p>
      <p>Meet the team behind the work.</p>
      <img src="1.jpg" alt="1"><img src="2.jpg" alt="2"><img src="3.jpg" alt="3"><img src="4.jpg" alt="4"><img src="5.jpg" alt="5">
    </body></html>`);
    const result = trustStackCheck.run(ctx);
    expect(result.status).toBe("pass");
  });

  test("Google reviews: fails when no Google reviews", () => {
    const ctx = makeCtx(`<html><body><p>No reviews here</p></body></html>`);
    const result = googleReviewsCheck.run(ctx);
    expect(result.status).toBe("fail");
  });

  test("Footer: passes with complete footer", () => {
    const ctx = makeCtx(`<html><body>
      <footer>
        <p>Acme Plumbing © 2024</p>
        <p>123 Main St, Denver, CO 80202</p>
        <p>(303) 555-1234</p>
        <p>Mon-Fri 8am-6pm</p>
        <a href="mailto:info@acme.com">Email Us</a>
        <a href="https://facebook.com/acme">Facebook</a>
        <a href="https://instagram.com/acme">Instagram</a>
      </footer>
    </body></html>`);
    const result = footerCheck.run(ctx);
    expect(result.status).toBe("pass");
  });

  test("Footer: fails when no footer", () => {
    const ctx = makeCtx(`<html><body><p>No footer</p></body></html>`);
    const result = footerCheck.run(ctx);
    expect(result.status).toBe("fail");
  });
});

// ═══ TECHNICAL CHECKS ═══

describe("Technical Checks", () => {
  test("SSL: passes on HTTPS", () => {
    const ctx = makeCtx(undefined, { isHttps: true });
    const result = sslCheck.run(ctx);
    expect(result.status).toBe("pass");
  });

  test("SSL: fails on HTTP", () => {
    const ctx = makeCtx(undefined, { isHttps: false, finalUrl: "http://example.com/" });
    const result = sslCheck.run(ctx);
    expect(result.status).toBe("fail");
    expect(result.recommendation).toBeTruthy();
  });

  test("Page speed: passes under 2s", () => {
    const ctx = makeCtx(undefined, { loadTime: 1500 });
    const result = pageSpeedCheck.run(ctx);
    expect(result.status).toBe("pass");
  });

  test("Page speed: fails over 4s", () => {
    const ctx = makeCtx(undefined, { loadTime: 5000 });
    const result = pageSpeedCheck.run(ctx);
    expect(result.status).toBe("fail");
  });

  test("Viewport: passes with correct meta", () => {
    const ctx = makeCtx(`<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body></body></html>`);
    const result = viewportCheck.run(ctx);
    expect(result.status).toBe("pass");
  });

  test("Viewport: fails when missing", () => {
    const ctx = makeCtx(`<html><head></head><body></body></html>`);
    const result = viewportCheck.run(ctx);
    expect(result.status).toBe("fail");
  });
});

// ═══ MOBILE CHECKS ═══

describe("Mobile Checks", () => {
  test("Click-to-call: passes with tel: link", () => {
    const ctx = makeCtx(`<html><body><a href="tel:+13035551234">Call Us</a></body></html>`);
    const result = clickToCallCheck.run(ctx);
    expect(result.status).toBe("pass");
  });

  test("Click-to-call: fails with no tel: link", () => {
    const ctx = makeCtx(`<html><body><p>(303) 555-1234</p></body></html>`);
    const result = clickToCallCheck.run(ctx);
    expect(result.status).toBe("fail");
  });
});

// ═══ SCORER ═══

describe("Scorer", () => {
  test("calculates correct score and grade", () => {
    const checks = [
      { id: "test1", name: "Test 1", category: "conversion" as const, weight: 10, status: "pass" as const, message: "ok" },
      { id: "test2", name: "Test 2", category: "seo" as const, weight: 10, status: "fail" as const, message: "bad" },
      { id: "test3", name: "Test 3", category: "trust" as const, weight: 10, status: "warn" as const, message: "meh" },
    ];
    const { score, grade, categories } = calculateScore(checks);
    // pass = 10, warn = 5, fail = 0, total = 30, earned = 15
    expect(score).toBe(50);
    expect(grade).toBe("C");
    expect(categories.conversion.passed).toBe(1);
    expect(categories.seo.passed).toBe(0);
  });

  test("handles empty checks", () => {
    const { score, grade } = calculateScore([]);
    expect(score).toBe(0);
    expect(grade).toBe("F");
  });
});

// ═══ NARRATIVE ═══

describe("Narrative", () => {
  test("generates top fixes from failed checks", () => {
    const checks = [
      { id: "cta-above-fold", name: "CTA", category: "conversion" as const, weight: 9, status: "fail" as const, message: "No CTA", recommendation: "Add CTA", impact: "Big impact" },
      { id: "phone-number", name: "Phone", category: "conversion" as const, weight: 8, status: "fail" as const, message: "No phone", recommendation: "Add phone", impact: "Lose calls" },
      { id: "ssl-https", name: "SSL", category: "technical" as const, weight: 8, status: "pass" as const, message: "OK" },
    ];
    const fixes = generateTopFixes(checks);
    expect(fixes.length).toBe(2);
    expect(fixes[0].rank).toBe(1);
    expect(fixes[0].checkId).toBe("cta-above-fold");
  });

  test("estimates conversion impact", () => {
    const checks = [
      { id: "cta-above-fold", name: "CTA", category: "conversion" as const, weight: 9, status: "fail" as const, message: "No CTA" },
      { id: "phone-number", name: "Phone", category: "conversion" as const, weight: 8, status: "fail" as const, message: "No phone" },
    ];
    const impact = estimateConversionImpact(checks);
    expect(impact.estimatedLeadLoss).toMatch(/~\d+%/);
    expect(impact.potentialImprovement).toMatch(/Up to \d+%/);
    expect(impact.verdict.length).toBeGreaterThan(10);
  });
});

// ═══ ERROR HANDLING ═══

describe("Error Handling", () => {
  test("checks handle empty HTML gracefully", () => {
    const ctx = makeCtx("");
    // Run a few checks that parse HTML — shouldn't throw
    expect(() => ctaCheck.run(ctx)).not.toThrow();
    expect(() => phoneCheck.run(ctx)).not.toThrow();
    expect(() => formCheck.run(ctx)).not.toThrow();
    expect(() => headlineCheck.run(ctx)).not.toThrow();
    expect(() => reviewsCheck.run(ctx)).not.toThrow();
    expect(() => sslCheck.run(ctx)).not.toThrow();
  });

  test("checks handle malformed HTML gracefully", () => {
    const ctx = makeCtx("<html><body><div><p>unclosed tags<span>more stuff");
    expect(() => ctaCheck.run(ctx)).not.toThrow();
    expect(() => phoneCheck.run(ctx)).not.toThrow();
    expect(() => headlineCheck.run(ctx)).not.toThrow();
  });

  test("all checks return required fields", () => {
    const ctx = makeCtx("");
    const allCheckModules = [
      ctaCheck, phoneCheck, clickToCallCheck, formCheck, headlineCheck,
      stickyCtaCheck, offersCheck, navigationCheck,
      metaTitleCheck, metaDescriptionCheck, h1Check, localBusinessSchemaCheck,
      serviceAreaCheck, internalLinksCheck,
      reviewsCheck, trustSignalsCheck, addressCheck, socialLinksCheck,
      googleReviewsCheck, trustStackCheck, footerCheck,
      sslCheck, pageSpeedCheck, viewportCheck, imageAltCheck,
    ];

    for (const check of allCheckModules) {
      const result = check.run(ctx);
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("category");
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("weight");
      expect(["pass", "fail", "warn", "skip"]).toContain(result.status);
    }
  });
});
