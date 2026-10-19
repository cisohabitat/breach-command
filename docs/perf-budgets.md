# Performance budgets

Learning tranche (0.10.0) keeps all limits and the existing game/offline warm-up.
Practice and opt-in reflection load separately; carry-forward details remain in
the shared game bundle for offline play. Typed scoped writers factor 243 repeated
message prefixes in the live reads and review, expanding to identical saved keys
and parameters. The full composed-prose comparison remains unchanged (420,163
lines). Local final measurements: 661,228 B initial script, 1,178,648 B warmed
assignment, 1,189,542 B operation script; linked/total style 88,608/221,807 B.
Throttled phone assignment/operation LCP is 1.108/1.120 s and CLS 0.001/0.020.
The practice page's own sheet is route-specific. No budget is raised and no
first-visit practice download is hidden in service-worker warm-up.

Player-flow refinement (0.9.64) groups engine messages by dotted namespace,
preserving all 364 existing keys/values, and removes four identical game-only
paper/disclosure rules from the first-paint sheet while retaining the later
game definitions. The local build, including Resume orientation and in-play
pacing controls, measures 660,505 B initial script, 1,179,646 B warmed assignment
and 1,190,540 B at operation start: 1,406 B less operation script than 0.9.63.
Linked/total style is 88,608/221,571 B, down 399 B. Throttled phone
assignment/operation LCP is 1.324/1.180 s and CLS 0.001/0.020. Every budget and
offline warm-up remains unchanged. CI adds 8 B for its build identifier.

Turn clarity (0.9.60) preserves every fixed limit. The local production build
measures 656,553 B initial script and 1,183,946 B at operation start. Linked/total CSS is 89,007/221,936 B;
removing obsolete overridden declarations makes room for the action footer
and finding links. The throttled phone check records assignment/operation
LCP of 1.204/1.216 s and CLS of 0.001/0.020. CI’s build identifier adds
8 B to script; verify its final build as well. No dependency or asset is added.

Refined d20 materials and synchronized shadow (0.9.59) preserve every limit.
The local production build measures 656,553 B initial script, 1,170,693 B
warmed assignment script and 1,181,567 B at operation start. Linked/total CSS
is 89,007/221,981 B, leaving 19 B under the style limit. Equal-specificity
selector factoring preserves the declarations and makes room for the bevel.
The isolated throttled phone run records assignment/operation LCP of
1.276/1.256 s and CLS of 0.001/0.020. There is no new dependency or asset
download. CI's build identifier adds 8 B to script; verify its final build too.

Landscape toolbar and grouped map reference (0.9.58) keep all existing limits.
The local production build measures 656,553 B initial script, 1,169,917 B
warmed assignment script and 1,180,791 B at operation start. Linked/total CSS
is 88,980/221,897 B, leaving 103 B under the total-style limit. Equal-specificity
selector factoring makes room for the layout; declarations remain unchanged.
An isolated throttled phone run records assignment/operation LCP of
1.172/1.164 s and CLS of 0.001/0.020. Run paint checks without other local
browser workloads: an earlier overlapping run measured 3.136 s on assignment,
while the isolated required check passed without changing a budget or retry.

The approved 3D d20 tray (0.9.56) keeps every existing budget. Factoring
equal-specificity selector groups in the shared/global and game sheets saves
1,315 B compared with the first tray preview, without changing declarations.
The local production build measures 656,435 B initial script, 1,169,426 B
warmed assignment script and 1,180,237 B at operation start. Linked/total CSS
is 88,726/221,606 B. Throttled phone assignment/operation LCP is 1.336/1.260 s
and CLS is 0.001/0.020. The tray adds no dependency or downloaded asset; its
twenty planes are derived locally. Verify the final runner build identifier
as well as the local measure before release.

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

Splitting the engine off the first load (0.9.12) moved the rules, reads,
review, transitions, the engine's content, the session's migration and the
Bot Commander into the one bundle the game screen and every dialog come from
(`lib/game-loader.ts`). Initial script fell from 845,158 B to 726,346 B. All
script by the time play starts fell from 1,190,300 B to 1,153,079 B: each
lazily loaded part had carried its own copy of the modules it shared with the
others (the effect list in four scripts), and one bundle has one. Budgets
lowered to 750,000 B initial and 1,170,000 B in all; `tests/first-load.test.ts`
keeps the engine off the first load.

