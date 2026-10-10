# Breach Command: roadmap to AAA

This is the improvement plan for taking Breach Command from a polished solo
project to what a player, a reviewer and a practitioner would each call
top-tier. It is grounded in the state of the repository on 9 October 2026
(commit `231dd45`) and in what thirteen rounds of visual review, bot
balance runs and newcomer playtests have taught. Phases are ordered by
dependency, not by appeal: the earlier phases build the instruments the later
ones are judged with.

Every phase states its goal, the work, the exit criteria and how they are
measured. "Measured, not assumed" is the house rule in `AGENTS.md`, and it
applies to this document: a phase is done when its numbers are met, not when
its work items are ticked.

## What AAA means here

Breach Command is a browser tabletop exercise with no backend, no accounts
and no AI service. "AAA" cannot mean a studio's budget. It means the bar a
player of a first-rate indie game would hold it to, in six respects:

| Respect | Bar | Measured by |
| --- | --- | --- |
| First session | 7 in 10 newcomers finish their first operation and can say what a working hypothesis is | Newcomer playtest protocol (Phase 0) and local first-operation counters |
| Robustness | No defect reproducible in any supported browser; a lost save is never the game's fault | Cross-browser suites, save-corpus tests, crash-free sessions |
| Performance | Lighthouse 95+ on every category on a mid-range phone; first interaction under 2 s on 4G | Lighthouse CI with budgets |
| Presentation | A design-literate human says it was designed, and a player can tell sectors apart with the copy hidden | Human designer review and the sector-recognition test |
| Depth | A tenth operation still surprises: no command event, inject or set piece repeats within a campaign act | Content counts and the repetition audit |
| Learning | A practitioner would run it in a training room and stand behind the vocabulary and the MITRE mapping | Practitioner review and the facilitator pack |

The visual grade from cold AI reviewers is deliberately not a bar. Across
rounds 6–13 it moved between C+ and B− whatever was changed, and each
reviewer named whichever base style was in place as the tell. It found real
bugs and real template patterns and those are fixed; as a gate it has
plateaued. Phase 0 replaces it.

## Where the project stands

Facts from the repository that the phases build on:

- Content: 10 scenarios, 5 authored variants each, 96 techniques (24 a
  stage), 11 shared procedures plus one sector action per scenario, 6 named
  specialists, 5 adversary profiles, 4 campaign routes, 3 difficulties,
  5 modes, 3 command events, 9 injects, 1 set piece per sector.
- Balance: measured with the revising Bot Commander over 3,000 seeded
  operations per difficulty; win rates 75 / 68 / 52 per cent at Training,
  Operational and Crisis, with sound reasoning worth about 18 points over a
  player who never revises.
- Verification: 115 engine assertions over 1,230 simulated operations,
  31 browser tests (responsive, accessibility, persistence, keyboard,
  offline), a ten-sector layout sweep at four widths and a phone fold
  measurement, all Chromium only.
- Delivery: Next.js 16 on Vercel, PWA with an install-time cache, versioned
  saves (`SESSION_VERSION` 16) and challenge codes (`BC5`).
- Size: about 1.1 MB of static JavaScript and a 10,000-line stylesheet for
  what is, at the point of play, a text game.
- Language: English only, `lang="en"`, every string authored in the data
  tables.

## Phase 0: instruments

Goal: replace opinion with measurement before anything else is built, so
every later phase can prove it worked.

Work:

- **Newcomer playtest protocol.** A written script: who qualifies (no
  security background, has not seen the game), what they are asked to do
  (play one Training operation unaided, then say in their own words what a
  reading is, why a check that found nothing matters, and what ended the
  operation), what is recorded (completion, time to first procedure, time
  to first revision, the three answers, one thing they would change). Five
  testers per round, run on a phone and a laptop. A results template in
  `docs/playtests/`.
- **Local funnel counters.** Extend `lib/telemetry.ts` (device-local, as
  the product boundary requires) with the first-session facts the protocol
  measures: first operation started, first procedure run, first revision,
  first operation ended and how, operations begun on this device. Shown to
  the player on the balance record in Settings, exportable with the backup,
  never transmitted.
- **Visual regression baselines.** Playwright screenshot assertions for the
  thirty screens the grading set already captures (`zz-audit`, `zz-look2`,
  `zz-resp` in the scratchpad become `tests/e2e/visual.spec.ts`), at 320,
  390, 820 and 1280. Most of the bugs the reviewers found (a stranded
  effects column, unlevel figures, a doubled rule) were regressions that a
  pixel diff catches in CI.
- **Cross-browser matrix.** Add WebKit and Firefox projects to
  `playwright.config.ts` and run the responsive, keyboard and offline
  suites on all three. iOS Safari is a primary target that has never been
  tested.
- **Performance baseline.** Lighthouse CI against the production build on
  the assignment screen, Investigate mid-operation and the review, with
  budgets recorded in `docs/perf-budgets.md`.
- **Human design review.** One session with a designer who has not seen the
  project, on real devices, with the brief: "would you say this was
  designed, and what would you change first?" Their list, not an agent's,
  seeds Phase 3.

Exit criteria:

- The protocol has been run once, with five testers, and its results are in
  the repository.
- Funnel counters persist, survive a reload (`tests/e2e/persistence.spec.ts`)
  and appear in the export.
