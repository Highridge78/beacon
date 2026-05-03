# Beacon

**Lighthouse gives your site 100/100. Your site still isn't getting leads. Beacon tells you why.**

Beacon audits local business websites for the conversion, SEO, and trust signals that Lighthouse completely ignores — phone number in the header, CTA above the fold, Google Reviews, trust stacking, LocalBusiness schema, and 22 more checks that directly impact whether a visitor becomes a customer.

## The Problem

Lighthouse audits performance, accessibility, and technical SEO. It does not check whether a website will actually generate leads.

A roofing contractor's site can score 100/100 on Lighthouse while missing:
- A phone number in the header
- A call-to-action above the fold
- Any reviews or testimonials
- LocalBusiness schema markup
- A clear service area

That site is technically perfect and functionally useless. Beacon catches what Lighthouse doesn't.

## Example: The Gap

| | Lighthouse | Beacon |
|---|---|---|
| highridgewebdesign.com | **100/100 SEO** | **62/100 (B-)** |
| What it checks | Performance, accessibility, basic SEO | Conversion, trust, local SEO, lead generation |
| What it misses | Everything that generates leads | Nothing — that's the point |

## Quick Start

```bash
npx @highridge/beacon https://example-plumber.com
```

### Output Formats

```bash
# Terminal output (default) — color-coded report with Top 5 Fixes
npx @highridge/beacon https://example.com

# JSON — machine-readable for pipelines and integrations
npx @highridge/beacon https://example.com --json

# HTML — client-ready shareable report
npx @highridge/beacon https://example.com --html

# Save to file
npx @highridge/beacon https://example.com --html -o report.html
npx @highridge/beacon https://example.com --json -o results.json
```

## What Beacon Audits

**27 checks across 5 categories:**

### 🎯 Conversion — Will this site get leads?

| Check | Weight | What it looks for |
|-------|--------|------------------|
| CTA Above the Fold | 9 | Clear call-to-action in the hero/header |
| Above-the-Fold Headline | 8 | Specific, benefit-driven H1 (not "Welcome") |
| Phone Number Visible | 8 | Phone number in the header, not buried in footer |
| Sticky Header CTA | 7 | Fixed header with persistent CTA or phone link |
| Contact Form | 7 | Working form with appropriate fields |
| Compelling Offers | 6 | Free estimate, guarantee, financing, discounts |
| Navigation Clarity | 5 | Services listed in nav (not just "Home \| About \| Contact") |

### 🔍 SEO — Will people find this site?

| Check | Weight | What it looks for |
|-------|--------|------------------|
| LocalBusiness Schema | 7 | JSON-LD structured data with complete fields |
| Meta Title Quality | 6 | Length, keywords, location in title |
| Service Area Clarity | 6 | City/region mentions for local search |
| Meta Description | 5 | Length and presence |
| H1 Heading | 5 | Single, descriptive H1 |
| Service Schema | 4 | Service markup for search visibility |
| Image Alt Tags | 4 | Descriptive alt text on images |
| Internal Links | 4 | Linking structure across pages |

### 🤝 Trust — Will visitors feel confident?

| Check | Weight | What it looks for |
|-------|--------|------------------|
| Reviews/Testimonials | 7 | Customer reviews or testimonial sections |
| Trust Signal Stacking | 7 | 5+ combined trust signals (years, license, reviews, guarantee, certs) |
| Google Reviews | 6 | Google Reviews widget or GBP integration |
| Trust Signals | 6 | Years in business, licensed, insured, guarantees |
| Address/Service Area | 5 | Physical address or Google Maps embed |
| Footer Completeness | 5 | NAP consistency, hours, social links in footer |
| Social Links | 3 | Facebook, Google Business, Yelp, etc. |
| Privacy Policy | 3 | Required for ads and legal compliance |

### ⚙️ Technical

| Check | Weight | What it looks for |
|-------|--------|------------------|
| SSL (HTTPS) | 8 | Secure connection |
| Page Speed | 6 | Load time under 3 seconds |

### 📱 Mobile

| Check | Weight | What it looks for |
|-------|--------|------------------|
| Click-to-Call | 7 | `tel:` links that work on mobile |
| Mobile Viewport | 6 | Proper viewport meta tag |

## What You Get

Every Beacon report includes:

### 📋 Narrative Summary
A plain-English paragraph explaining what's wrong, why it matters, and what to fix first. Written for clients, not developers.

### 📊 Estimated Conversion Impact
A heuristic estimate of how many leads the site is losing to fixable issues and the potential improvement from addressing them.

### 🔧 Top 5 Priority Fixes
The five highest-impact issues ranked by (check weight × estimated conversion impact), with:
- What to fix
- Why it matters (revenue impact)
- Estimated effort to implement

### 📈 Category Scores
Visual breakdown of performance across Conversion, SEO, Trust, Technical, and Mobile.

### 🔎 Detailed Results
Every check with pass/fail/warn status, findings, recommendations, and impact estimates.

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

## Who This Is For

- **Web agencies** auditing prospects' sites before a pitch
- **Freelancers** showing clients exactly what needs fixing
- **Local business owners** who want to know if their site is actually working
- **SEO professionals** who need to check conversion signals alongside technical SEO

## Why Beacon Exists

Every agency manually checks the same things on every prospect's site: Is there a phone number above the fold? Is click-to-call working? Are there reviews? Is there schema markup? Is there a CTA?

Beacon automates that entire process in under 5 seconds and produces a report you can hand directly to a client.

## Limitations

- Designed for server-rendered sites (WordPress, Wix, Squarespace, Webflow, static HTML). Pure client-side SPAs need headless browser support (planned for v1.0).
- Conversion impact estimates are heuristics, not guarantees. They're based on industry benchmarks and are directionally correct, not precisely predictive.
- Some checks (sticky header, trust signals) rely on keyword/pattern matching. They're accurate for the vast majority of local business sites but can produce false positives/negatives on unconventional sites.

## Roadmap

- [ ] Headless browser support (Puppeteer/Playwright) for SPA auditing
- [ ] Multi-page crawl (audit service pages, contact page, about page)
- [ ] Competitor comparison mode
- [ ] Custom check plugins
- [ ] PDF report export
- [ ] CI/CD integration (GitHub Actions)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).

---

Built by [Jeremy Black](https://github.com/Highridge78) at [High Ridge Web Design](https://highridgewebdesign.com) — we fix what Beacon finds.
