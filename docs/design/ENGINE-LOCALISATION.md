# Localising the engine's prose

Status: steps 1 to 3 built (0.9.4 to 0.9.6, 10 October 2026), steps 4 and 5 built (0.9.7 to 0.9.10). The plan is complete; a first locale needs a translator and a reviewer. The interface around it is
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

3. **The overlay replaces the tables' words in place, on the client.**
   *Amended 10 October 2026, when it was built (0.9.4).* The note first said
   components would look content up by id where it renders. Hundreds of
   places reach content through variables and through what the engine
   returns, so instead each content module registers its tables
   (`registerContent()`, `lib/i18n/content/registry.ts`), and for a locale
   other than English `hooks/use-messages.ts` loads `lib/i18n/content/overlay.ts`
   with `import()` after the page has hydrated in English, replaces every
   leaf's words, and re-renders every component that reads messages. A table
   whose module loads later is overlaid as it registers. The rules then read
   tables whose words have changed, so what keeps them language-blind is a
   test, not the structure: `tests/content-overlay.test.ts` runs the balance
   check with the pseudo-locale applied and requires the same figures and the
   same fingerprint of every seeded game. It found one leak when it was first
   run: the Bot Commander scores response options by their `disruption`,
   `confidence` and `residual` words, so those level fields are structural and
   are translated where they are shown.