- Visual regression and the three-browser matrix run in
  `.github/workflows/verify.yml` and are green.
- Lighthouse budgets are recorded, with the current numbers as the floor.
- The designer's review is in `docs/reviews/`.

Size: M (three to four sessions). No dependencies.

Status, 9 October 2026: the instruments an agent can build are in place.
The protocol and its results template are in `docs/playtests/`; the local
record keeps the first operation's times and revisions, shows them in
Settings and travels in the backup; 32 visual baselines (eight screens at
320, 390, 820 and 1280) and the performance budgets run in CI; WebKit and
Firefox run the responsive, keyboard, persistence and offline suites in
their own CI job; Lighthouse's first reading is 94 / 100 / 100 / 100
(`docs/perf-budgets.md`); the designer's brief is in `docs/reviews/`.
Open, because they need people: the first playtest round and the design
review.

## Phase 1: foundation

Goal: the game behaves identically in every supported browser, loads fast
on a mid-range phone, and never loses a player's state through its own
fault.

Work:

- **Cross-browser defects.** Fix whatever the WebKit and Firefox runs
  surface. Known risks: `subgrid` on the readouts, `details` focus
  handling, `AudioContext` resume on iOS, the service worker's install-time
  cache on Safari, `navigator.vibrate` absence, `:has()` on older WebKit.
- **Bundle.** Code-split the review, the field guide, the settings dialog
  and the Bot Commander behind dynamic imports; audit what of `radix-ui`
  and `lucide-react` is shipped; target under 400 KB of JavaScript on the
  first interaction.
- **Stylesheet.** `app/globals.css` has grown by accretion through thirteen
  rounds. Consolidate it: one block per component, dead rules pruned
  (`prune.py` in the scratchpad is the start of a tool; make it a script in
  `scripts/`), the phone compaction kept as the single last block the house
  rule requires. Target under 6,000 lines with no visual change, proved by
  the Phase 0 baselines.
- **Error boundaries.** A boundary around each workspace and each dialog,
  so a render fault in the review does not take the operation with it; the
  existing `app/error.tsx` stays as the last resort. A fault is reported in
  the game's own words with a copyable diagnostic, never a blank screen.
- **Save corpus.** Collect one saved session from every `SESSION_VERSION`
  since 10 into `tests/fixtures/saves/`, and assert that each migrates and
  resumes. A migration bug today is found by a player.
- **Offline on iOS.** Verify the install, the offline start and the parked
  save on a real iPhone, and document the findings.
- **Lighthouse budgets enforced.** The budgets from Phase 0 become CI
  failures.

Exit criteria:

- All browser suites green on Chromium, WebKit and Firefox.
- Lighthouse 95+ on performance, accessibility, best practices and SEO for
  the three measured screens, on the simulated mobile profile.
- First-interaction JavaScript under 400 KB; stylesheet under 6,000 lines
  with zero visual-regression diffs.
- Every save in the corpus migrates; a deliberately corrupted save is
  refused with the existing message.

Size: L (five to seven sessions). Depends on Phase 0.

