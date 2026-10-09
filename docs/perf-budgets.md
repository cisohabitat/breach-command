# Performance budgets

The performance bar in `docs/ROADMAP.md` is Lighthouse 95+ on every
category on a mid-range phone, and first interaction under two seconds on
4G. These are the instruments and the numbers they started from.

## Enforced in CI: `pnpm test:performance`

`tests/e2e/performance.spec.ts` loads the production build at 390 × 844 with
a phone's touch profile, 4× CPU throttling and a 1.6 Mbps, 150 ms network,
and measures the decoded script and style it ships, first and largest
contentful paint and cumulative layout shift. It fails when any figure
exceeds `tests/e2e/performance-budgets.json`. The budgets start at the
numbers below with a little headroom, so the build can get heavier only by
changing the budget file on purpose; Phase 1 lowers them.

Baseline, commit after `231dd45`, 9 October 2026:

| Screen | Script (decoded) | Style (decoded) | FCP | LCP | CLS |
| --- | --- | --- | --- | --- | --- |
| Assignment | 942,898 B (921 KB) | 198,143 B (193 KB) | 1.1–1.3 s | 1.1–1.3 s | 0.010 |
| Operation in progress | 942,898 B | 198,143 B | 1.1 s | 1.1 s | 0.030 |

Budgets: script 950,000 B, style 200,000 B, LCP 3,000 ms, CLS 0.05. The byte budgets are exact and the same on any machine; the paint budget has room for a shared CI runner, which is slower than a laptop under the same throttling, so it guards against a large regression rather than measuring the roadmap's bar.

The same script is shipped on both screens: nothing is split by route or by
dialog yet. Phase 1's target is under 400 KB of script on first
interaction, by loading the review, the field guide, settings and the Bot
Commander when they are first opened.

## Measured by hand: Lighthouse

Lighthouse runs without being a dependency:

```bash
pnpm build && pnpm start -p 3100 &
CHROME_PATH=/path/to/chromium pnpm dlx lighthouse@12 http://localhost:3100/ \
  --chrome-flags="--headless=new" \
  --only-categories=performance,accessibility,best-practices,seo
```

Baseline on the assignment screen, Lighthouse 12 mobile profile:

| Category | Score |
| --- | --- |
| Performance | 94 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |

| Metric | Value |
| --- | --- |
| First contentful paint | 1.1 s |
| Largest contentful paint | 2.6 s |
| Total blocking time | 200 ms |
| Cumulative layout shift | 0 |
| Speed index | 1.1 s |
| Time to interactive | 3.7 s |

Performance is the one category below the bar, held back by largest
contentful paint and time to interactive: both are the cost of hydrating
921 KB of script.

Lighthouse needs a fresh page, so it measures the assignment screen only;
the Playwright budget covers an operation in progress by seeding a saved
session first.
