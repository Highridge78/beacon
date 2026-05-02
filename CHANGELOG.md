# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-05-02

### Added
- Initial release of Beacon
- 19 checks across 5 categories: Conversion, SEO, Trust, Technical, Mobile
- Terminal output with color-coded score cards and category bars
- JSON output (`--json`) for integrations and pipelines
- HTML report generation (`--html`) with dark theme and shareable layout
- File output (`-o filename`)
- Weighted scoring system (0–100) with letter grades (A–F)
- **Conversion checks:** phone number visibility, click-to-call links, CTA above the fold, contact form
- **SEO checks:** meta title quality, meta description, H1 tag, LocalBusiness schema, Service schema, image alt tags, internal linking
- **Trust checks:** reviews/testimonials, trust signals (experience, guarantees), address/service area, social links, privacy policy
- **Technical checks:** SSL certificate, page load time
- **Mobile checks:** click-to-call, viewport meta tag
- Graceful error handling for unreachable sites, timeouts, and malformed URLs
