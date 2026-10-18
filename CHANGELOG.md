# Changelog

Kept by hand, newest first. Each release's version is in `package.json`, shown
in the footer and in Settings' diagnostics, and tagged `v<version>` by the
release workflow once Verify passes on `main`. See `docs/RELEASING.md`.

## 0.9.53, 18 October 2026

- Distinguish confirmed, currently investigated and unknown attack-chain stages
  with labels and markers derived only from confirmed findings.
- Show collection sources and separate signal/confidence ratings directly in
  evidence comparisons, preserving tested relationship labels and patterns.
- Bring the review's compact milestone timeline forward, pairing findings with
  their recorded responses and effects. Keep the full check log available and
  avoid opening nested logs when using the section index. Keep destination
  headings below the sticky index, including wrapped phone rows.

## 0.9.52, 17 October 2026

- Replace the pulsing dice box with a faceted d20 and a short tumble, keeping
  the number upright and preserving the half-second final-result pause.
- Fade between the prepared dice and report dialogs without zoom; preserve
  report focus and static reduced-motion behavior.
- Add pressed procedure feedback and a brief neutral outline on the procedure
  just used when returning from its report.
- Add twelve small source-specific finding illustrations in bone and charcoal.
- Isolate the keyboard playthrough's seeded dice from accessibility-audit UUID
  generation, preserving deterministic winning and losing coverage.

## 0.9.51, 17 October 2026

- Keep the final dice number visible and still for half a second before
  opening the Captain's report, so the result has time to register.
- Preserve instant Fast Resolution turns and existing sound/mute behavior;
  resolve each turn once and keep actions locked through the reveal.

## 0.9.50, 17 October 2026

- Add a soft decelerating dice rattle and landing click to visible procedure
  rolls. Respect Sound, tab visibility, Fast Resolution and Bot Commander;
  cancel stale lazy playback and keep audio failures outside the turn lock.
- Read current sound/haptic preferences when the result resolves, so muting
  during a roll also silences its result cue.
- Unlock the shared audio context during the user gesture before lazy sound
  code loads, and verify native browser audio through a virtual CI output.

## 0.9.49, 17 October 2026

- Refine investigation action priority, procedure title/description contrast,
  grouped status labels and section spacing while preserving source order,
  guidance limits, costs and keyboard behavior.
- Align field-kit miniature sizes and report evidence proportions; use the
  shared decorative-image loading/failure handling for specialist portraits.
- Lead Captain reports with a clearer confirmed-finding heading before the
  response index. Preserve every response, exact effect and supporting disclosure.

## 0.9.48, 17 October 2026

- Add an approved tall-phone title poster that keeps the complete Breach Command
  logo visible while filling the screen. Preserve existing desktop and iPad
  artwork, one poster request, safe-area controls and saved-game entry behavior.

## 0.9.47, 17 October 2026

- Reduce startup JavaScript by grouping repeated translation-key namespaces
  and narrowing the lazy engine API. Preserve every existing message identifier,
  caption and plural form, with unchanged offline warm-up and performance budgets.
- Add 14 Captain recordings for evidence-choice acknowledgements and published
  response residual risk, bringing the library to 65. Keep current pacing,
  captions, replay, mute, silent Bot Commander practice and historical-resume
  protection; live reactions never disclose hidden assessments or answers.

## 0.9.46, 17 October 2026

- Fill desktop, iPad and phone screens with the supplied title artwork,
  cropping its edges instead of letterboxing. Keep the entry button and
  release/build label inside safe areas as browser controls resize the view.
- Prevent intrinsic poster sizing from overflowing iPad and desktop layouts.

## 0.9.45, 17 October 2026

- Show the release version and build at the bottom-left of the title artwork,
  using the same automatic build values as the game footer. Keep the muted
  label readable over either poster and clear of the entry button on phones.

## 0.9.44, 16 October 2026

- Replace the incident header's text brand with the approved compact,
  bone-coloured version of the supplied Breach Command logo. Preserve the
  accessible home link, phone header controls and original-text fallback,
  including artwork failures before hydration.

## 0.9.43, 16 October 2026

