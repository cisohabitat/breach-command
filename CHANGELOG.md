# Changelog

Kept by hand, newest first. Each release's version is in `package.json`, shown
in the footer and in Settings' diagnostics, and tagged `v<version>` by the
release workflow once Verify passes on `main`. See `docs/RELEASING.md`.

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
