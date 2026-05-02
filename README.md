# Beacon

A local site audit tool for the conversion and trust signals Lighthouse misses.

Lighthouse tells you about performance and accessibility. **Beacon tells you if the site will actually get leads.**

Built for web developers, agencies, and freelancers who build sites for local service businesses (contractors, plumbers, roofers, electricians, etc.).

## Lighthouse vs Beacon

> Comparison hero image coming in next release.

Lighthouse gives [highridgewebdesign.com](https://highridgewebdesign.com) a **100/100 SEO score**. Beacon gives it a **66/100 (B-)**. That gap is everything Lighthouse doesn't check: CTA above the fold, phone number in the header, LocalBusiness schema completeness, social proof, reviews, and more.

## Quick Start

```bash
npx beacon https://example-plumber.com
```

## What Beacon Audits

Designed for server-rendered local business websites (WordPress, Wix, Squarespace, Webflow, Next.js SSR, hand-coded HTML). Pure client-side rendered SPAs require headless browser support, coming in v1.0.

**19 checks across 5 categories:**

### 🎯 Conversion (will this site get leads?)
| Check | What it looks for |
|-------|------------------|
| Phone Number | Phone number visible, ideally above the fold |
| Click-to-Call | `tel:` links for mobile users |
| CTA Above Fold | Clear call-to-action in the hero/header area |
| Contact Form | Working form with appropriate fields |

### 🔍 SEO (will people find this site?)
| Check | What it looks for |
|-------|------------------|
| Meta Title | Length, keywords, location in title tag |
| Meta Description | Length and presence |
| H1 Tag | Single, descriptive H1 heading |
| LocalBusiness Schema | JSON-LD structured data with complete fields |
| Service Schema | Service markup for search visibility |
| Image Alt Tags | Descriptive alt text on images |
| Internal Links | Linking structure across pages |

### 🤝 Trust (will visitors feel confident?)
| Check | What it looks for |
|-------|------------------|
| Reviews/Testimonials | Customer reviews or testimonial sections |
| Trust Signals | Years in business, licensed, insured, guarantees |
| Address/Service Area | Physical address or Google Maps embed |
| Social Links | Facebook, Google Business, Yelp, etc. |
| Privacy Policy | Required for ads and legal compliance |

### ⚙️ Technical
| Check | What it looks for |
|-------|------------------|
| SSL (HTTPS) | Secure connection |
| Page Speed | Load time under 3 seconds |

### 📱 Mobile
| Check | What it looks for |
|-------|------------------|
| Click-to-Call | `tel:` links that work on mobile |
| Viewport | Proper mobile viewport meta tag |

## Output Formats

### Terminal (default)
```bash
npx beacon https://example.com
```

Color-coded score card with pass/fail for each check, category scores, and recommendations.

### JSON
```bash
npx beacon https://example.com --json
```

Machine-readable output for integrations and pipelines.

### HTML Report
```bash
npx beacon https://example.com --html
```

Generates a shareable HTML report — dark theme, professional layout, perfect for sending to clients or prospects.

### Save to File
```bash
npx beacon https://example.com --json -o results.json
npx beacon https://example.com --html -o report.html
```

## Scoring

Each check has a weight (1–10) based on its impact on lead generation. Conversion and trust checks are weighted higher because they directly affect whether a local business gets clients.

| Grade | Score | Meaning |
|-------|-------|---------|
| A | 90–100 | Conversion-ready — site is optimized for leads |
| A- | 80–89 | Strong — minor improvements possible |
| B | 70–79 | Good foundation — some gaps to address |
| B- | 60–69 | Decent — notable issues affecting conversions |
| C | 50–59 | Needs work — significant gaps |
| D | 30–49 | Poor — major issues across multiple categories |
| F | 0–29 | Not ready for traffic |

## Why This Exists

Generic audit tools check page speed and accessibility. They don't check the things that actually determine whether a local business website generates leads:

- Is there a phone number above the fold?
- Is click-to-call working on mobile?
- Is there LocalBusiness schema markup?
- Are there trust signals (reviews, years in business)?
- Is there a clear call-to-action?

Every agency checks these manually. Every. Single. Time.

Beacon automates that process.

## Maintained by one person

Beacon is maintained by Jeremy Black. Issue and PR response times are best-effort, typically within 7 days.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).

---

Built by [Jeremy Black](https://github.com/Highridge78) at [High Ridge Web Design](https://highridgewebdesign.com) — we fix what Beacon finds.
