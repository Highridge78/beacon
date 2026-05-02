# Contributing to Beacon

Thanks for wanting to contribute! Here's how.

## Adding a New Check

1. Create a new file in `src/checks/` (e.g., `src/checks/yourcheck.ts`)
2. Implement the `Check` interface:

```typescript
import type { Check, AuditContext, CheckResult } from "../types.js";

export const yourCheck: Check = {
  id: "your-check-id",
  name: "Human-Readable Name",
  category: "conversion", // conversion | seo | trust | technical | mobile
  weight: 5, // 1-10, higher = more important for lead gen

  run(ctx: AuditContext): CheckResult {
    // ctx.html — raw HTML
    // ctx.finalUrl — the URL after redirects
    // ctx.isHttps — boolean
    // ctx.loadTime — ms

    return {
      id: this.id,
      name: this.name,
      category: this.category,
      weight: this.weight,
      status: "pass", // pass | fail | warn | skip
      message: "What you found",
      details: "Recommendation (shown on fail/warn)",
    };
  },
};
```

3. Register it in `src/checks/index.ts`
4. Add a test in `tests/checks/`

## Development

```bash
# Install dependencies
npm install

# Run against a URL
npx tsx src/index.ts https://example.com

# Run tests
npm test

# Type check
npm run lint
```

## Guidelines

- Every check should have actionable advice in the `details` field
- Weight checks based on impact on local business lead generation
- Include specific data/stats in recommendations when possible
- Keep checks fast — no external API calls in checks

## Submitting Changes

1. Fork the repo
2. Create a feature branch (`git checkout -b add-check-name`)
3. Commit with clear messages
4. Open a PR with a description of what the check does and why it matters
