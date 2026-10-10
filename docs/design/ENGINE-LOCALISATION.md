# Localising the engine's prose

Status: design, 10 October 2026. Not started. The interface around it is
catalogued (`lib/i18n/`, 0.9.1 to 0.9.3); this is the plan for the rest, so
that the work can start when a first locale has a translator and a reviewer
(Phase 7, `docs/ROADMAP.md`).

## What there is

About 2,700 strings that read as words, some 23,000 words, in `lib/`
(counted with the same rule `tests/i18n.test.ts` applies to components):

| Where | Literals | Templates | What it is |
| --- | ---: | ---: | --- |
| `engine/content.ts` | 878 | 0 | Cases, attacks, procedures, clues, decision options |
| `game.ts` | 595 | 0 | Scenario text, glossary, the field guide's vocabulary |
| `phase9.ts`, `phase8.ts` | 564 | 4 | Set pieces, specialists, variants, campaign story |
| `command-systems.ts` | 119 | 0 | Command events, injects, adversary profiles |
| `campaign.ts`, `educators.ts` | 69 | 19 | Ranks, capabilities, the educator pack |
| `engine/reads.ts`, `review.ts`, `transitions.ts`, `rules.ts` | 241 | 137 | Sentences the engine composes as play happens |

They are two different problems.

**Authored content** (about 2,250 strings) sits in tables keyed by a stable
id: an attack's `title`, `evidence` and `detection`, a procedure's `title`, a
command event's options. Nothing in the rules reads these words; they are
shown.

**Composed prose** (about 380 strings, half of them templates) is written by
the engine from content and numbers: a turn's narrative ("{evidence} Found by
{procedure} while map focus was on {node}."), the reads on the board, the
review's verdicts, the roll's named parts, the reason a modifier is carried.
Some of it is **stored in the saved game**: `Turn.narrative`,
`Turn.parts[].label`, `DecisionRecord.title`, `effect`, `counterfactual`,
`adaptationReason` and `rationale`, `MapActionRecord.effect`,
`commandHistory[].effect`, `setPieceHistory[].effect`, `Inject.reason` and
`nextModifierSource`. A save made in one language would show that language
forever.

Three parts of the interface read English back:

- `components/game/effect-list.tsx` parses the effect lines with patterns
  (`/^(.+?) ([+−]\d+) (better|worse)$/`, "unchanged", "adversary pace
  faster", "next roll +2"). In any other locale the lines would render as
  plain text, without the figure in bold.
- `Glossed` (`glossaryParts` in `lib/advanced-game.ts`) finds glossary terms
  by matching English words inside prose.
- The share card (`lib/share-image.ts`) draws text into a canvas, outside
  React.

## Decisions

1. **English stays in code as the source of truth.** The tables are
   authored, reviewed and balance-checked in TypeScript, and
   `pnpm validate:content` and `content-drafts/` work on them. Moving 2,250
   strings into key-value files would make every content change two edits in
   two files, for no gain in English.

2. **A locale is an overlay keyed by table, id and field.** `lib/i18n/content/<locale>.json`
   maps `attacks.phishing.title` to the translation. A missing entry falls back
   to English, field by field. `scripts/extract-content.ts` walks the tables
   and writes `lib/i18n/content/en.json`, the file a translator receives; a
   test fails when an overlay names a table, id or field the source no longer
   has, or drops a placeholder.

3. **Components localise content where it renders, by id.** A hook,
   `useContent()`, returns `text("attacks", id, "title")`. The engine keeps
   reading its English tables for rules, so no rule can change with the
   language, and the balance check needs no locale. The overlay for the
   active locale loads with a dynamic `import()` when the locale is not
   English, so English ships no extra bytes.

4. **The engine returns messages, not sentences.** A composed sentence
   becomes a descriptor, `{ key: "turn.found", params: { evidence: { ref:
   ["attacks", "phishing", "evidence"] }, procedure: { ref: [...] }, node:
   ... } }`. A param is a number, a string, or a reference into content,
   resolved through the overlay when it renders. The keys live in a new
   catalogue, `lib/i18n/en/engine.ts`, registered by the game screen's chunk.

5. **Saves store descriptors.** The stored fields listed above change type
   from `string` to `Message`, with `SESSION_VERSION` 19. The migration wraps
   each old string as `{ key: "legacy.text", params: { text } }`, which
   renders the old English as it was, so a save made before 19 still reads
   exactly as it did and every later turn localises. The saved game from
   18 in `tests/fixtures/saves/session-v18.json` proves it, as the earlier
   versions' fixtures do for theirs.

6. **Rendering reads structure, not words.** The effect lines become data,
   `{ meter, change, direction }`, which `EffectList` lays out and the
   catalogue words; the patterns go. Glossary terms are marked where content
   is authored (`[[lateral movement]]` in the source, the translator places the
   brackets in the overlay), so `Glossed` finds them in any language. The
   share card takes its strings from `translate()` like any component.

7. **What stays English:** the diagnostic a player copies into a bug report
   (marked `i18n: maintainer English`), the ledger's CSV column names (a file
   for a spreadsheet, read by whoever analyses it), telemetry event names, and
   ATT&CK technique names, which MITRE publishes in English.

## Order of work

Each step ships on its own, with English unchanged on all 56 seeded screens
(text compared character for character, as for 0.9.2) and the balance check
exact.

1. **Overlay and extraction** (one session). `extract-content.ts`, the
   overlay loader, `useContent()`, the overlay test, and a pseudo overlay
   generated from `en.json` for `en-XA`. Components showing content switch to
   `text()`.
2. **Effect lines and glossary as structure** (one session). Removes the two
   places that read English back.
3. **Stored prose as messages** (two sessions). The descriptor type, the
   engine catalogue, the stored fields, `SESSION_VERSION` 19 and its
   migration fixture.
4. **Reads and the review** (two sessions). The composed prose that is not
   stored: `reads.ts`, `review.ts`, `rules.ts`.
5. **A ratchet like the components'.** `tests/i18n.test.ts` gains a pass over
   `lib/` that allows prose only in content tables, and the pseudo-locale
   sweep gains a check that no seeded screen in `en-XA` shows a run of four
   unaccented letters outside codes and numbers.

## Costs to expect

- **Bundle.** Descriptor keys replace sentences in the engine, which is about
  even; the engine catalogue (about 380 messages) adds roughly 25 KB to the
  game screen's chunk, which is lazy. The first load carries none of it: it
  has 2,214 B of headroom under 850,000 B, so nothing here may land on it.
- **Tests.** Engine tests that assert sentences assert descriptors instead,
  or render them with `translate("en", …)`.
- **Content authoring.** A new string in a table needs nothing new; a new
  composed sentence needs a key. `docs/CONTENT.md` gains a paragraph.