Status, 9 October 2026. Met: every browser suite is green on Chromium,
WebKit and Firefox (the only failures were two tests asking their harness for
what it cannot do); Lighthouse is 97 / 100 / 100 / 100 on the assignment
screen; a fault in any workspace or dialog stays in it, with a copyable
diagnostic (`components/game/fault-boundary.tsx`); every save from
`SESSION_VERSION` 10 to 16, written by the code of its own era, migrates and
plays to an ending (`tests/saves.test.ts`); the budgets are enforced in CI.
Partly met: initial script fell from 921 KB to 770 KB by loading the game
screen, the dialogs, the audio and the Bot Commander on demand, but the
400 KB target is below this stack's floor (React DOM and the Next.js runtime
are about 540 KB decoded); the next cut is splitting the engine from the
assignment screen. *10 October 2026 (0.9.12): made.* The engine, the
session's migration, the Bot Commander and every lazy part are one bundle the
assignment screen never imports (`lib/game-loader.ts`,
`tests/first-load.test.ts`): initial script 845,158 B to 726,346 B, all
script by play start 1,190,300 B to 1,153,079 B (the parts no longer carry
copies of what they share), the operation's layout shift 0.030 to 0.011;
budgets lowered to 750,000 B and 1,170,000 B. What remains on the first load
beyond the framework is the content tables the assignment screen reads from
(`lib/game.ts` with every attack, `lib/phase8.ts`, `lib/phase9.ts`), the next
cut. *0.9.13: made.* The cases, stages and difficulties moved to
`lib/scenarios.ts`, challenge codes to `lib/challenge.ts`, the specialists'
names to `lib/command-systems.ts` and their notes to
`lib/specialist-notes.ts`; attacks, procedures, topologies and set pieces now
load with the game. Initial script 650,872 B (budget 675,000 B); all script
by play start 1,151,002 B. What the first load holds beyond React DOM and the
Next.js runtime (about 540 KB) is the assignment screen, its catalogue, the
campaign and the session hook. Not met: the stylesheet is 9,330 lines, down from 10,032
by removing only what provably cannot apply. Reaching 6,000 means
restructuring it by component, which is better done with Phase 3's type
system than ahead of it. Open, because it needs a device: offline play on a
real iPhone (Playwright's WebKit cannot test it).

## Phase 2: first session

Goal: a newcomer finishes their first operation and understands the loop —
declare, test, revise, compare — without being told what to click.

Work:

- **Playtest-driven fixes.** Run the Phase 0 protocol, fix what the five
  testers stumbled on, run it again. Three rounds minimum. The repository
  already records what earlier playtests found (the clue dropping out, a
  reading carried into a new stage unquestioned, the sources that could not
  see the stage); the protocol makes this routine.
- **The first ten minutes.** The academy, the Training clue, the first
  evidence decision's primer and the first report are the whole tutorial.
  Measure time to first procedure; if it exceeds four minutes on a phone,
  the assignment screen and the brief are too long for a first visit.
- **Difficulty ramp.** Training to Operational is where the aid stops.
  Consider a fourth rung or an optional "second operation" aid that keeps
  the standing readout but drops the clue, and measure whether the drop in
  win rate between the two (75 to 68 for the bot) is where newcomers quit.
- **A recommended next operation.** After the review, say which case and
  difficulty to play next and why, from the record (a loss to the window
  suggests the same case at Training; a clean win suggests Operational).
- **Return visit.** A returning player sees what changed since they last
  played (a new case cleared, a milestone reached) and one line on what to
  try. Local only.

Exit criteria:

- 7 of 10 newcomers in the final playtest round finish their first
  operation, and 8 of 10 answer the three understanding questions in a way
  a practitioner accepts.
- Median time to first procedure under four minutes on a phone.
- The local funnel counters on a fresh device agree with the playtest
  numbers within noise.

Size: M (four sessions across three playtest rounds). Depends on Phase 0;
benefits from Phase 1's cross-browser fixes.

Status, 9 October 2026. Built: the recommended next operation
(`recommendNext`, from the record: a loss to the window drops a rung on the
same case, a loss to another meter repeats it, a strong win steps up) in the
review and on the landing page, and the return visit's line
(`lib/last-operation.ts`: the last operation, when, how it ended and the
suggestion, local only). Two agent stand-ins played a first Training
operation as the protocol runs it, on a 390 px phone and a 1280 px laptop. They
do not count toward the exit bar, but their timings were: first procedure in
49 s and 60 s (the bar is four minutes), first revision at 2 min 36 s and
about 3 min 20 s, and both won with a B. The device's own first-session
record agreed with their clocks to the second; its revision count did not
(Settings counted every click, the review a change between checks), and
they now share `countRevisions`. Fixed from their reports: "Pace" read as
the team's (now "Adversary pace"), a capped roll's "Next roll harder" beside
"next roll unchanged", "the pace is fast" beside progress 2, "0 of 100" in
the review without its meter, advice about ruled-out marks the player never
saw, "4 findings" on the tab beside three stages (now "3 of 4 stages"), a
stage clue whose only plain word belonged to the cloud route, "collection
focused on" in a finding, and no way back to the procedures after recording
a case theory.

Open, for the human rounds to settle: both stand-ins read "Cannot explain
this stage" on declaring a reading as a free elimination, and asked for it
in the comparison instead; three failed opening rolls cost the laptop
stand-in about +38 impact with nothing learned, and it asked for the map to
be offered before the first check; the phone stand-in restored backups while
the board warned of a backup verification gap, and asked to be told when a
case theory is wrong before the ending; the difficulty ramp. Not met: the
three playtest rounds with ten human newcomers, which no agent can stand in
for.

## Phase 3: presentation

Goal: a human designer's direction, carried through consistently, so the
game looks like one thing made on purpose. This phase decides questions the
agent rounds could not.

Work:

- **Art direction decision.** The designer from Phase 0 settles, in one
  document in `docs/design/`: the ground (the dark desk, paper, or a
  warmer, ink-heavy desk that reads as neither a dashboard nor a template),
  whether the paper documents need an edge or shadow to read as objects,
  and whether sectors may differ by more than copy. `AGENTS.md` records the
  current decisions (dark desk, bone accent, sectors never differ by hue,
  body face unchanged); the designer may revise any of them, and the record
  is updated to say why.
- **Type system.** Three or four named text styles mapped to every element,
  replacing the drift the reviews counted (five heading voices in the
  review). One face for titles, the body face for prose, figures tabular.
- **Sector identity.** Each of the ten sectors gets one recognisable
  artefact a player can name with the text hidden: a letterhead strip, a
  form variant, a scene line drawing. The sector-recognition test: show
  five testers the Command screen of three sectors with copy blurred, ask
  which is which.
- **Sound design.** `lib/feedback.ts` is 783 lines of procedural audio
  written without a sound designer. Commission or design a palette: one
  voice per event class (a check, a find, a decision, a warning, an
  ending), the sector ambience, and silence as a choice. Keep it
  procedural or self-host assets; no external dependency.
- **Motion.** One motion vocabulary: how a report arrives, how a stage is
  confirmed, how a meter crosses a band. Reduced motion stays a complete
  experience, not a disabled one.
- **Iconography.** Decide once whether the topbar keeps its icons or
  becomes text, and apply it everywhere.
- **Landing page.** The designer's call on the pitch column: a sample
  redacted chain, a sample case file, or the slip alone.

Exit criteria:

- The art direction document exists and `AGENTS.md`'s visual paragraph is
  rewritten against it.
- Visual regression baselines re-recorded after the pass, with the diff
  reviewed screen by screen.
- Sector-recognition test: 4 of 5 testers name 2 of 3 sectors.
- A second design-literate human, not the one who directed it, reviews the
  result on real devices and says it reads as designed. If not, their list
  is the next iteration, not an agent's.
- `pnpm test:a11y` zero violations at every width; the fold on a phone no
  lower than today (procedure grid at about y=785 at 390 px).

Size: L (six to eight sessions, plus the designer's time). Depends on
Phase 0's review; should follow Phase 1 so the stylesheet is consolidated
before it is restyled.

Status, 9 October 2026. The parts that need no designer are done:
`docs/design/ART-DIRECTION.md` records every current decision with its
reason and lists what is open, as the brief the designer starts from. The
type system has two faces and three weights: bold is 600 everywhere and the
700 face is no longer shipped, which took each screen's count of distinct
text styles from 16, 20 and 21 to 15, 17 and 18, and
`tests/e2e/type-styles.spec.ts` holds those counts as a ratchet. Motion is
one vocabulary of two easings and six durations in `:root`, used by every
animation, and four keyframes nothing used (two of them glows) are gone.
Sound has one voice per event class, with a find and a loss voiced apart from
an empty check and an escalation. Visual baselines are re-recorded after the
pass.

Open, and the designer's: the art direction itself, the sector artefact and
the recognition test, the landing page's pitch column, the remaining title
and label weights, a commissioned sound palette, and the second
design-literate review on real devices.

## Phase 4: content depth

Goal: a campaign of ten operations never repeats a beat, and every sector
reads as its own world.

Work:

- **Command events: 3 to 12.** Every third turn draws one; a ten-turn
  operation draws three, and a campaign act repeats them today. Author
  nine more, each with a decisive and a narrow measure, and keep the rule
  that an operation meets one it has not met before repeating.
- **Injects: 9 to 20.** The critical-roll rule already reaches past
  unfavourable cards; a deeper deck makes a natural 20 feel earned rather
  than predictable. At least four per valence, with the authorised
  stand-down still reached on a 20 only.
- **Adversary profiles: 5 to 8.** Each new profile needs a signature
  mechanic, an attribution ladder and a learning rule that the review can
  name. Test with `pnpm balance` that no profile moves a difficulty's win
  rate by more than three points.
- **Set pieces: one to two per sector.** A second sector crisis per
  scenario, drawn by variant, so the fourth variant of the clearing house
  is not the same crisis as the first.
- **Variants: 5 to 7 per scenario,** keeping the first three stable across
  releases as `phase9.ts` promises.
- **Two new sectors**, chosen for mechanics the ten do not have (an
  election authority with a fixed deadline and public confidence; a
  logistics network with partner trust): each needs a topology, a sector
  system, a set piece, a sector action, an adversary mapping, five variants,
  three or more exclusive techniques and complete four-stage choice sets,
  as `AGENTS.md` requires. `CHALLENGE_VERSION` moves to `BC6`.
- **Campaign narrative.** Three acts exist as thresholds; give each a
  briefing from the director, a mid-act development keyed to the route, and
  an ending that names what the command did, in the review's own facts.
- **Specialist arcs.** Six specialists have reactions; give each one
  development across a campaign (a request, a disagreement, a change of
  role) keyed to rapport, so a team is a cast.

Exit criteria:

- Repetition audit: over 3,000 simulated campaigns of ten operations, no
  command event, inject or set piece repeats within an act in more than
  5 per cent of campaigns.
- `tests/content.test.ts` extended to every new table (sources that can
  see the technique, three exclusive techniques per sector, four techniques
  across three routes a stage, narrow measures that cost something).
- `pnpm balance` within three points of the current figures at every
  difficulty after each content batch, or the change is explained in
  `AGENTS.md`.
- A practitioner reads every new technique, event and set piece and signs
  off that it could happen as written.

Size: XL (ten or more sessions; authored content is the long pole).
Depends on Phase 0's counters (to know what players reach) and Phase 2
(so the new depth is met by players who get past the first operation).

Status, 9 October 2026. Authored: command events 3 to 18, each signal's
words checked against its numbers (four of the original eight signals did
not match and were corrected); injects 9 to 20, eight good, eight bad and
four neutral, the three new neutral cards trades that a critical roll never
reaches; adversary profiles 5 to 8 (Grey Lantern, Hollow Choir and Ember
Shift punish an unused map, an uncompared pair of findings and a stretched
service, and the review names each profile's habit and counterplay); a
second crisis for every sector, met by the odd incident variants; variants 5
to 7 a case, the first three never moving; the campaign's story (a
director's briefing per act, a development at the act's midpoint keyed to
the route, an ending that states the command's own record) and three beats
a specialist keyed to rapport. `CHALLENGE_VERSION` is 6 and `SESSION_VERSION`
17, with a save from 17 in the corpus.

Repetition audit (`pnpm repetition`, 3,000 campaigns, 43,348 operations): a
campaign now remembers its recent events, injects and crises. Within an act,
a command event repeats in 8.4 per cent of campaigns (92 without the memory),
an inject in 12.7 (77) and a sector crisis in 60 (85). Not met at 5 per
cent: every crisis repeat is a third or later attempt at a case the Bot
Commander kept losing, which two crises a sector cannot avoid, and an act of
four cases plus replays draws about as many events and injects as exist.
Balance on the same seeds, 1,000 operations a scenario: 76.0 / 67.8 / 49.6
against 74.7 / 66.6 / 49.8 before, within three points everywhere.

Not done: the two new sectors, which change the campaign's length, every
per-scenario table and the endings, and want the practitioner's review of
the techniques first; and the practitioner's sign-off on every new event,
crisis and inject, which no agent can give.

## Phase 5: replayability and mastery

Goal: a player who has cleared the campaign has reasons to come back, and
a way to show what they can do, within the no-backend boundary.

Work:

- **Weekly operation.** Daily Operation exists; add a weekly one with a
  fixed challenge code, so a week's players compare results by sharing the
  code and the copied result.
- **Mastery ladder.** Per scenario, a ladder of authored challenges
  (clear at Crisis; clear without revising; clear with the window half
  spent; clear with one specialist exhausted), recorded locally and shown
  on the case's slip.
- **Share.** "Copy result" exists; add a share image rendered on the
  device (canvas, no service) in the case-file style, with the challenge
  code, the outcome and the stage count, and nothing that spoils the
  chain.
- **Compare with the Bot Commander.** After the review, offer to replay
  the same seed with the bot visible, so a player sees where a sound
  reading would have gone. The bot runs locally already.
- **Personal record.** A local, exportable ledger of every operation: case,
  difficulty, mode, outcome, score, challenge code. The campaign record
  shows trends (hypothesis accuracy over the last ten operations).
- **Expert as a real mode.** Expert withholds every aid; give it a
  distinct ending screen and a recorded "cleared in Expert" mark per case.

Exit criteria:

- Local return counters show a rise in operations per device after the
  campaign is cleared, measured over a playtest cohort of returning
  players (Phase 0 protocol, returning variant).
- A share image renders on Chromium, WebKit and Firefox and carries no
  technique name (asserted in a browser test).
- The ladder, the ledger and the weekly seed survive a reload and the
  export.

Size: M (four to five sessions). Depends on Phase 4 for the ladder to be
worth climbing.

Status, 9 October 2026. Built: Weekly Operation (one case at Operational on
one seed from Monday to Sunday, UTC, appended to the code's mode list so
every earlier code keeps its mode, and session version 18 so an older build
parks a weekly save instead of discarding it); a five-rung mastery ladder per
case on its slip (won at Crisis, without revising, in half the window, with a
tired specialist, in Expert); Save image, a PNG drawn on the device from the
share card; the replay of a reproducible operation by the Bot Commander,
carrying its variant and route; the personal record of every operation, with
the hypothesis-accuracy trend over the last ten and a CSV download; and
Expert's own ending and mark.

Met: the share image draws and saves as a PNG in Chromium, WebKit and Firefox
(`tests/e2e/share.spec.ts`), and its card is checked against every technique
title over simulated operations in every scenario (`tests/replay.test.ts`);
the ladder, the record and the weekly code survive a reload and a backup
round trip (`tests/e2e/persistence.spec.ts`). Not met: the rise in
operations per device after the campaign is cleared needs a cohort of
returning players.

## Phase 6: learning fidelity

Goal: a practitioner would run Breach Command in a training room and stand
behind every word.

Work:

- **Practitioner review of the whole corpus.** One review already
  corrected a dozen techniques' sources. Commission a full pass over all 96
  techniques, every procedure's description, every sector's rule and every
  response option, with findings tracked as issues.
- **MITRE ATT&CK mapping.** The review names a tactic lens per stage; map
  each technique to a technique ID in `lib/game.ts`, show it in the review
  and the field guide, and assert the mapping is complete in
  `tests/content.test.ts`.
- **Facilitator mode.** A print-friendly facilitator view of an operation
  (the hidden chain, the decisions, the ledger, the counterfactuals) for a
  trainer debriefing a room, reached from the review with a warning that it
  spoils the chain. Print styles exist for the review; extend them.
- **Educator pack.** `docs/educators/`: how to run a session, what each
  difficulty teaches, the vocabulary with its plain-language translations,
  and three debrief question sets. Linked from the field guide.
- **Glossary completeness.** Every term the interface uses is in
  `plainLanguage` and glossed on first use in prose (`glossaryParts`);
  assert it with a test that scans the authored strings.
- **Reference accuracy.** Every scenario's briefing, lead and clue
  reviewed for plausibility by a practitioner in that sector (clinical,
  OT, clearing).

Exit criteria:

- Practitioner sign-off recorded in `docs/reviews/` for every table.
- The MITRE mapping is complete and tested.
- Facilitator view prints to one or two pages at A4 and Letter.
- Glossary test passes: no interface term outside `plainLanguage`.

Size: M (four sessions plus reviewers' time). Can run alongside Phase 4;
depends on it for the new content to be reviewed too.

Status, 9 October 2026. Met: the MITRE ATT&CK mapping is complete for all
96 techniques and tested (`attackMitre`, `tests/content.test.ts`), shown in
the review's attack chain with a link and on the facilitator sheet; the
facilitator sheet prints alone on one page at A4 and Letter for a four-turn
operation (`tests/e2e/facilitator.spec.ts` holds it to two and checks it
starts on the page); the glossary test passes (`tests/glossary.test.ts`:
every acronym in the authored prose and every listed field term has an
entry, and 27 terms were added to meet it, VPN, OT and phishing among them).
The educator pack is a page of the game, `/educators`, built from the tables
the game reads, with no accessibility violations at 320 and 1280 px. Found on
the way: the review's own print had been starting half off the page, because
the minifier dropped the rule that undid the dialog's centring; fixed.

Not met: the practitioner sign-off for every table, and the sector
practitioners' review of briefings, leads and clues.
`docs/reviews/PRACTITIONER-REVIEW-BRIEF.md` is their brief, with the ten
least certain ATT&CK mappings listed first.

## Phase 7: accessibility and localisation

Goal: the game is complete with a screen reader and a switch, and can be
played in a second language.

Work:

- **Human accessibility audit.** axe reports zero violations; that is a
  floor. A screen-reader user plays a full Training operation with
  VoiceOver on iOS and NVDA on Windows, and a keyboard-only user plays one
  on a laptop. Their findings are the work list.
- **WCAG 2.2 AA.** Focus appearance, target size (the 24 px minimum
  everywhere, 44 px where a thumb goes), dragging alternatives (none
  needed; confirm), consistent help, redundant entry.
- **Live regions.** Every material state change is announced once, in the
  readouts' names, and nothing hidden is read (the objective bar's label
  once read the hidden objective; keep the test).
- **Localisation architecture.** Every string lives in data tables and
  components. Introduce a message catalogue (`lib/i18n/`), route all
  player-facing text through it, and keep the English catalogue as the
  source of truth. Pluralisation and number formatting through `Intl`.
  This is a large, mechanical refactor; schedule it after Phase 4 so the
  content is stable.
- **First locale.** One language with a reviewer available, as proof the
  architecture holds: layouts re-swept at every width with the longer
  strings (German lengthens by a third), fold re-measured on a phone.
- **Right-to-left readiness.** Logical properties in the stylesheet
  (`margin-inline`, `inset-inline`) so a later RTL locale is a catalogue,
  not a restyle.

Exit criteria:

- Screen-reader and keyboard-only playthroughs completed without a blocker,
  with the findings closed.
- WCAG 2.2 AA checklist in `docs/accessibility.md` with each criterion
  marked met and how.
- The first locale ships, the sweep and the fold pass with it, and no
  string in the interface is outside the catalogue (asserted by a test
  that greps the components).

Size: L (six sessions; the catalogue refactor is most of it). Depends on
Phase 4's content being stable.

Status, 9 October 2026. Met: the WCAG 2.2 AA checklist is in
`docs/accessibility.md`, each criterion marked met (with the test or feature),
met by design to confirm, not applicable, or open. Target size (2.5.8) and
focus not obscured (2.4.11) are tested on the main surfaces at 390 and
1280 px (`tests/e2e/wcag.spec.ts`), which found two real failures, both
fixed: Tab wrapping to a dialog's first control left it off screen, and a
report option sat under the pinned "more responses" strip. The pass also
added a confirmation to restoring a backup (3.3.4) and stopped the map's
active stage pulsing forever (2.2.2). The hidden-objective check the roadmap
asked to keep is now a browser test of every text, name and live region.
Right-to-left readiness: 183 declarations became logical properties
(`scripts/logical-css.py`), pixel-identical in English across all 32
seeded screens, and `tests/stylesheet.test.ts` keeps them so. The catalogue
architecture is in place (`lib/i18n/`, `Intl` plurals and numbers), with the
shell, tabs, window and ending migrated and a pseudo-locale a third longer
that holds every layout at 320 to 1280 px (`tests/e2e/locale.spec.ts`).

Not met: the screen-reader (VoiceOver, NVDA) and keyboard-only playthroughs;
a first real locale, which needs a translator and reviewer; and "no string
outside the catalogue", in part.

10 October 2026 (0.9.1): every JSX text and every `aria-label`,
`placeholder`, `title` and `alt` literal in `components/game` and the page
shell is in the catalogue, 572 strings in one catalogue per component under
`lib/i18n/en/`, and `tests/i18n.test.ts` now asserts there are none left
rather than holding a ceiling. English is pixel-identical on all 56 seeded
screens at four widths, and the pseudo-locale still holds every layout. Still
outside the catalogue: strings built inside JSX expressions (a ternary's
words, a template literal, a plural's "s"), and all the engine's prose
(`lib/game.ts`, `lib/advanced-game.ts`, the content tables). Many catalogued
strings are fragments joined in English order (`" of 6"`), which a
translator cannot reorder; whole-sentence messages with placeholders are
the work before a first locale.

10 October 2026 (0.9.2): the strings 0.9.1 left inside JSX expressions are
catalogued too (318: ternary branches, templates, the tables of loss causes,
sector moments and response trades, which now hold keys translated at
render), and 110 runs of fragments became whole messages with placeholders,
so "{revealed} of 4 stages, {count} revisions" reaches a translator as one
sentence with its plural. `tests/i18n.test.ts` now reads every string literal
in the components, excluding only positions that are not text, and fails on
any it finds, on a key a component reads that its catalogue lacks, and on a
key nothing reads. The text of all 56 seeded screens is identical to before,
character for character. Left: a run broken by an element (a bold figure
inside a sentence) is still two or three messages, since the catalogue has
no rich-text markup; single lowercase words that look like ids are caught by
review rather than by the test; and the engine's prose.

10 October 2026 (0.9.3): messages carry markup, so a sentence with a bold
figure or a link inside it is one message (`<strong>{remaining}</strong> of
{limit} turns remaining`), rendered through the component's own element by
`rich()`; 37 such sentences were joined, and the test checks every `rich()`
call passes exactly the tags its message uses. Text identical on all 56
screens. The component layer is now fully catalogued. The engine's prose is
designed but not started: `docs/design/ENGINE-LOCALISATION.md` sets out
overlays by table, id and field for authored content, messages instead of
sentences for what the engine composes and saves (session version 19 with a
migration), and the order of work, to begin when a first locale has a
translator.

10 October 2026 (0.9.4), engine prose step 1: the content tables' words,
1,780 strings, are extracted by path into `lib/i18n/content/en.json` for a
translator, and a locale's overlay replaces them in place on the client; the
pseudo-locale now lengthens every case, attack, clue and option, and the
layout sweep holds with them. `tests/content-overlay.test.ts` plays the
balance check's 1,800 operations and 300 campaigns with the content in the
pseudo-locale and requires the same figures and fingerprint, which caught the
Bot Commander scoring response options by their words.

10 October 2026 (0.9.5), step 2: nothing reads English back. The effect
lines are data that `EffectList` lays out and the catalogue words, and the
glossary finds its terms by the words a locale gives them, checked on every
passage in the pseudo-locale. The component test now reads a component's own
props (`items`, `label`) as text; the two strings that rule had let through
(the cooldown note and the carried roll) went with the effects.

10 October 2026 (0.9.6), step 3: the saved game stores messages, not English
(session version 19), so an operation saved in one language reads in another;
an older save keeps its sentences as they were, and its roll breakdown reads as
it did. A whole operation saved by version 18 and replayed from its seed shows
today's engine storing messages that read exactly as its 110 sentences did. The
glossary and the engine's catalogue load once for every part that shows them,
which took 3.7 KB off the first load.

10 October 2026 (0.9.7), step 4a: the engine's reads, review and rules return
messages; the engine's catalogue went from 66 keys to 334, with plurals as
plural messages. `pnpm prose:check` plays
120 seeded operations and 12 campaigns through every text function and holds
English to one recorded hash of 443,880 lines; it is unchanged but for a
structural id on each score row. Text and pixels identical on all 56 screens,
balance fingerprint 1826729440 with and without the pseudo-locale, first load
836,461 B (9.2 KB less), all script by the time play starts 1,174,282 B
(budget moved to 1,190,000 B). Step 4b, the periphery (campaign, set pieces,
the Bot Commander's reasons, announcements, the stored recommendation),
follows.

10 October 2026 (0.9.8), step 4b: the campaign's sentences, the route's
reason, the specialists' notes, the Bot Commander's reasons, the suggestion
for the next operation and the last operation's record are messages, and the
campaign's ranks, acts, endings and capabilities and the specialists' notes
are registered content (1,964 strings for a translator). `grep "say("
lib/engine lib/game-bot.ts` finds nothing. The result image is drawn in the
player's locale, checked in the pseudo-locale by `tests/e2e/share.spec.ts`;
the last operation's record stores messages and reads an older English one
as it was (`tests/e2e/last-operation.spec.ts`). Prose unchanged against 0.9.7's
record; text and pixels identical on all 56 screens; fingerprint 1826729440
with and without the pseudo-locale; first load 840,379 B, all script
1,181,390 B. The session hook's own sentences are next, then step 5.

10 October 2026 (0.9.9): the hooks' own sentences (announcements, the Bot
Commander's status, storage, backup and challenge notices, the briefing's
answers) are 57 messages kept in state as messages, and the written-in
English check reads `hooks/`. Text and pixels identical on all 56 screens;
first load 844,296 B (5,704 B of headroom), all script 1,185,328 B. Step 4 is
complete; step 5, the ratchet over `lib/` and the pseudo-locale sweep, is
next.

10 October 2026 (0.9.10), step 5: `tests/i18n.test.ts` allows prose in `lib/`
only as content, a level or maintainer English, and `tests/e2e/locale.spec.ts`
fails on any word on the seeded screens the pseudo-locale did not write. They
found and this release fixed 11 kinds of leftover English (the "disruption"
objective and one stage name the extraction had skipped, levels, the map's
node words, phase names, pace, counts, Close, the first-session record).
1,977 content strings for a translator; text identical on all 56 screens
(pixels on four differ by kerning where two text nodes became one message);
fingerprint 1826729440 with and without the pseudo-locale; first load
845,031 B; all script 1,189,715 B, budget moved to 1,200,000 B. The engine
localisation plan (`docs/design/ENGINE-LOCALISATION.md`) is complete.

10 October 2026 (0.9.11): the sweep opens every fold and reads Settings, the
field guide and a returning player's assignment, which found nine more
leftovers (the map's edge labels among them) now translated; 2,031 content
strings. "No string outside the catalogue" is asserted for components, hooks
and `lib/` by `tests/i18n.test.ts`, and on every screen the sweep reaches by
`tests/e2e/locale.spec.ts`; the Phase 7 criteria still open are the
screen-reader and keyboard-only playthroughs and a first shipped locale.
First load 845,158 B; all script 1,190,300 B.

## Phase 8: release engineering

Goal: shipping is routine, reversible and documented, and a regression
cannot reach production unseen.

Work:

- **CI matrix.** Phase 0's visual regression and three-browser runs, the
  Lighthouse budgets, the save corpus, the repetition audit and
  `pnpm balance` (at 600 per difficulty, as a smoke test; 3,000 before a
  rule change by hand) all run on every pull request.
- **Versioning and release notes.** A version in `package.json` that the
  footer and the settings dialog show, a `CHANGELOG.md` kept by hand, and
  a release tag per deploy. The service worker's cache name derives from
  the version instead of being bumped by hand.
- **Preview deploys for review.** Every pull request gets a Vercel preview
  and the visual regression report attached, so a human reviews pixels,
  not descriptions.
- **Content tooling.** `scripts/validate-content.ts` that runs the content
  tests alone in under five seconds, for authors; a `scripts/new-scenario`
  scaffold that creates every table a sector needs with placeholders the
  tests reject until filled.
- **Diagnostics.** A "copy diagnostics" action in Settings: build version,
  browser, storage state, save version, the last error, nothing personal.
  Players report bugs with it; no telemetry leaves the device.
- **Rollback.** A documented procedure: revert on `main`, confirm the
  deploy, confirm the service worker serves the reverted build (the parked
  save rule in `lib/session.ts` already protects a newer save).
- **Dependency hygiene.** Next.js and React tracked within a month of a
  stable release, with the browser matrix as the gate.

Exit criteria:

- A pull request that breaks a baseline, a budget, a migration or a
  balance figure is red before merge, and the run names which.
- Three consecutive releases shipped through the procedure with notes.
- A new scenario can be scaffolded and made to pass the content tests in
  one session.

Size: M (three to four sessions). Depends on Phase 0 and Phase 1; parts of
it (the CI matrix) should land as soon as Phase 0 produces them.

Status, 9 October 2026. Built: every pull request and push runs the engine
suite, the save corpus, `pnpm balance:check` (600 seeded operations per
difficulty and 300 seeded campaigns, failing by name when a figure moves
more than three points), the browser suites with the visual baselines and the
performance budgets in Chromium, and the layout, input, storage, offline and
share suites in WebKit and Firefox, with the failure evidence kept as an
artifact; Vercel's preview is the pull request's pixels. Version 0.9.0 is in
`package.json`, the footer and the diagnostics, with `CHANGELOG.md` kept by
hand and a release workflow that tags each new version once Verify passes on
`main`; the service worker's cache is named for each deploy. Content tooling:
`pnpm validate:content` in under two seconds and `pnpm new-scenario`, whose
draft the tests reject until all of its TODOs are written (228 in a fresh
draft). Copy diagnostics in Settings, the release and rollback procedure in
`docs/RELEASING.md`, and monthly grouped framework updates.

Not yet met, and only time can meet them: three consecutive releases shipped
through the procedure, and a new scenario scaffolded and made to pass in one
session, which needs an author.

## Cross-cutting rules

- **Measure before and after.** Every phase names its instrument. A change
  without a number is a proposal, not a result.
- **Playtests decide the first session; practitioners decide the content;
  a designer decides the look.** Agents implement, measure and report. The
  agent grading rounds taught that an agent's taste is not a stable
  reference.
- **Keep the invariants.** `AGENTS.md` records why the game is the way it
  is: hidden information never reaches the player before it is earned, the
  preview and the resolution are one computation, saves migrate forward,
  the narrow measure costs something. Each phase adds to that record rather
  than working around it.
- **One commit per phase step, gated as today.** Unit, lint, types, build,
  the browser suites, the sweep, the fold, the full-tree whitespace check,
  CI green and the deploy confirmed.
- **The fold is sacred.** Anything added above the procedure grid on a
  phone is measured; the grid sits at about y=785 at 390 px and does not
  move down.

## Out of scope under the current product boundaries

These are standard on an AAA checklist and are excluded by `AGENTS.md`'s
product boundaries. Each would need the boundary changed first, and a
backend brings accounts, privacy obligations and running costs the project
does not have today.

- Online leaderboards and global rankings (local ladders and shared
  challenge codes stand in).
- Cloud saves and cross-device sync (the portable backup stands in).
- Multiplayer or facilitator-controlled sessions over a network (the
  facilitator view in Phase 6 is print and screen, not shared state).
- An analytics backend (device-local counters, exportable by the player,
  stand in).
- AI-generated narrative, an AI captain or any model at runtime.
- Real-system integration of any kind.

## Suggested order

1. Phase 0 (instruments)
2. Phase 1 (foundation) and the CI parts of Phase 8 together
3. Phase 2 (first session), with the first playtest round starting as soon
   as Phase 0's protocol exists
4. Phase 3 (presentation), once the stylesheet is consolidated
5. Phase 4 (content) and Phase 6 (learning fidelity) in parallel
6. Phase 5 (replayability)
7. Phase 7 (accessibility and localisation)
8. The rest of Phase 8 (release engineering) as the steady state

Roughly forty to fifty working sessions in all, plus the time of a
designer, a practitioner reviewer, a sound designer, a screen-reader
tester and three cohorts of five newcomers. The people are the long pole,
not the code.

## Keeping this document current

When a phase's exit criteria are met, record the date, the commit and the
measured numbers under its heading. When a criterion is changed, say why.
When a product boundary changes, move the affected item out of the
out-of-scope list and into a phase. `AGENTS.md` and `README.md` point here;
a reader of either should be able to find out what is next and why.
