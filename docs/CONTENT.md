# Adding a scenario

1. `pnpm new-scenario <slug>` writes `content-drafts/<slug>.ts`: one entry for
   every table a sector needs, shaped like the first scenario's, with every
   word a TODO. `pnpm validate:content` (under two seconds) lists the TODOs
   left; the drafts test fails while any remain, so an unfinished draft
   cannot be merged.
2. Write it against AGENTS.md's content rules: three or more techniques only
   this sector can draw, four techniques across three routes a stage, every
   technique's detect sources ones that could really see it, a sector action
   of its own, two crises whose narrow measure costs something, seven
   variants, a response profile whose cheap option is a different call here,
   decision terms naming who the sector notifies, and an ATT&CK mapping for
   each new technique (`attackMitre`).
3. Wire each section into the table its draft header names, appending at the
   end of each table, then delete the draft. `tests/drafts.test.ts` checks
   the scaffold still covers every per-scenario table.
4. A new sector changes the campaign's length, `nextCase`, the acts'
   thresholds and the endings, and every seeded draw: increment
   `CHALLENGE_VERSION`, run `pnpm test`, `pnpm balance` at 3,000 and
   `pnpm repetition`, re-record the smoke figures, and record the change in
   AGENTS.md and the changelog.
5. A practitioner reads the new content before it ships
   (`docs/reviews/PRACTITIONER-REVIEW-BRIEF.md`).

## Translation

The words of every content table are extracted, by path, into
`lib/i18n/content/en.json`, the file a translator works from. After changing
any content, run `pnpm extract:content`; `pnpm test` fails until the file
matches the tables. A field the rules compare (an id, a vector, a level the
Bot Commander scores) must not be translated: add it to `structural` in
`lib/i18n/content/walk.ts`.