The tables only the game plays with followed (0.9.13): attacks, procedures,
routes, topologies, set pieces and the specialists' notes left the first load
for the bundle, and the assignment screen reads its cases, stages,
difficulties and challenge codes from leaf modules. Initial script fell to
650,872 B and its budget to 675,000 B; all script by play start is
1,151,002 B.

The stylesheet split by when it is needed (0.9.15). The page linked one
189,685 B stylesheet and waited for all of it before painting; it now links
85,997 B, everything that can style the assignment screen, and the game's
own rules load with the game bundle. A new measure, `initialStyleBytes` (the
stylesheets the HTML links), has its own budget of 95,000 B. All style by the
time the page is idle rose to 213,841 B, because 262 global rules are copied
into the game's sheet to keep their place in the cascade; that budget moved
from 190,000 B to 220,000 B, on purpose, for a render-blocking sheet less than
half the size. FCP on the throttled profile went from about 1,250 ms to
1,100 ms.

The stylesheets consolidated (0.9.17): rules for the same selectors, rules
with the same declarations and blocks for the same query merged where the
cascade allows. The linked sheet is 85,053 B and the game's about 123.6 KB
as served, from 85,997 B and about 127.8 KB; the budgets are unchanged.

Signal and confidence (15 October 2026) add a shared evidence assessment,
source-comparison read and four-combination Training guide to the lazy game
bundle. The previous main's runner measured 1,169,970 B by play start, leaving
30 B under its cap. The operation script budget deliberately rises by 10,000 B
to 1,180,000 B (less than one per cent) for this feature. The assignment's initial
and idle script budgets, style budgets, paint and layout-shift limits are
unchanged. CI measures the complete production flow against those limits.

Linked evidence and specialist source reviews (15 October 2026) add a view,
localized relationship explanations and source-expertise attribution to the lazy
game bundle. Deliberately allow 5,000 B more for both the warmed assignment and
operation script budgets, to 1,175,000 B and 1,185,000 B. This is under half a
per cent. The initial script, style, timing and layout-shift budgets stay fixed;
existing portrait files are reused and fetched lazily. The full runner suite
measures the delivered production build before merge.

Scannable Captain reports (16 October 2026) add a response index, keyboard
focus styles, native disclosures and a responsive stage-fact row. The GitHub
runner measured 220,419 B of decoded style, versus 219,342 B before this work.
The total-style budget deliberately rises from 220,000 B to 222,000 B for these
controls. The linked sheet remains 87,752 B, below its unchanged 95,000 B cap.
Initial script is 654,978 B, warmed assignment script 1,174,273 B and operation
script 1,184,318 B, all under the existing limits. Throttled LCP was 1.02–1.04 s
and CLS 0.008–0.009; their limits and all script budgets remain unchanged.

Progressive learning (0.9.34, 16 October 2026) adds the stage questions,
contextual lessons, native rationale disclosures and recorded consequence
summaries to the game bundle. The runner measures 1,176,676 B for warmed
assignment script and 1,186,721 B by play start, each 2,403 B above 0.9.33.
Deliberately add 3,000 B to each warmed-script budget, to 1,178,000 B and
1,188,000 B. Initial script remains 654,978 B; linked style remains 87,752 B
and total style is 220,433 B. Throttled LCP is about 1.0 s and CLS
0.008–0.009. Initial-load, style, timing and layout-shift limits are unchanged.

Security remediation (0.9.35, 16 October 2026) updates Next.js to 16.3.8 and
adds bounded JSON/message validation, own-property checks and safe CSV
exports. The local production Turbopack build measures 656,554 B initial,
1,179,779 B warmed and 1,189,824 B by play start: 3,103 B more warmed script
than the 0.9.34 runner. Deliberately add 4,000 B to the two warmed-script
budgets, to 1,182,000 B and 1,192,000 B, for these security checks and framework
patches. This is about 0.34 per cent; initial script, style, paint and shift
limits stay fixed. Linked/total style remains 87,752/220,433 B; the local
throttled run records LCP 1.53–1.57 s and CLS 0.001–0.002. CI verifies the
complete build against these limits before release.

Nested-record validation (0.9.36) adds 1,106 B to the warmed scripts, measuring
1,180,885 B on assignment and 1,190,930 B by play start in the local production
build. Both fit the existing 1,182,000/1,192,000 B limits; no budget changes.