- Replace both title pictures with the supplied incident-command artwork.
- Rename the title entry to **Stop the Breach** and float it over the lower
  centre of the picture with a semi-transparent background and hover state.
  Retain keyboard focus, locale selection and saved-operation resume access.

## 0.9.42, 16 October 2026

- Add an illustrated title page using the supplied landscape and portrait
  artwork, with a keyboard-accessible Start link to the incident desk at `/play`.
  Preserve the complete artwork and keep the button separate and readable.
- Keep saved progress, direct desk access, locale selection and offline entry
  working across the title-to-game transition. Artwork loads only on the title page.

## 0.9.41, 16 October 2026

- **A focused opening loop.** Guided Training introduces one academy lesson
  at a time during the first two checks and starts optional map, specialist
  and evidence references folded on every width. Everything remains manually
  accessible; desktop reference expands after two checks or when comparison
  and theory become useful. Guidance-off and Expert keep their usual layout.
- **Plain, consistent guidance.** Use "working reading", define hypothesis
  alongside it, and keep longer check explanations optional while preserving
  visible turn-cost warnings and exact plan effects.
- **Visible consequences.** Procedure reports show recorded meter changes and
  why they happened before optional roll/plan calculations. Game rules and
  strategic choices are unchanged.

## 0.9.40, 16 October 2026

- **Test a reading before calling it supported.** The first-operation academy
  now asks for a source that can test the current reading and explains that
  the result may support or challenge it. Procedure accessible names identify
  own sources without implying an unrun check has already supported the
  hypothesis. Fresh-profile phone and desktop checks cover the academy,
  first procedure and recorded turn effects; game rules are unchanged.

## 0.9.39, 16 October 2026

- **Clearer text hierarchy.** Keep condensed headings and regular-width prose,
  increase captions to 14 px and compact metadata to 12 px, and remove tiny
  mobile pressure-label overrides. Shared neutral heading, body and secondary
  colours preserve dark inks on paper and the existing labelled status hues.

## 0.9.38, 16 October 2026

- **Bounded message rendering.** Imported message identifiers reject template
  syntax. Unknown keys and content references render literally, and recursive
  rendering caps each result before further interpolation and after case
  folding. This prevents small crafted backups from expanding into huge text
  during play or review. Normal and legacy message wording is preserved.

## 0.9.37, 16 October 2026

- **Dependency update reliability.** Align Dependabot's npm cooldown with
  pnpm's seven-day package-age limit. The updater now defers fresh candidates
  before lockfile generation, preserving the installer protection that rejected
  the too-young releases in its previous runs.

## 0.9.36, 16 October 2026

- **Nested backup records.** Reject malformed evidence identifiers,
  correlation pairs, history entries, turn values and response choices before
  restoring an operation. A bad operation in an otherwise readable backup is
  reported and left out while preserving the device's existing operation;
  campaign progress can still be restored. Legacy save fixtures remain readable.

## 0.9.35, 16 October 2026

- **Security fixes.** Updated Next.js and its lint configuration to 16.3.8
  and patched vulnerable transitive dependencies. CI audits dependencies,
  pins actions to commit hashes and accepts patch-update pull requests.
- **Safer local data.** Backup/session parsing bounds size and structure,
  validates nested messages and rejects prototype keys. CSV exports prevent
  formula execution from imported text. Existing save migrations remain.
- **Browser boundaries.** A production content-security policy limits
  resource destinations and embedding. Offline caches read/delete only the
  game's namespace and store only published documents/assets, excluding
  private responses and arbitrary endpoints. The security review documents
  one unfixed development-tool advisory and the policy's inline-script limit.

## 0.9.34, 16 October 2026

- **One question at a time.** The working reading leads with the question
  for the first unconfirmed stage, including on phones after a reading is
  declared. Training keeps the case-theory form available on request until
  two stages are confirmed and introduces comparison controls once two
  findings exist.
- **Shorter evidence decisions.** Each response shows its name, a short
  tradeoff and exact effects. Its longer rationale opens separately without
  recording a choice. Signal and confidence remain labelled with their
  causal limits; completed checks finding no stage now explain their
  bounded assessment in the report too.
