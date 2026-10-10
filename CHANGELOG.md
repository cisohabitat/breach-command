# Changelog

Kept by hand, newest first. Each release's version is in `package.json`, shown
in the footer and in Settings' diagnostics, and tagged `v<version>` by the
release workflow once Verify passes on `main`. See `docs/RELEASING.md`.

## 0.9.6, 10 October 2026

- **Saves in any language.** What the game writes into a saved operation
  (findings, reports, decisions, comparisons, injects) is stored as messages
  rather than English, so a save reads in whatever language the game is in.
  Older saves keep their sentences exactly as they were. Saved games move to
  version 19.
- **Faster first load.** The glossary and the game's own sentences now load
  once, with the game, instead of with the first page and in copies.

## 0.9.5, 10 October 2026

- **Effects and glossary in any language.** The lines that say what a choice
  costs are laid out from data rather than read back from English, and the
  glossary finds its terms in translated text. English is unchanged.

## 0.9.4, 10 October 2026

- **Content ready for translation.** The words of every case, attack, clue,
  procedure, event and option (1,780 strings) are extracted for a translator
  (`pnpm extract:content`), and a locale replaces them on the device. The
  pseudo-locale now lengthens them too, and every layout holds.
- **Fixed:** in any language but English the Bot Commander would have chosen
  response options differently, because it scored them by their words. A
  test now plays 1,800 operations and 300 campaigns in the pseudo-locale and
  requires the same games.

## 0.9.3, 10 October 2026

- **Markup in messages.** A sentence with a bold figure or a link inside it
  is one message, so a translator can move the figure; 37 sentences joined.
  The component layer is fully catalogued, and the text on every seeded
  screen is unchanged.
- **The plan for the engine's prose**, `docs/design/ENGINE-LOCALISATION.md`:
  about 2,700 strings, how a locale would cover them, what changes in the
  saved game, and the order of work.

## 0.9.2, 10 October 2026

- **Whole sentences.** The interface strings that were still written inside
  expressions (318, from ternaries, templates and tables of labels) are in the
  catalogue, and 110 sentences that were assembled from fragments are now one
  message each with placeholders and plurals, so a translator can reorder
  them. The text on every seeded screen is unchanged; glyphs may sit a
  fraction of a pixel differently where the browser now kerns across what were
  separate text nodes. The all-script budget moved to 1,150,000 B.

## 0.9.1, 10 October 2026

- **Message catalogue.** Every piece of interface text written in the
  components (572 strings) now comes from the catalogue, one file per
  component in `lib/i18n/en/` that loads with its component, so the first
  load stays under its budget. English is unchanged to the pixel on all 56
  seeded screens, and the pseudo-locale (`?locale=en-XA`) now reaches every
  dialog. Strings built inside expressions and the engine's prose are still
  English-only. The all-script budget moved to 1,120,000 B
  (`docs/perf-budgets.md`).

## 0.9.0, 9 October 2026

The roadmap's eight phases (`docs/ROADMAP.md`), the parts an agent can do.
What needs people (playtests, a designer, a practitioner, a translator,
screen-reader users) is recorded there as open.

- **Instruments.** Visual baselines recorded on a runner, WebKit and Firefox
  in CI, performance budgets on a throttled phone, a first-session record on
  the device, and the playtest and design-review protocols.
- **Foundation.** Dialogs, the game screen and sound load on demand; a fault
  in one part of the game stays in that part with a copyable diagnostic; a
  saved operation from every session version since 10 is proven to migrate.
- **First session.** The review suggests what to play next and the landing
  page remembers it; fixes from two stand-in newcomer playtests.
- **Presentation.** The art-direction record, two weights in the type system
  held by a test, one motion vocabulary, one sound per event class.
- **Content.** Eighteen command events, twenty injects, eight adversary
  profiles, two crises per sector, seven variants per case, the campaign's
  story and the specialists' arcs, and a campaign memory that keeps an act
  from repeating its beats.
- **Replayability.** Weekly Operation, a five-rung mastery ladder per case,
  the result as an image, a replay by the Bot Commander, a personal record
  with its CSV, and Expert's own ending.
- **Learning fidelity.** Every technique mapped to MITRE ATT&CK, a printed
  facilitator sheet, the educator pack at `/educators`, and a glossary test.
- **Accessibility and localisation.** A WCAG 2.2 AA checklist with tests for
  target size, focus not obscured and the hidden objective; logical CSS
  properties; a message catalogue with a pseudo-locale.
- **Release engineering.** This changelog and the version, the service
  worker's cache named for each deploy, balance and repetition checked in
  CI, a scenario scaffold, Copy diagnostics in Settings, and the release and
  rollback procedure.

Saves move to session version 18 and challenge codes to `BC6`. An older code
is refused and named as outdated; an older save migrates.
