# Content drafts

`pnpm new-scenario <slug>` writes a draft here: one entry for every table a new
sector needs, each word a TODO. `pnpm validate:content` lists the TODOs left,
and the drafts test fails while any remain, so an unfinished draft cannot be
merged. When it is complete, wire each section into the table its header
names, following `docs/CONTENT.md`, and delete the draft.