- **Clearer consequences.** A recorded evidence response leads its report
  with the chosen action, actual meter directions and exact changes. The
  fuller explanation remains available on request. Rules, scoring and save
  formats are unchanged. The information-load roadmap records the delivery
  steps and follow-up measures for the public beta.

## 0.9.33, 16 October 2026

- **Clearer Captain reports.** Results, the tested stage and confirmed stages
  lead each report. A response index names every command choice and moves
  focus to its full description and exact costs without choosing it. Roll,
  collection-plan and turn-effect details open on request; findings, voice
  captions and signal/confidence warnings remain visible. Failed checks
  explicitly rule nothing out and show ready sources from public coverage;
  Expert withholds this guidance.
- **Signal and confidence.** Findings distinguish strong or weak signal from
  strong or weak confidence in their causal interpretation. Training explains
  all four combinations. Supported comparisons show the confidence gain,
  identify the contributing sources and can trigger a captioned Captain line.
  Linked findings retain their assessment and specialist source review.
- **Art and state colours.** Original field-kit icons identify procedures,
  evidence sources and specialist roles. Muted blue marks selections and
  untested links, teal supported assessments and stable services, amber weak
  confidence and degraded services, and coral critical states. Text labels,
  connection patterns, high contrast and reduced-motion support remain.
- **Better voice pacing.** Routine Captain speech waits for a quiet moment
  and pauses while a decision is pending. Urgent warnings take priority.
  Listen and Skip remain available; muting, closing a view or hiding the tab
  cancels queued speech as well as playback.
- **Balance and practice.** Terminal schedule pressure is eased while
  retaining the difficulty progression. Bot Commander prioritises ready
  sources that can test the current reading, using public coverage rather
  than the hidden attack chain, and falls back to broader collection when
  those sources are unavailable.
- **Fixes and testing.** Deferred focus recovery respects the player's
  current focus. Later-stage report placeholders render their numbers
  correctly. The newcomer playtest pack now covers signal/confidence and
  voice pacing with consistent timing instructions. Report scanning and
  keyboard navigation are checked across Chromium, WebKit and Firefox.

## 0.9.32, 12 October 2026

- **Keyboard play keeps its place.** Played with the keyboard alone, focus
  fell to the top of the page after closing the mission brief, recording a
  reading, closing a report with nothing to decide, and choosing a sector
  decision or a command event. It now goes to the next thing to do: the
  procedures, the waiting decision, or the next order. The mission brief
  opens on itself, like every report, and a decision that appears behind an
  open report waits for it to close before taking focus.
- **Nothing hides what has focus.** On a laptop, the specialists and the
  difficulty were focused mostly behind the pinned start button, and
  controls under the pinned workspace tabs could be tucked behind them. The
  page now scrolls them clear.
- **Fewer interruptions for screen readers.** A sector decision was read in
  full the moment it appeared, behind the open report, and again when focus
  reached it; it is now read once, when it takes focus. The warning while a
  pressure is critical repeated its figures every turn; it now names the
  pressures past their line ("Business impact is critical.") and speaks when
  another one crosses.
- **A keyboard-only playthrough test.** A whole operation, won at 1280 px and
  lost at 390 px, is played with Tab, Enter and Escape on seeded dice, with
  axe run on each surface it reaches. It fails on the version before this
  one.

## 0.9.31, 12 October 2026

- **A line of atmosphere under the heading.** "You have the incident." is
  followed by "Ten organisations. One pattern behind them. Your call.",
  in the heading's face and the page's bone, before the paragraph that
  explains a turn. It names the campaign's shape: ten cases, and the acts
  that ask what connects them. The start button stays on the first screen
  of a 320 by 720 phone.

## 0.9.30, 12 October 2026

- **The assignment says what it is again.** The line above "You have the
  incident." reads "A solo incident-response tabletop" (it repeated the top
  bar's "Incident desk" before), and the footer signs off in the game's own
  voice: "Breach Command. A solo tabletop of four-stage intrusions, played
  against a rule-based Incident Captain. Every organisation, person and
  breach in it is invented." The name is set brighter, the lines balance,
  and the version and build stay together on one line.