4. **The engine returns messages, not sentences.** *Built for what it stores
   in 0.9.6.* A message (`lib/i18n/message.ts`) is a catalogue key with its
   parameters, or a reference to content by the path the overlay uses
   (`{ ref: "attacks.phish.evidence" }`), which may carry parameters of its
   own (the decision wording's `{owners}`) and a `form` for its English casing
   inside a sentence. A parameter is a number, a string or another message;
   `say(message, locale)` puts it into words, and `lib/engine/words.ts` builds
   the references so the engine names what it means. The keys live in
   `lib/i18n/en/engine.ts`. *Amended:* it is not registered by the game
   screen's chunk but loaded once, with the glossary, by
   `lib/i18n/shared-text.ts`, which every lazily loaded part of the page awaits
   (`withText` in `app/page.tsx`); imported by each component that showed a
   message, it was copied into five scripts. A reference shows the content as
   it is now, so a clue edited after a save reads edited in that save; that is
   what a translation needs, and a change from the copies saves held before.

5. **Saves store messages.** *Built in 0.9.6.* The stored fields listed above
   are `Message`s, `nextModifierSource` is a list of carried sources
   (`nextModifierSources`, each with its share, which `carriedLabel` words),
   a turn's inject keeps its id with its reason and, where the card's outcome
   depended on the game, what it did, and the variant's words are references to
   its template. `SESSION_VERSION` is 19. The migration wraps each older
   sentence as `{ key: "legacy.text", params: { text } }`, which reads as the
   player read it, and reads an older joined carried-source string back into its
   sources, so an old roll breakdown reads as it did. A whole operation saved
   by version 18 (`tests/fixtures/full/full-v18.json`) proves both directions
   (`tests/full-save.test.ts`): replayed from its seed, today's engine stores
   messages that read exactly as version 18's sentences, all 110 of them, and
   the old save migrates and reads as it did. The rules read structure where
   they read words before: the Crisis re-route by the message's key, the
   carried evidence decision by its source's key. Because TypeScript lets an
   object into a template literal without a word, `tests/message-types.test.ts`
   reads every file with the type checker and fails where a message becomes a
   string except through `say()`; the text comparison found the review saying
   "[object Object]" before that test existed.

6. **Rendering reads structure, not words.** *Built in 0.9.5.* The effect
   lines are data, an `Effect` (`lib/engine/rules.ts`: a meter's change with
   its label, amount and whether it is better; unchanged; a roll's change with
   its cap; the adversary's pace; a note), which `EffectList` lays out and the
   catalogue words; the patterns are gone, and `effectText` still says an
   effect in English for the sentences that quote one. *Amended:* glossary
   terms are not marked in the content, as first planned, because content
   reaches many places that are not glossed and would show the brackets.
   Instead the terms are a content table of their own (`glossaryTerms`, the
   English term as key, the shown words as value), which a translation
   overlays, and `glossaryParts` matches the words the locale gives them, at
   any letter boundary rather than ASCII ones. `tests/content-overlay.test.ts`
   checks that every term marked in an English passage is still marked in its
   pseudo-locale translation. The plural "s" a term may take is English's; a
   locale with other plurals lists its forms in its own terms. The share card
   takes its strings from `translate()` like any component.

7. **What stays English:** the diagnostic a player copies into a bug report
   (marked `i18n: maintainer English`), the ledger's CSV column names (a file
   for a spreadsheet, read by whoever analyses it), telemetry event names,
   ATT&CK technique names, which MITRE publishes in English, the
   `effectText` English the maintainers' tools quote, and the name and
   description of the incident-state tool for browser agents
   (`hooks/use-incident-state-tool.ts`), which an agent reads as it reads an
   API's; what that tool returns is the player's, in the player's locale.

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
   *Amended 10 October 2026, when its first half was built (0.9.7).* It is two
   steps. **4a, the engine:** every read, standing, prompt, decision option,
   loss reason, score rule, ledger verdict and counterfactual in `reads.ts`,
   `review.ts` and `rules.ts` returns messages (the engine's catalogue went
   from 66 keys to 334, plurals as plural messages rather than an "s" passed
   in); `effectText` stays English for
   maintainers. What proves English unchanged is `scripts/prose-check.ts`
   (`pnpm prose:check`, run by `tests/prose.test.ts`): it plays 120 seeded
   operations and 12 campaigns, calls every text function the engine exports
   at every state, says the result in English and compares one hash of all
   443,880 lines with the record. The only change it recorded was a
   structural `id` on each score row. `tests/message-types.test.ts` gained
   `join()` and JSX (a child, or an HTML element's attribute), because
   TypeScript accepts a message as a React child and the browser suite found
   two such crashes the 56 screens had not reached. **4b, the periphery:**
   the composed prose outside the engine's three files, which 4a leaves
   saying English through `say()`: the campaign's sentences (`campaign.ts`,
   on the first load, so its keys go in a catalogue the first load carries),
   `phase9.ts`'s composed lines, the Bot Commander's reasons
   (`lib/game-bot.ts`), the session hook's announcements, the share card's
   caller (which says it in the player's locale), `describeWhen`, and
   `recommendNext`, whose title and reason `last-operation` stores, so a
   stored English recommendation needs a legacy path. It is done when
   `grep "say(" lib/engine lib/game-bot.ts` finds nothing.
   *Built in 0.9.8*, with what it turned up. Messages the assignment screen
   shows before the game loads (trust and readiness, the campaign's ending, the
   last operation and the review's suggestion, `describeWhen`, the five loss
   titles the suggestion quotes) are in the base catalogue (`lib/i18n/en.ts`),
   as the variant's words were; the review's own (what an operation changed,
   the route's reason, the specialist's note, the Bot Commander's reasons) are
   in the engine's. The campaign's ranks, capabilities, acts, director's
   briefings, route developments and endings, and the specialists' reactions
   and arcs, were tables inside functions and are now registered content.
   `last-operation` stores messages; a record of English strings reads back
   as legacy messages, and a test reads both. The share card takes the
   player's locale from its component, and an end-to-end test requires every
   line drawn on it in the pseudo-locale to be the pseudo-locale's; another
   reads the last operation in it, where the date, which `Intl` writes, is
   accented too. The incident-state tool for browser agents says what the
   player sees, so in the player's locale. The sentences the hooks compose
   themselves (announcements, the Bot Commander's status, the storage, backup
   and challenge notices, the briefing's answers) followed in 0.9.9: 57
   messages in `lib/i18n/en/session.ts`, which the hooks register, since the
   session runs from the first render. The hooks keep them as messages in
   state and the components say them, because a string put in state on the
   first render is English before the locale is read. `tests/i18n.test.ts`
   reads `hooks/` for written-in English as it reads the components.
5. **A ratchet like the components'.** `tests/i18n.test.ts` gains a pass over
   `lib/` that allows prose only in content tables, and the pseudo-locale
   sweep gains a check that no seeded screen in `en-XA` shows a run of four
   unaccented letters outside codes and numbers.
   *Built in 0.9.10, amended.* The pass over `lib/` reads every string and
   template literal with the components' rule and allows it only as a leaf of
   `lib/i18n/content/en.json` (a template only if, evaluated, it is one), a
   structural level, a `ref()` path or a statement marked maintainer English.
   The sweep (`tests/e2e/locale.spec.ts`) takes the bracketed pseudo-locale
   text out of the assignment, the three workspaces, the ending and the review
   and requires no four-letter word to be left, except the specialists'
   callsigns and the build's id; counting unaccented runs instead would have
   failed on English the pseudo-locale had translated ("withdraw" keeps "thdr").
   The two found what the earlier steps had missed, mostly single lower-case
   words the component rule passes ("worse", "entries", a node's state): the
   walker skipped any object whose key was a structural field's name, so the
   "disruption" objective was never extracted, and "C2 & exfiltration" did not
   read as words to it; the response options' levels and the reads'
   confidence codes were shown as their English values (now `level()`); the
   map's node kinds and states, the review's phase names, the adversary's pace,
   the log's count and the dialogs' Close were English in components; the
   first-session record in Settings was English in `lib/telemetry.ts`; and an
   unused copy of the response options sat in `lib/game.ts`.

## Costs to expect

- **Bundle.** Descriptor keys replace sentences in the engine, which is about
  even; the engine catalogue (about 380 messages) adds roughly 25 KB to the
  game screen's chunk, which is lazy. *Measured at 4a (0.9.7):* the first load
  fell 9,157 B, to 836,461 B, and all script by the time play starts rose
  27,874 B, to 1,174,282 B; the all-script budget moved to 1,190,000 B. *At
  4b (0.9.8):* the first load rose 3,918 B, to 840,379 B (9,621 B of
  headroom), for the messages the assignment screen shows; all script
  1,181,390 B. The first load carries none of it: it
  has 2,214 B of headroom under 850,000 B, so nothing here may land on it.
- **Tests.** Engine tests that assert sentences assert descriptors instead,
  or render them with `translate("en", …)`.
- **Content authoring.** A new string in a table needs nothing new; a new
  composed sentence needs a key. `docs/CONTENT.md` gains a paragraph.
