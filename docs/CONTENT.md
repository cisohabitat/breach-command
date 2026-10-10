# Adding a scenario

1. `pnpm new-scenario <slug>` writes `content-drafts/<slug>.ts`: one entry for
   every table a sector needs, shaped like the first scenario's, with every
   word a TODO. `pnpm validate:content` (under two seconds) lists the TODOs
   left; the drafts test fails while any remain, so an unfinished draft
   cannot be merged.
2. Write it against AGENTS.md's content rules. The draft only checks that
   no TODO is left; these are what `pnpm test` checks once it is wired in:
   - four techniques only this sector can draw, one at each stage, each with
     its ATT&CK ids (`exclusiveMitre`), since every stage draws from a pool
     of the same size;
   - at each stage, four techniques across at least three routes, sharing at
     most one with any other scenario at that stage;
   - every technique's detect sources ones that could really see it: the
     shared procedures or this sector's own action, never another sector's;
   - a sector action of its own;
   - a sector system whose mechanic numbers differ from every other
     sector's (the draft starts with the first sector's, which the tests
     reject as a copy);
   - a topology of its own shape;
   - two crises whose narrow measure costs something;
   - seven variants;
   - a response profile whose cheap options (`accelerate`, `patch`) are
     named for this sector, with labels that agree with their score;
   - decision terms naming who the sector notifies.
3. Wire each section into the table its draft header names, appending at the
   end of each table. Import the scenario's icon from `lucide-react` in
   `lib/scenarios.ts`, add the exclusive techniques' ids to `attackMitre`,
   run `pnpm extract:content`, then delete the draft. `tests/drafts.test.ts`
   checks the scaffold still covers every per-scenario table.
4. A new sector changes the campaign's length, `nextCase`, the acts'
   thresholds and the endings, and every seeded draw: increment
   `CHALLENGE_VERSION`, re-record the composed prose
   (`node scripts/prose-check.ts --record`), run `pnpm test`,
   `pnpm balance` at 3,000 and `pnpm repetition`, re-record the smoke
   figures, and record the change in AGENTS.md and the changelog. A longer
   campaign draws on the same command events and injects, so expect
   repetition to rise; add events and injects with the sector if it does.
5. A practitioner reads the new content before it ships
   (`docs/reviews/PRACTITIONER-REVIEW-BRIEF.md`).

## The dry run

On 10 October 2026 a rail-signalling sector was scaffolded, written, wired
into every table and taken to a green `pnpm test` (113 tests) in about
twelve minutes of an agent's time, to measure this procedure rather than to
ship the sector (it has had no practitioner review). The draft passed
`pnpm validate:content` at once; wiring it in failed four checks, each now
in step 2 or fixed in the scaffold: the stage pools fell out of step (the
scaffold now asks for one technique a stage), two stages shared two
techniques with another sector, the sector system copied the first
sector's mechanics, and the drafts test took the eleven shared procedures
for a per-scenario table once there were eleven scenarios. Balance at 3,000
per difficulty stayed within noise of ten sectors (76.0, 67.7 and 49.7%
won, from 75.8, 67.4 and 49.3%); repetition rose (over 3,000 campaigns, a
command event repeated within an act in 9.1% of them, from 7.5; an inject
in 16.9%, from 13.0; a sector crisis in 61.0%, from 57.9).

## Translation

The words of every content table are extracted, by path, into
`lib/i18n/content/en.json`, the file a translator works from. After changing
any content, run `pnpm extract:content`; `pnpm test` fails until the file
matches the tables. A field the rules compare (an id, a vector, a level the
Bot Commander scores) must not be translated: add it to `structural` in
`lib/i18n/content/walk.ts`.