- **`nowrap` works.** Four places in the markup asked for a run of words not
  to break (a footer's name, a version, a "+2") and no rule ever gave the
  class its meaning; it has one now.

## 0.9.29, 12 October 2026

- **Breach Command stands on its own.** The footer, the field guide, the
  educator pack, the README and the contributor instructions no longer
  describe the game as an adaptation of another card game or link to it.
  The assignment's footer now reads "Fictional scenarios and a rule-based
  computer facilitator", with the version and build, and the game screen's
  footer link, which opens the field guide, is called "Field guide".

## 0.9.28, 12 October 2026

- **The printed review is whole.** Printing the after-action review gave its
  first page and nothing more: an open dialog clips the page to the window
  to stop it scrolling, and the print kept that clip. It now prints every
  section, about three A4 pages, and every fold prints open, since a fold
  cannot be opened on paper. Folds the player had closed close again
  afterwards.
- **A steadier first-paint check.** The test that the game's stylesheet
  leaves the assignment screen alone failed about one run in ten under
  load. It counted an image with no "loaded" mark as shown, and it could
  keep a frame painted before the scene was decoded. It now waits for each
  scene to be marked loaded and keeps the first of two matching captures:
  100 of 100 under load.
- **Roadmap.** Phase 7 records that the pseudo-locale layout check could
  not fail before 0.9.27, and what it measures now.

## 0.9.27, 12 October 2026

- **The specialist roster lines up.** Each specialist's selection mark sat
  between their name and their role; it is now level with the name and
  portrait, and on a wide screen the role is centred on the row.
- **Your command record wraps cleanly.** "3/10 incidents, trust 50,
  readiness 50" no longer leaves the last figure alone on a line on a phone.
- **Longer languages fit on a phone.** On the assignment and investigation
  screens, a long word in a translation made the page wider than the phone
  (the pseudo-locale's assignment was 524 px wide at 390). The columns,
  the fatigue note, the Bot Commander setting, the reading comparison and
  the wordmark now wrap within the screen. English is unchanged.
- **The layout check sees clipped overflow.** The page clips sideways
  overflow, so the locale test's scroll-width check could never fail; it now
  measures how far the furthest box reaches past the viewport.
- **Campaign states have visual baselines.** A campaign part-way through
  and a finished one with its conclusion are photographed whole at all four
  widths.

## 0.9.26, 12 October 2026

- **The case numbers line up.** On the assignment, a cleared case's number
  sat higher than the rest and its tick crowded the figure. All ten numbers
  now share one line, each tick sits beside its number, the mastery tally
  has its own line beneath, and the selected case's underline no longer
  touches its tally.

## 0.9.25, 12 October 2026

- **Source artwork.** Eight new evidence still lifes give each shared check
  its own source image; operational-technology checks retain maintenance art.
- **Story artwork.** Eight object emblems accompany adversary intent in the
  review, and all four campaign conclusions have original scenes.
- **Smaller scenes on phones.** Sector, act and ending scenes have 480 px
  copies selected through responsive image attributes. Frames use the dark
  desk while loading, and images fade in with reduced motion respected.
- **Result images.** A muted sector scene accompanies the saved result form.
  Missing artwork still produces the full text result. Rules, scores, saves,
  challenge codes and game wording are unchanged.

## 0.9.24, 12 October 2026

- **Dependencies.** React and React DOM move to 19.3.0. Nothing on screen
  changes: pixels and text are identical on every seeded screen.

## 0.9.23, 12 October 2026

- **A third crisis for every sector.** Remote workers signing in, scans
  sent for reporting, a control room handover, gate bookings, a status page,
  administrator accounts, an application deadline, emergency call routing,
  reservoir readings and card authorisation. Each offers a decisive, a
  narrow and a permissive measure, like the first two. A crisis now repeats
  within a campaign act in about 30 campaigns in 100, from about 58.
- **Challenge codes move to `BC9`**, because the same seed can now meet a
  different crisis; earlier codes are named as outdated. The new crises have
  not yet had a practitioner's review.

## 0.9.22, 11 October 2026

- **Dependencies.** Tailwind CSS and its PostCSS plugin move to 4.3.3
  together, and tailwind-merge to 3.7.0. Nothing on screen changes: pixels
  and text are identical on every seeded screen.

## 0.9.21, 11 October 2026

- **A lighter first visit.** The artwork is no longer downloaded all at
  once (about 2.4 MB) when the game is first opened; each image is kept for
  offline play once it has been shown.
- **Housekeeping.** The game screens' art styles load with the game, not
  with the first screen. Which sectors count as operational technology is
  one named list rather than two case numbers, and the review's visual test
  plays the same operation every time. Nothing on screen changes.

## 0.9.20, 11 October 2026

- **Artwork.** Each of the ten sectors has an original charcoal-and-bone
  illustration on the assignment and in the mission brief's operation
  context. The six specialists have portraits in the roster and the brief;
  each campaign act and each kind of ending has a scene; and a confirmed
  finding shows a still life of the kind of source that found it, chosen by
  the check that was run, never by the hidden technique. Every image is
  decorative and local, and the offline cache keeps them when it can.

## 0.9.19, 11 October 2026

- **A campaign repeats itself less.** Within an act, the same interruption
  now comes back in about 2 campaigns in 100 (from 8), and the same inject
  in 3 (from 13). Eight new command events: the intruder reading the
  team's email, police asking to leave the intruder in place, the sector's
  sharing group, the chief executive's laptop, a team's own server, a
  proposal to reset every password, the intruder making contact, and a
  breached remote-support tool. In four of them the better call is the
  second option. A critical roll now draws the inject the campaign met
  longest ago once the fresh ones are spent.
- **Challenge codes move to `BC8`.** Codes shared before this version are
  named as outdated, because the same seed now meets different events.
  The new events have not yet had a practitioner's review.

## 0.9.18, 11 October 2026

- **The stylesheet tool is stricter.** Two rules count as saying the same
  thing only when their declarations come in the same order, since the
  order decides between a shorthand and its longhand; the sheets were
  already consolidated this way, so nothing changes. The computed-style
  comparison that showed 0.9.17 changed nothing is now in the repository
  (`tests/e2e/computed-styles.spec.ts`, `scripts/compare-styles.py`), and
  0.9.17's notes give the merges' true line count (595, not 653: the rest
  was the educator pack's rules moving to their own sheet).
  Nothing in the game changes.

## 0.9.17, 11 October 2026

- **The educator pack is a printed document again.** Since 0.9.15 its page
  had lost its styles and showed as plain text; it now looks as it did in
  0.9.14, on screen and in print.
- **A tidier stylesheet.** Rules that said the same thing in two places are
  one rule now, wherever that cannot change what the page shows: 595 fewer
  lines, and the stylesheet the first screen waits for is about 1 KB
  smaller. Nothing on screen changes.

## 0.9.16, 10 October 2026

- **Adding a sector is a measured procedure.** A trial sector was scaffolded,
  written, wired in and taken to a passing test suite in one session, and
  everything it tripped over is fixed: the scaffold names
  `lib/scenarios.ts` for the scenario, asks for one exclusive technique a
  stage with its ATT&CK ids and for the icon, and the drafts test no longer
  mistakes the shared procedures for a per-scenario table.
  `docs/CONTENT.md` lists the rules the wired-in tests check and records the
  run. The trial sector is not shipped.
- **Release notes on deploys.** `docs/RELEASING.md` says how to confirm a
  deploy from its GitHub deployment, and that Vercel deploys `main` before
  Verify has passed, with the two ways to close that gap.
  Nothing in the game changes.

## 0.9.15, 10 October 2026

- **The first screen paints sooner.** The page now waits only for the styles
  the assignment screen uses (86 KB, from 190 KB); the game screen's and the
  dialogs' styles arrive with the game, warmed while the page is idle. First
  paint on a throttled phone profile fell from about 1.25 s to 1.1 s.
  Nothing on screen changes.

## 0.9.14, 10 October 2026

- **Shared codes play the same for everyone.** A Daily, Weekly or loaded
  challenge operation now starts from a neutral command (no rank, fatigue,
  doctrine, readiness, trust or unresolved access carried from this
  device's campaign), so the same code is the same operation on any device.
  Codes move to `BC7`; an earlier code is named as outdated.
- **A newer version's save is never overwritten.** If it cannot be moved
  aside, the new operation is played from memory and the save is kept; the
  move is tried again before anything replaces it.
- **Backups include an operation waiting to be resumed**, with its own
  settings, even before it is reopened.

## 0.9.13, 10 October 2026

- **Lighter still.** The attack tables, the map's topologies, the sector
  crises and the specialists' after-action notes now arrive with the game
  too; the assignment screen keeps only the cases, difficulties, specialists
  and campaign it shows. The script the page needs before it answers is
  651 KB, down from 845 KB two releases ago. Nothing on screen changes.

## 0.9.12, 10 October 2026

- **A lighter first visit.** The assignment screen no longer loads the
  game's engine: the rules, the reads, the review, the session's reading of a
  save and the Bot Commander arrive with the game screen, warmed while the
  page is idle. The script the page needs before it answers fell from 845 KB
  to 726 KB, and the whole game's script by 37 KB, because the parts no
  longer each carry their own copy of what they share. Nothing on screen
  changes.

## 0.9.11, 10 October 2026

- **The last of the leftover English.** The pseudo-locale sweep now opens
  every folded section and reads Settings, the field guide and a returning
  player's assignment screen as well. It found the map's connection words
  ("authenticates", "reads"), the selected system's state, the review's
  "hypothesis:" and mastery "of 3", the facilitator sheet's "found" and
  "none", the last operation's score, the record's accuracy line, the
  objective meter's "worse"/"better" and the action sheet's Close. All are
  translatable now (2,031 strings for a translator); English is unchanged.

## 0.9.10, 10 October 2026

- **Nothing left in English by accident.** A test now reads the whole engine
  and its tables and allows prose only where a translation can reach it, and
  another walks every seeded screen in the pseudo-locale and fails on any word
  it did not write. Between them they found what the earlier steps missed and
  this release translates it: the map's node kinds and states, the levels of
  disruption, confidence and residual risk, the response phases in the
  review, the adversary's pace, the incident log's count, the first-session
  record in Settings, the dialogs' Close, one stage name and the whole
  "service disruption" objective, which the content extraction had skipped.
  English is unchanged.

## 0.9.9, 10 October 2026

- **Announcements and notices in any language.** What the game says to a
  screen reader as you play, the Bot Commander's status, the notices about
  saved data and backups, the briefing's answers and the challenge code's
  replies are messages (57 of them), said in the language the game is in.
  English is unchanged. The check for English written into the interface now
  reads the hooks as well as the components.

## 0.9.8, 10 October 2026

- **The campaign, the Bot Commander and your last operation in any language.**
  What the campaign says after an operation and at its end, why it is on its
  route, what trust and readiness buy, the specialists' after-action notes,
  the Bot Commander's reasons, the suggestion for what to play next and when
  you last played are messages, and the campaign's ranks, acts, endings and
  capabilities are content a translation replaces (110 more strings for a
  translator). English is unchanged.
- **The result image in your language.** The image is drawn in the language
  the game is in; it was always drawn in English.
- **Your last operation survives the change.** The assignment screen's record
  of it is now stored as messages; one saved by an earlier version keeps its
  English as you read it.

## 0.9.7, 10 October 2026

- **The board and the review in any language.** What the game says as you
  play (the reads on the board, the reading's standing, the lead, the map's
  offer) and the review's verdicts, ledger and score rules are messages
  rather than English sentences, with real plurals where the English used to
  add an "s"; the engine's catalogue now holds 334 messages. English is unchanged, word for word, across 120
  seeded operations and 12 campaigns (443,880 lines, now checked by
  `pnpm prose:check` on every test run).
- **Fixed before release:** two places the change broke, both caught by the
  browser suite. The copied result read "[object Object]", and the
  Investigate workspace failed to open on a Training prompt. The type test
  that guards messages now also checks JSX and `join()`, which would have
  caught both.

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
