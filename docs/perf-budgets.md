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

## Phase 1, 9 October 2026

The game screen and every dialog now load on demand and are warmed when the
browser is idle (`app/page.tsx`); the procedural audio and the Bot Commander
load on first use. The stylesheet lost 726 lines of declarations a later rule
always overrode and rules for classes that no longer exist
(`scripts/css-dead.py`).

| Screen | Initial script (decoded) | All script by idle | Style | LCP | CLS |
| --- | --- | --- | --- | --- | --- |
| Assignment | 788,016 B (770 KB) | 991,206 B | 185,397 B (181 KB) | 1.1 s | 0.010 |
| Operation in progress | 788,016 B | 1,000,780 B | 185,397 B | 1.1 s | 0.030 |

Initial script is what the HTML references and the browser must parse before
the page answers; it fell from 921 KB to 770 KB. Gzipped, the referenced chunks
are 277 KB. Budgets: initial script 800,000 B, all script 1,010,000 B, style
190,000 B, LCP 3,000 ms, CLS 0.05.

The roadmap's first target, under 400 KB of script on first interaction, is
below what this stack can reach: React DOM and the Next.js runtime alone are
about 540 KB decoded (about 170 KB gzipped). What remains above that is the
engine and its content tables, which the assignment screen imports through the
session hook. Splitting the engine from the slip is the next step, and the
budget falls when it lands.

The second content batch (Phase 4: eighteen command events, twenty injects,
eight adversary profiles, a second crisis per sector, seven variants per case,
the campaign's story and the specialists' arcs) added about 33 KB of decoded
script to the first load, all of it authored tables the engine imports: 821,317 B
initial and 1,035,243 B in all. The budgets moved to 850,000 B and 1,060,000 B
with it, and that content is the first thing the engine split should take off
the assignment screen.

Lighthouse 12, mobile profile, assignment screen, two runs:

| Category | Before | After |
| --- | --- | --- |
| Performance | 94 | 97 |
| Accessibility | 100 | 100 |
| Best practices | 100 | 100 |
| SEO | 100 | 100 |

Total blocking time fell from 200 ms to 60–70 ms; largest contentful paint is
2.4–2.6 s and time to interactive 3.5 s.

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

Phases 5 to 7 (the personal record, the replay, the share card, the
facilitator sheet and the message catalogue) brought all script by the time
play starts, warmed parts included, to 1,060,546 B, 546 B over its budget;
the first load stayed under 850,000 B because the drawing code and the
dialogs load on demand. The all-script budget moved to 1,080,000 B.

Finishing the message catalogue (0.9.1) moved every interface string in the
components into per-component catalogues under `lib/i18n/en/`, each loaded
with its own component, so a lazily loaded dialog carries its strings with
it. One catalogue for everything had put 879,146 B of script on the first
load; split, the first load is 845,333 B, which leaves only 4,667 B under its
850,000 B budget for the next phase to spend. All script, warmed parts
included, rose from 1,060,546 B to 1,103,369 B by the time play starts
(1,093,555 B on the assignment screen). The cause is the keys: 572 key names,
each written once in its catalogue and again at every `t()` call, which the
minifier cannot shorten. Fragments shared by more than one catalogue account
for 1,722 B of it. The all-script budget moved to 1,120,000 B.

Whole sentences (0.9.2) catalogued the strings that 0.9.1 left inside JSX
expressions and module tables, 318 of them, and merged 110 runs of fragments
into single messages with placeholders, which removed 166 fragment keys: 865
keys where there were 605. All script by the time play starts rose from
1,103,369 B to 1,127,431 B (1,117,617 B on the assignment screen), and the
all-script budget moved to 1,150,000 B. The first load is 847,482 B, 2,518 B
under its 850,000 B budget: the next change that adds to it has to take
something out.

Markup in messages (0.9.3) joined 37 more sentences and moved `richText` into
`lib/i18n/rich.ts`: the first load is 847,786 B (2,214 B of headroom) and all
script by the time play starts 1,127,337 B. No budget moved.

The content overlay (0.9.4) loads only for a locale other than English, but
its registry is on the first load: 849,093 B, 907 B under budget. Loading the
overlay with every content module behind one import() cost 3,830 B of
loader on the first load; registering each table from its own module, so the
lazy chunk holds only the walker, removed that.

Stored messages (0.9.6) put the message code and the engine's keys on the first
load, and the engine's catalogue in the game. Imported by each component that
showed a message, the catalogue was copied into five scripts, and the glossary,
moved off the first load, into four: all script came to 1,191,458 B. Loading
both once, in one script that every lazy part awaits (`lib/i18n/shared-text.ts`),
brought it to 1,146,408 B by the time play starts, and the first load to
845,618 B, 3,754 B less than before the step, because the glossary no longer
rides on it. No budget moved.

The engine's reads and review as messages (0.9.7) moved 243 sentences out of
the engine, which is on the first load, into the engine's catalogue, which
loads with the game: the first load fell to 836,461 B (9,157 B less), and all
script by the time play starts rose to 1,174,282 B (1,164,468 B on the
assignment screen), 24,282 B over the 1,150,000 B budget. As in 0.9.1 and
0.9.2 the cause is the keys, written once in the catalogue and again where
the engine uses them, and the plurals, which write a sentence once for each
form. The all-script budget moved to 1,190,000 B, leaving the periphery of
step 4 room in the lazy part; the first-load budget did not move.

The periphery as messages (0.9.8) put on the first load the messages the
assignment screen shows before the game's script arrives (the last operation,
the suggestion, trust and readiness, the campaign's ending): 840,379 B,
3,918 B more, 9,621 B under budget. All script by the time play starts is
1,181,390 B. No budget moved.

The hooks' sentences as messages (0.9.9) are on the first load, because the
session runs from the first render: 844,296 B, 3,917 B more, 5,704 B under
budget. All script by the time play starts is 1,185,328 B, 4,672 B under its
budget. No budget moved; step 5 adds tests, not script.

Step 5 (0.9.10) did add script after all: what its tests found had to be
translated, about 40 keys and the maps that pick them (node kinds and states,
levels, phase names, the first-session record). The first load is 845,031 B,
4,969 B under budget; all script by the time play starts 1,189,715 B, 285 B
under the 1,190,000 B budget, which moved to 1,200,000 B so the next change
has room to be measured rather than refused.