Bounded message rendering (0.9.38) adds 172 B to initial and warmed scripts.
The local production build measures 656,726 B initial, 1,181,057 B warmed and
1,191,102 B by play start. All existing budgets remain unchanged.

Typography hierarchy (0.9.39, 16 October 2026) changes CSS only. The local
production build measures 88,209 B linked style and 221,528 B total style,
increases of 457 B and 1,095 B over 0.9.38. Script sizes are unchanged. The
throttled phone checks record assignment/operation LCP of 1.424/1.232 s and
CLS of 0.001/0.020. All budgets remain unchanged, including the 222,000 B total
style cap; only 472 B remain under that limit, so further style changes should
consolidate existing rules before adding more.

First-operation source wording (0.9.40) adds 22 B to the warmed game bundle:
1,181,079 B on assignment and 1,191,124 B by play start in the local build.
Initial script and all style sizes are unchanged; all budgets remain fixed.

Focused opening guidance (0.9.41) measures 656,715 B initial script,
1,181,773 B warmed assignment script and 1,191,818 B by play start in the
local production build. Warmed script increases by 694 B over 0.9.40.
Linked style stays at 88,209 B; total style increases by 166 B to 221,694 B.
Throttled phone LCP is 1.152/1.192 s for assignment/operation and CLS is
0.001/0.020. All budgets remain unchanged; the operation script and total
style caps have only 182 B and 306 B of headroom respectively.

Illustrated title entry (0.9.42) lives at `/`, with the incident desk moved
to `/play`. The game does not request either poster or the title stylesheet.
The local production game measures 656,727 B initial script, 1,181,785 B
warmed assignment script and 1,191,830 B by play start; linked/total styles
remain 88,209/221,694 B. All existing game budgets remain unchanged. The
title uses the supplied original JPEGs, 361,385 B landscape and 378,778 B
portrait; `<picture>` requests one according to viewport shape. They are
separate from the script/style measures and are not precached on installation.

Title artwork refresh (0.9.43) replaces those posters with 402,043 B landscape
and 317,644 B portrait files and moves "Stop the Breach" over the picture.
Only one poster loads per viewport. The local game script/style measurements
remain identical to 0.9.42 above; all performance budgets remain unchanged.

Incident-header wordmark (0.9.44) uses a 56,558 B local transparent WebP,
encoded at three times its desktop display width from the supplied-logo
adaptation. Local initial/warmed/operation scripts are
656,887/1,181,945/1,191,990 B; linked/total styles are 88,332/221,817 B.
Throttled assignment/operation LCP is 1.176/1.224 s and CLS 0.001/0.020.
All budgets remain fixed. Operation script has only 10 B of local headroom;
the CI build identifier adds 8 B, so verify the final runner build before release.

Startup headroom and Captain reactions (0.9.47): expose only the session/browser-tool engine API
and group catalogue keys by namespace, restoring the same full keys at runtime.
All 37 catalogues / 1,401 entries compare equal before and after conversion;
the 145 unit tests, including composed prose and localization, pass.
The local production build measures 654,963 B initial script, 1,161,676 B warmed
assignment and 1,171,721 B by play start: 20,269 B less at operation start than
0.9.46. The narrower API accounts for 2,852 B of that reduction. Styles remain
88,332/221,817 B; assignment/operation LCP is 1.312/1.364 s and CLS 0.001/0.020.
The integrated reactions add 473 B to the standard startup fixture: final
initial/warmed/operation script is 655,055/1,162,149/1,172,194 B, a net saving
of 19,796 B over 0.9.46. Final throttled LCP is 1.204/1.144 s and CLS remains
0.001/0.020. The 14 new captions bring the separate recorded library to 65;
all 1,401 pre-existing catalogue entries remain unchanged. These are the
existing silent budget fixtures; enabled optional voice playback also loads
its player and individual audio clips on demand. No feature, offline warm-up
or budget is removed or relaxed. Check the final runner build identifier too.

A separate first-mission check with default voice enabled measures all script
through the visible opening Captain: 1,207,676 B on published 0.9.46 versus
1,191,288 B on the local 0.9.47 candidate (16,388 B lower). Each uses a fresh
390×844 context with workers blocked; this is a byte comparison, not a paint
timing or a replacement for the fixed budget fixture. Build identifiers differ.
