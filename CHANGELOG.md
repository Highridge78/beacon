# Changelog

## [0.2.0] — 2026-05-03

### Added
- **8 new checks** bringing the total to 27 across 5 categories:
  - `sticky-cta` — Sticky header with persistent CTA detection
  - `headline` — Above-the-fold headline clarity heuristic
  - `google-reviews` — Google Reviews widget/embed detection
  - `service-area` — City/region mention analysis
  - `offers` — Discount, guarantee, and financing signal detection
  - `trust-stack` — Meta-check evaluating 10 trust signal types with composite scoring
  - `navigation` — Services listed in nav menu detection
  - `footer` — Footer NAP completeness audit
- **Narrative engine** — generates a client-facing summary paragraph explaining score context, biggest gaps, conversion impact, and the #1 recommended fix
- **Top 5 Priority Fixes** — ranked by impact × weight with action descriptions, revenue impact, and effort estimates
- **Estimated Conversion Impact** — heuristic lead loss estimate using diminishing-returns model
- **`recommendation` and `impact` fields** on all check results — every non-pass check now explains what to do and why it matters
- **4-stage CLI progress** — Fetching → Analyzing → Scoring → Generating
- **Client-ready HTML reporter** — dark theme with score ring, grade badge, narrative card, conversion impact visualization, ranked priority fixes, category progress bars, and detailed results with recommendation blocks
- **44 tests** covering all categories, scorer, narrative engine, error handling, and all check output contracts

### Changed
- Terminal reporter rewritten with narrative summary, conversion impact, Top 5 Fixes with effort estimates, and category progress bars
- All 8 original checks updated with full `recommendation` and `impact` strings on every non-pass branch
- CLI version bumped to 0.2.0

## [0.1.0] — 2026-05-01

### Added
- Initial release with 19 checks across 5 categories
- Terminal, JSON, and HTML reporters
- Weighted scoring with letter grades
- CLI with `--json`, `--html`, `-o` flags
