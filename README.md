# Breach Command

Original charcoal-and-bone field-kit art accompanies the procedures, evidence
sources and six specialist roles. The 24 symbols share one transparent local
WebP atlas, with text labels retained and no game state encoded in the art.
See [the atlas guide](public/art/icons/README.md) for its layout and provenance.

Breach Command is a public, single-player incident-response card game played against a rule-based computer Incident Captain. Its scenarios, wording, characters, systems and presentation are original and fictional.

Play the current release at [breach-command.vercel.app](https://breach-command.vercel.app).
Release **0.9.47**: see the [release notes](CHANGELOG.md#0947-17-october-2026).

The title artwork fills the viewport on desktop, iPad and phone, cropping its edges as needed. Tall phones slightly trim the embedded logo's outer edges. The entry button and release/build label remain within the screen's safe area as browser controls resize the view.

The home page opens with the supplied Breach Command incident-command artwork: landscape on wide screens and portrait on tall screens. The bottom-left of the artwork shows the current release and build, matching the game footer. Select **Stop the Breach** to reach the incident desk at `/play`, where you can begin or resume an operation. You can bookmark `/play` to open the desk directly. Both entry pages remain available offline after visiting the desk; theme images are decorative and load separately from the game.

The entry link floats near the bottom centre of the picture with a semi-transparent background, hover feedback and a visible keyboard-focus outline. Its explanatory description remains available to screen readers.

The incident desk uses a compact two-line version of the supplied Breach Command wordmark in the desk's warm bone and charcoal palette. The tiny tagline is omitted for legibility; a missing image restores the original text, including when it fails before the page becomes interactive. The transparent local WebP is about 56 KB, and the home link retains its accessible name.

**Captain voice:** hear case-specific mission openings across all ten incidents,
investigation updates, guidance at each response phase and closing assessments.
The 65 recorded clips cover confirmed findings, unsuccessful checks, uncertain
signals, new developments and service pressure. Voice is on by default, using bundled recordings of a
calm male Captain with a British English voice. An explicit saved Off setting is
respected. Every spoken line is also readable, with Listen and Skip voice
controls; unavailable speech never blocks play. Music and sound cues quiet
while the Captain speaks. M mutes voice, music and cues together. Bot Commander
practice runs remain silent. Routine finding cues play automatically at most once per operation;
each newly recorded evidence choice can receive one tradeoff acknowledgement,
without replaying on resume. Response captions describe the chosen option's
published residual risk, with Listen available while the next decision is pending.
Listen can replay a line, so repeated checks do not cause repeated chatter.
Opening the after-action review plays a short spoken debrief: the actual
recovery grade or loss cause, a well-assessed evidence decision or supported
strength, and one improvement grounded in the record. The three clips play in
sequence using the same voice and media element, with complete captions and
whole-debrief replay or skip. A finished operation is required; play never waits
for the narration. Printed reviews omit the spoken transcript.

Routine commentary waits for 1.5 seconds without pointer, keyboard or wheel
input and pauses while an evidence or response decision is pending. Listen is
still available during those choices. Urgent pressure warnings and operation
losses take priority after 300 ms and may interrupt routine speech. Skip,
closing the view, muting or hiding the tab cancels queued speech as well as
playback.

`components/game/captain-voice-lazy.tsx` loads voice only when enabled;
`components/game/captain-voice.tsx` owns the transcript and controls,
`lib/captain-update.ts` selects updates from public findings and meter crossings,
and `lib/captain-speech.ts` handles recorded audio playback, cancellation and
failure. The preference stays in the existing device-local settings record;
the game and saved-session schemas are unchanged. Audio provenance and the exact
recorded scripts are in `public/audio/captain/README.md` and `manifest.json`.
`scripts/render-captain-voice.py` regenerates changed scripts offline; it is a
maintainer tool and adds no runtime dependencies.
`lib/captain-debrief.ts` selects the recorded review only after an operation ends
and loads with the optional voice player.

## What the player does

The player takes command of one of ten fictional cyber incidents. Each operation requires the player to:

1. Form a working hypothesis about the intrusion path.
2. Focus, monitor or isolate infrastructure nodes while tracing trust relationships.
3. Choose the scope and intensity of the action.
4. Reveal four hidden attack stages before the investigation window closes.
5. Balance evidence preservation, intervention and essential-service continuity.
6. Assess selected findings as causal or coincidental, then test that judgement.
7. Declare and revise a case theory for the adversary objective, then test it against causal evidence.
8. Execute containment, assurance and recovery decisions, then review the reconstructed incident.

The Investigate column keeps a standing summary of what the team already knows — the incident timeline, the observations the captain has released, the stages confirmed so far and the one signal still unverified — so an operation above Training, where the teaching prompts stop, does not open on four routes and nothing else.

Every turn ends in the captain's report unless fast resolution is switched on, and a check that completed without exposing a stage says what it settled: which of the declared reading's sources have now come back empty, and whether that reading is holding, weakening or poorly supported. A failed roll settles nothing and says so.

Hypothesis accuracy credits the reasoning, not only the answer. A turn scores in full when the declared reading matched the stage under test, and half when the reading was wrong but properly tested — one of its own evidence sources spent and the check completed — which rules that reading out. The half is paid once per reading, so revising is rewarded and returning to a reading whose sources came back empty is not.

The working hypothesis carries a standing readout built from the player's own results. Every completed check that finds nothing rules out each technique its source could have seen, so among the techniques the scenario can use at the stage under test, the readout counts how many of the declared route's have been ruled out and whether it is holding, weakening or poorly supported. A route with nothing left open is poorly supported, and in measurement that call has never been wrong. The game says so during the operation rather than only in the review.

Before committing an action the interface names what it buys — whether it tests the hypothesis you have declared, merely collects, or tests nothing because no hypothesis is recorded — and how many times that source has already been spent without exposing a stage. The roll's modifier can be expanded into its parts. All of it is built from what the player has already declared or seen, and the roll resolves with exactly the modifier shown. Testing the declared reading with one of its own sources earns a +1 own-source bonus whether or not the reading is right; being right is rewarded by the stages it reveals and by the hypothesis score after the operation.

Procedure checks use a d20, but evidence-led reasoning now carries more weight than tool familiarity. A procedure that is one of the declared reading's own sources adds +1, shown before the roll whichever reading turns out to be right; established procedures and specialist familiarity add their own visible bonuses, and correctness is rewarded where it belongs, by finding the stage. A used procedure is unavailable for the next two turns at Training and three elsewhere, counted down on its own card, while failed actions, actor tempo and sector pressure can end an operation before the chain is found. An action that tested the right route with one of that route's own evidence sources and still failed the roll costs the team nothing in tempo: reasoning is protected, certainty is not. Two failed rolls in a row add a visible persistence bonus to the next action, which clears as soon as one lands, so an operation is not decided by the dice alone.

## Major systems

- **Ten sector scenarios:** enterprise IT, healthcare, energy, maritime, cloud, shared services, government, telecommunications, water and financial clearing.
- **Graduated sector decisions:** every sector crisis offers a decisive measure, a narrow one and a permissive one — reset only the exposed accounts, move only the affected clinical lane, require out-of-band approval above a lowered threshold — because a real incident is rarely a choice between stopping and carrying on. The narrow measure protects less than the decisive one and keeps more of the service running, and it still costs something, so it is a trade rather than a free middle.
- **Chains a sector could not lend to another:** every scenario draws on techniques no other scenario can, so a settlement incident runs approver takeover, entitlement widening, payment-support tampering and reconciliation suppression rather than a generic compromise under a banking headline.
- **Sector-specific response trade-offs:** containment, assurance and recovery each cost what they would cost in that sector. Accepting assurance without re-proving the boundary is a reasonable call where independent instrumentation or manual supervision exists, and close to indefensible where the control being skipped is the one under investigation — so the same shortcut is worth a third as much in a clearing house as on a treatment plant.
- **One investigative action per sector:** alongside the eleven shared procedures, each scenario offers a reconciliation only that sector would run — manifest and berth reconciliation, work order validation, historian reconciliation, approval and settlement reconstruction — and it earns the planning bonus when the declared reading matches it.
- **Eleven shared procedures, every one inside the reasoning system:** each is predicted by at least one working hypothesis and every technique can be reached through its own route, so no evidence source is reduced to a lucky find.
- **Ninety-six original techniques:** twenty-four per stage, each with its own detectable evidence sources, so every incident draws a different set of investigative procedures rather than the same rotation.
- **Three difficulty levels:** Training, Operational and Crisis. Training shortens the procedure cooldown by a turn so a beginner is rarely left without a source their reading predicts, and erodes the sector's own margin a point a turn more slowly; once that margin is low enough to end the operation within a few turns, every workspace says so. The investigation window is 12, 11 and 10 turns. Every stage offers four techniques across at least three routes, so a reading has to be tested rather than read off the options. Crisis is a different operation rather than the same one with tighter numbers: one fewer command action, an adversary objective that is already moving and advances faster every turn, and an adversary that, on its own escalation beat, re-routes the stage after the one you are working instead of waiting to be pressed — it adapts ahead of the investigation without wiping out what you have already ruled out.
- **Six modes:** Campaign, Daily Operation, Weekly Operation, Ironman, Escalation and Expert. Every mode's result counts toward the campaign (the others with an experience multiplier), but only Campaign operations are shaped by campaign standing; the mode picker says which. Daily Operation is today's case, the same for every commander; Weekly Operation is one case at Operational on one seed from Monday to Sunday (UTC), so a week's results compare by its code. A win in Expert has its own ending and marks the case.
- **Local Bot Commander:** an optional visible-evidence operator can run a complete practice incident, explain its current intent, pause on request and hand control back without writing saves, campaign rewards or balance telemetry. It revises its reading when the record rules it out, as the game asks a player to. It prioritises available sources that can test that reading at the current stage, using the same public coverage information as the cards; when they are all cooling down, broad collection remains available.
- **Distinct adaptive adversaries:** recurring threat groups have signature mechanics, learn from procedure use, hypotheses and command posture, and can move to less-exposed routes.
- **Progressive attribution:** threat-group identity is withheld until the evidence supports behavioural, suspected, probable and attributed confidence levels.
- **Focused command workspace:** Command, Investigate and Briefing views keep the immediate decision, analytical work and supporting context separate without removing information. The three readouts that decide an operation — business impact, service integrity and adversary progress — sit together above the workspaces, and the investigation window reads as context under the incident title. First-time guidance names the next move and links directly to the relevant workspace. Guidance is tiered: guided reflection offers strategic prompts and Expert disables guidance entirely. Training prompts the next step in the reasoning — record a reading, test it with one of its own evidence sources, revise it when those sources come back empty, compare two findings once you hold them — and surfaces the observation behind the next unconfirmed stage so the opening hypothesis is a judgement rather than a guess. It never names the source to click, so it cannot contradict what the cards say.
- **Playable infrastructure command maps:** each incident has its own topology of four to seven nodes, a distinct trust-edge set, its own documented critical dependency and scarce monitoring and isolation actions with post-recovery state.
- **Living incident presentation:** visible propagation, node posture, sector conditions, adaptive specialist transmissions and sector-specific ambient scoring respond to the operation. Healthcare, energy and telecommunications incidents also include dedicated live operating views for clinical services, engineering margins and routing domains.
- **Evidence workspace:** successful actions build a timeline. Players declare an objective theory, select findings, judge the relationship as causal or coincidental, and receive consequences for unsupported inference.
- **Signal and confidence:** findings distinguish direct stage evidence from support for its causal interpretation. Exhaustive collection and supported comparisons across different sources strengthen confidence; Training teaches all four combinations. The same assessment appears before command decisions and in the review. Reports keep both labels and the causal-limit warning visible, with the longer confidence basis available in a disclosure. See [the model](docs/design/SIGNAL-CONFIDENCE.md).
- **Scannable Captain reports:** the result, tested stage and confirmed stages lead the report. A response index names every choice and moves keyboard focus to its full description and exact costs without choosing it. Roll, plan and turn-effect details open on request; captions and Listen stay visible. Failed checks explicitly rule nothing out and list available sources that can test the current reading, using public coverage only. Expert withholds that source guidance.
- **Progressive learning:** the working reading leads with the current stage question. Training keeps case theory available in a fold until two stages are confirmed and introduces comparison controls once two findings exist. Evidence responses show a short tradeoff and exact costs, with longer rationale available separately. A recorded response leads its report with actual meter directions and numerical changes. See the [information-load roadmap](docs/design/INFORMATION-LOAD.md).
- **Confidence feedback:** a comparison that strengthens confidence briefly highlights affected findings and names the supporting sources. An optional recorded Captain line explains the change, with captions, replay and skip. Reduced motion keeps the text without the animation; resumed comparisons stay quiet.
- **Linked evidence and source reviews:** selected findings preview an untested connection; tested links retain their supported, disputed or no-causal-link status and explanation. Specialist portraits identify source-review expertise without changing the on-call bonus or Captain narration.
- **State colors:** muted blue marks selected evidence and untested connections; teal marks supported assessments, strong confidence and stable services; amber marks weak confidence, disputed links or degraded services; coral marks critical states. Signal strength stays neutral and separately labelled. Words, icons and connection stroke patterns remain, with dark state inks on paper and high-contrast support.
- **Five decision verbs:** every confirmed technique offers observe, act, attribute, contain and notify. Each verb moves the operational picture by its own terms across impact, continuity, sector condition, adversary tempo and objective progress, and the after-action review records the exact consequence of the chosen verb.
- **Operational decisions:** technique decisions, twenty-six command events, a twenty-card inject deck and three crises per sector change pressure, continuity, sector condition and actor progress. Eight adversary profiles each punish a different habit, and a campaign remembers the beats it met recently so an act does not repeat them. The campaign's three acts open with a director's briefing and a development keyed to the route, its ending states the command's own record, and each specialist develops with rapport: a request, a disagreement, a change of role.
- **Mechanically distinct sector systems:** every sector combines its own base loss, tempo weighting, containment cost and recovery terms, so the same action has different consequences from one incident to the next.
- **Persistent command team:** six named specialists have distinct capabilities, callsigns, fatigue, cohesion and after-action reactions. The team rests between operations — a benched specialist recovers faster than the one on duty — and the deployment screen says when the chosen specialist is too tired for their bonus.
- **Branching campaign director:** command posture, trust and completed operations select Watchtower, Breakwater, Common Ground or Convergence routes. Routes alter starting conditions and mission priorities.
- **Authored incident variants:** each of the ten scenarios has five operational variants with distinct briefings and starting pressure, and the campaign route selects between them, so a route change produces a different operation.
- **Resolved endings:** a win stands the incident down, a loss closes the record naming which of the five endings occurred — the adversary's objective, business impact, service continuity, sector confidence or the investigation window — with the unresolved stages noted, and an authorised exercise stops at the drill boundary. Each is a distinct presentation rather than one banner with different text. The exercise is a conclusion the investigation earns: it can only be reached once at least two stages are confirmed, and because nothing was missed it costs no leadership trust, breaks no streak, leaves no unresolved access and clears the case in the campaign as a win does.
- **Three-stage response:** containment is followed by an assurance gate and deliberate recovery, with isolated infrastructure restored only after the response completes. Containment, assurance and recovery options are authored per sector, so disruption, service cost and residual risk reflect the incident's own constraint while the strict three-stage sequence is preserved. The evidence decision after each confirmed stage is worded in the sector's own terms — who is notified, what keeps running — and acting now costs the sector margin what its own isolations cost it.
- **Three-act campaign:** progression tracks experience, trust, readiness, unresolved access, mastery, team cohesion and command doctrine, leading to one of four endings. Standing changes what an operation has to work with — established sources, command actions, the investigation window, and a rapid-coordination grace that absorbs one unlucky action — while unresolved access, lost leadership trust and low readiness each take something away. Seniority follows results, so a command that keeps losing does not reach the tier of one that keeps winning.
- **Challenge codes:** compact `BC9-...` codes reproduce a scenario, difficulty, mode, specialist and random seed. The number after `BC` is the content version: when a scenario's techniques change, the version moves on, and a code from an earlier one is refused with an explanation instead of quietly playing a different incident. A seeded operation replays its hidden chain and procedure rolls as well as its configuration, so the same code produces the same incident on any device. A loaded or generated code applies to the next operation begun and is then spent; ordinary campaign operations draw a fresh chain every time, so a restart never replays a chain the player has already seen. Every end state offers **Copy result**: the operation, outcome, score and stage count, with the challenge code when the operation was reproducible. It names no technique, so it spoils nothing for the next player.
- **Plain language throughout:** every meter change states its direction, field vocabulary carries a translation in the field guide, and the review opens with four plain sentences — what went well, what to look at, the idea behind it, one thing to try — before any scoring.
- **After-action review:** scoring, timelines, decision quality, evidence reconstruction, actor adaptation and counterfactuals support facilitated learning. The detail lists fold behind summaries that say what they hold, so the plain-language read and the score come first on a phone. A hypothesis ledger explains the accuracy score turn by turn — naming the route each stage actually used, and marking the turns where a shared source exposed something further along the chain than the one being tested — what was predicted, which stage it was tested against, whether the procedure could have exposed that stage, and why the turn did or did not score — and a sticky section index makes the long review navigable.
- **First move on the first screen:** on a phone the assignment screen opens with a quick-start strip that resumes the saved operation or starts the selected one, and a first operation defaults to Training. In play, Command leads with whatever is waiting for the player — a decision, the response, the ending — and the situation picture follows.
- **Accessible, responsive play:** dedicated phone, tablet and desktop layouts that recompose at nine width breakpoints, plus optional procedural sound, adaptive music, haptics, high contrast (applied to every dialog and sheet as well as the page), reduced motion and guided reflection. The single-key shortcuts — F field guide, M mute, G guided reflection — can be turned off in settings for speech-input users. `pnpm test:a11y` runs axe against the assignment screen, the overlays and the command workspace from 320 px to 1280 px and requires zero violations.
- **Offline and local-first play:** the installable PWA caches the page and the scripts and styles it references when it installs, so one visit is enough to play offline. Its cache is isolated to this game's namespace and published documents/assets; arbitrary endpoints, query variants, requests carrying an Authorization header and private responses are excluded. Sessions, campaign progress, settings and anonymous balance counters remain on the device. A browser that refuses local storage still plays a complete operation from memory and says so. Portable backup text can transfer progress without an account; imports validate nested records and have size, nesting and message-shape limits. CSV exports neutralise formula markers in imported fields.

Typography keeps condensed headings and figures distinct from regular-width prose. Body text is 16 px, supporting captions 14 px and compact metadata 12 px, including mobile pressure labels. Shared neutral text roles distinguish titles, reading text and secondary information; paper documents use dark inks. Status colours retain their labels and icons.

The first-operation academy asks players to test their reading and explains that a result may support or challenge it. Procedure labels describe own sources without claiming that an unrun check already supports the hypothesis.

Guided Training keeps the first two checks focused on choosing a working reading, testing it and interpreting the result. The opening defines "hypothesis" alongside that phrase and shows one academy lesson at a time. Map, specialist and evidence reference material starts folded on every screen size, with manual access throughout; desktop reference expands after two checks or when theory/comparison becomes useful. Reports show actual turn effects and why they occurred before optional roll calculations. Longer check explanations are available on request, while turn costs and exact plan effects remain visible. Guidance-off and Expert retain their usual reference layout.

The game does not call an AI service, inspect real systems or transmit incident information.

Artwork is decorative and local: source still lifes follow the procedure and
sector, object emblems accompany adversary intent in the review, and all four
campaign conclusions have scenes. Sector, act and ending scenes include 480 px
phone copies selected by responsive image attributes. Images fade in on the
dark desk, respect reduced motion, and remain empty frames if unavailable.
Saved result images include a muted sector scene, with the complete text form
as the fallback. Images are cached only once seen, never precached.

## Campaign and saves

Campaign progression is stored in browser local storage. Mid-operation sessions are versioned and migrated by `lib/session.ts`, which refuses a save from a newer build or one describing a state the engine's own transitions could not produce. A save from a newer build is never deleted or overwritten: it is set aside before anything else is saved, and a build that can read it offers it again. Only an operation still in progress is offered for resume; a finished operation's save is cleared. Ironman mode intentionally disables normal mid-operation saving. Clearing browser storage resets local progress. The balance record counts wins, losses and authorised exercises separately — an exercise is never recorded as a defeat.

After each operation the review suggests what to play next, from the record: a loss to the investigation window suggests the same case a rung lower, a loss to another meter the same case again, a strong win the next case a rung higher. The suggestion and the last operation are kept on the device (`lib/last-operation.ts`), and the landing page shows them to a returning player with a way to set the suggestion up.

Every storage access goes through `lib/storage.ts`, which answers rather than throws. In a private window, with site data blocked, or against a full quota the game reports that nothing is being kept and continues from memory. If a newer build's save cannot be parked, its original slot is preserved, the new operation stays in memory, and later writes retry parking before replacing or clearing that slot.

The settings panel can export a portable backup containing campaign progress and the current non-Ironman operation, including an operation awaiting resume on the assignment screen with its saved preferences. Finished operations and Bot Commander practice runs are left out. Restoring the text validates both halves before replacing anything: the campaign through `parseCampaign` and the operation through the same migration a local save goes through. An unreadable operation is reported and left out rather than stored, and a backup without a readable campaign is refused rather than restoring an empty one. A restored operation is offered for resume straight away; restored while another operation is in play, it replaces that one when the player returns to assignments. If storing the restored operation fails, the panel reports that progress is available for this visit only, even when the campaign was saved. Nested campaign counters are checked individually, and unknown pending command IDs are refused before resume.

A failed game-bundle download can be retried by beginning the operation again; successful and in-flight downloads remain shared. The lazy boundary exposes only the engine helpers used by the session and browser tool. Message catalogues group repeated namespaces and restore their existing translation keys at registration, reducing shipped script without removing wording or delaying offline support.

Daily Operation always plays the day's seed, and Weekly Operation the week's, unless a loaded code says otherwise, and challenge codes use their own, allowing the same configuration to be replayed or shared. All reproducible operations start from a neutral command: no inherited rank, fatigue, doctrine, readiness, trust or unresolved access, and the variant is derived from the seed on the Common Ground route. Local campaign history cannot change their setup or results. Ordinary unseeded operations retain campaign consequences. Current challenge codes use `BC9`; earlier codes are reported as outdated. Scenario mastery awards one star for a successful recovery, two for a score of 74 or above, and three for a score of 88 or above. Past that, each case has a mastery ladder of five rungs shown on its slip: won at Crisis, won without revising, won in half the window, won with a tired specialist, and won in Expert.

Accessibility is recorded criterion by criterion against WCAG 2.2 AA in `docs/accessibility.md`, with the tests that show each. The stylesheet is written in logical properties so a right-to-left locale needs only a catalogue, and interface strings are moving into the message catalogue in `lib/i18n/`; open the game with `?locale=en-XA` to see the catalogued strings accented and a third longer.

For a training room, `/educators` is the educator pack: a session plan, what each difficulty teaches, three sets of debrief questions and the vocabulary in plain words, linked from the field guide. The review prints a facilitator sheet for the trainer, with the whole hidden chain, each stage's MITRE ATT&CK technique, the turn ledger, the decisions and the questions that fit the outcome; every technique in the game maps to its nearest ATT&CK technique, shown in the review once the operation is over.

Every operation played to an end goes into a personal record on the device (`lib/ledger.ts`): the case, difficulty, mode, outcome, score, hypothesis accuracy and challenge code. The landing page shows hypothesis accuracy over the last ten operations against the ten before, and the record downloads as a CSV and travels in the backup. The ending's **Save image** draws the result on the device as a PNG in the case-file style, from the same counts as Copy result, never a technique. A reproducible operation's review offers to replay it with the Bot Commander, on the same seed, variant and route, as a practice run that records nothing.

## Roadmap

`docs/ROADMAP.md` is the improvement plan towards AAA: what that bar means for a browser tabletop game with no backend, where the project stands, and eight phases — instruments, foundation, first session, presentation, content depth, replayability, learning fidelity, accessibility and localisation, release engineering — each with measurable exit criteria.

## Run locally

Requirements:

- Node.js 22.13 or newer
- pnpm 11.25

Install and start the development server:

```bash
pnpm install
pnpm dev
```

Run the verification suite. GitHub Actions (`.github/workflows/verify.yml`) runs it on every push to `main` and every pull request, with the browser suites against a production build:

```bash
pnpm test
pnpm security:audit    # fail on new advisories; one bounded lint-tool exception
pnpm test:responsive:install # first run only; or set PLAYWRIGHT_CHROMIUM_EXECUTABLE to an installed Chromium
pnpm test:responsive
pnpm test:a11y
pnpm test:persistence
pnpm test:visual       # check pixel baselines; record updates on a GitHub runner
pnpm test:performance  # script, style and paint budgets on a throttled phone
pnpm test:browsers     # adds WebKit and Firefox where installed
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

The [security review](docs/SECURITY-REVIEW.md) records the reviewed boundaries,
production header policy and the one unfixed development-only lint advisory.
The audit gate rejects new findings and a newly published fix for that exception.
Imported message identifiers reject template syntax; unknown identifiers stay
literal, and recursive rendering has a fixed output limit to prevent text
amplification from a small backup.
pnpm's seven-day release-age limit and Dependabot's matching npm cooldown keep
new package releases out of automatic updates until they have aged seven days.

After a deliberate visual change, use the
[Record visual baselines workflow](.github/workflows/visual-baselines.yml).
It records on the same GitHub runner used for comparison and writes to
`ci/visual-baselines`. Review every changed image before bringing the baselines
into the change; local font rendering can differ from the runner.

`pnpm balance:check` is the smoke version CI runs: 600 seeded operations per difficulty and 300 campaigns, failing by name if a figure moves more than three points from `scripts/balance-expected.json`. `pnpm validate:content` runs the content tests alone for authors, and `pnpm new-scenario <slug>` scaffolds a new sector's tables (`docs/CONTENT.md`). Releases follow `docs/RELEASING.md`: the version in `package.json`, an entry in `CHANGELOG.md`, and a tag once Verify passes on `main`.

Measure balance before and after a rule change. `pnpm balance` has the Bot Commander play 3,000 seeded operations per difficulty from visible evidence alone and reports win, loss and exercise rates, average score and hypothesis accuracy, and what ended each lost operation. It also reports each scenario separately and fails if an operation does not finish. The seeds are fixed, so two runs play the same incidents; `pnpm balance 300 2` measures a command at campaign tier 2. It also prints each adversary profile's win rate. `pnpm repetition` plays simulated ten-case campaigns through `recordCampaignResult` and reports how often a command event, inject or sector crisis repeats within an act; `pnpm repetition 1000 forget` plays without the campaign's memory of recent beats.

The terminal's schedule erosion was reduced after comparing collection, evidence-decision, sector-decision and specialist strategies. Its deadline still accelerates from turn four and adversary tempo still counts double. The [terminal balance review](docs/design/TERMINAL-BALANCE.md) records that tuning with the earlier bot policy. A later [government-service audit](docs/design/AUTHORITY-BALANCE.md) found that the bot was wasting turns on sources blind to its current reading. Correcting that policy, without changing any game rules, gives 95.9% / 88.9% / 73.7% wins across Training, Operational and Crisis in the default 9,000-operation run. These are results for a stronger bot on standard incidents, not a human completion target or evidence that difficulty was reduced.

`pnpm test` runs the engine suites under `node --test` — one file per concern, so a failure reports rather than stopping the run — with deterministic rule checks and 1,290 complete simulated operations across scenarios, difficulties, modes, specialists and the Bot Commander. `pnpm test:responsive` drives a deterministic practice operation through assignment, investigation, decisions, containment, assurance, recovery and debrief at every supported phone, iPad and desktop audit width. It also checks horizontal fit, essential target size, pause/resume and manual takeover. `pnpm test:a11y` runs an axe audit over the assignment screen at every supported width and over the field guide, settings and command surfaces at a phone width; the narrow widths matter because the topbar hides its button labels below 431 px.

## Architecture

| Path | Responsibility |
| --- | --- |
| `app/page.tsx` | Illustrated title page with Stop the Breach leading to `/play` |
| `components/game/incident-app.tsx` | Application shell: topbar, workspace switch, live regions and overlay mounting |
| `hooks/use-game-session.ts` | Game, session and campaign state, every transition, effect and derived readout |
| `hooks/use-preferences.ts` | Audio, haptics and contrast, loaded once and persisted after |
| `hooks/use-recover-focus.ts` | Focus recovery and investigation navigation; deferred recovery preserves a control the player has already focused |
| `hooks/use-challenge-code.ts` | Seed, challenge code and whether the operation is reproducible |
| `lib/operation-setup.ts` | Starting resources and variants, neutral for shared challenges and campaign-derived for ordinary operations |
| `app/globals.css`, `components/game/game.css` | Assignment styles linked by the page, and game styles loaded with the game bundle. Charcoal and bone with semantic state colors, flat ruled panels, paper documents with form cells and a redacted evidence sheet; motion and responsive layouts |
| `app/fonts/` | Self-hosted IBM Plex Sans Condensed for headings and figures, loaded through `next/font/local` |
| `components/game/` | Workspaces, gameplay boards, maps, dialogs, end states and the tutorial |
| `components/ui/` | The interface primitives the game actually imports |
| `lib/game.ts` | Scenario, procedure and attack data |
| `lib/advanced-game.ts` | The engine's public surface: game state, transitions, adaptive adversary and scoring |
| `lib/engine/` | The engine, split into content, types, shared rules, play-time reads, transitions and the review |
| `lib/game-bot.ts` | Visible-evidence Bot Commander policy and action selection |
| `lib/command-systems.ts` | Modes, specialists, procedure plans, objectives and sector rules |
| `lib/phase8.ts` | Infrastructure topologies, named team, set pieces and challenge codes |
| `lib/phase9.ts` | Campaign routes, incident variants, objective theories and team reactions |
| `lib/campaign.ts` | Persistent progression, acts, mastery and endings |
| `lib/session.ts` | Versioned save format, migration and save rejection |
| `lib/storage.ts` | Non-throwing local-storage access |
| `lib/feedback.ts` | Audio and haptic feedback, loaded on first use through `lib/feedback-lazy.ts` |
| `components/game/fault-boundary.tsx` | Keeps a render fault inside its workspace or dialog, with a copyable diagnostic |
| `lib/telemetry.ts` | Device-local balance counters |
| `lib/diagnostics.ts` | Copy diagnostics in Settings: build, browser and storage state for a bug report, nothing personal |
| `lib/i18n/` | The message catalogue: English as the source of truth, `Intl` plurals and numbers, and the pseudo-locale `en-XA` (`?locale=en-XA`) for testing longer strings |
| `lib/educators.ts` | The debrief question sets and what each difficulty teaches, for the educator pack at `/educators` and the facilitator sheet |
| `lib/ledger.ts` | The personal record of every operation, its trend and CSV export |
| `lib/share-image.ts` | The result image, drawn on a canvas on the device and loaded only when asked for |
| `lib/last-operation.ts` | The last operation and the review's suggested next one, kept on the device for a returning player |
| `tests/*.test.ts` | Engine, campaign, reads, session, content and simulation suites (`node --test`) |
| `tests/saves.test.ts` | A save from every session version since 10 migrates and plays on |
| `tests/e2e/visual.spec.ts` | Pixel baselines for game screens, evidence connections, campaign states and Captain acknowledgements at four widths |
| `tests/e2e/performance.spec.ts` | Script, style, paint and layout-shift budgets on a throttled phone |
| `tests/e2e/responsive-game.spec.ts` | Cross-width browser interaction and overflow audit |
| `tests/e2e/accessibility.spec.ts` | Cross-width axe accessibility audit |
| `tests/e2e/persistence.spec.ts` | Stored settings survive a load and a reload |
| `tests/e2e/keyboard.spec.ts` | Initial focus in overlays, focus recovery and switchable shortcuts |
| `tests/e2e/keyboard-playthrough.spec.ts` | A whole operation, won and lost, played with the keyboard alone, with axe on each surface |
| `playwright.config.ts` | Deterministic Chromium test runner and local preview lifecycle |

The interface is built with Next.js 16, React 19 and TypeScript and deployed as a native Next.js application on Vercel.

## Contributing and documentation

For human first-session testing, use the [newcomer round guide](docs/playtests/README.md),
[observer protocol](docs/playtests/PROTOCOL.md) and [blank results sheet](docs/playtests/TEMPLATE.md).
They cover five newcomers across phone and laptop, plus signal/confidence
understanding and Captain voice pacing. Supplemental questions come after the
original questions and are scored separately. The pack is ready to use; human
sessions must supply the results.
Guided reflection ships ON; fast resolution and high contrast ship OFF. The
observer records both assignment arrival and operation opening: the first-session
target uses assignment-to-first-resolved-result time, while local telemetry uses
operation-start-to-first-resolved-result time. Compare matching anchors only.

Review both this README and [`AGENTS.md`](AGENTS.md) against every final change,
including follow-up fixes. Update affected feature descriptions, commands,
requirements, architecture and contributor guidance in the same commit or pull
request as the implementation. The
[pull request checklist](.github/pull_request_template.md) records both reviews;
if a file needs no update, explain why its current documentation remains accurate.
Keep these documents current rather than treating them as changelogs.

`AGENTS.md` also records the game-engine invariants and required verification.

## Limits

This project is a learning simulation. Its outcomes are not a security assessment, certification or evidence of regulatory compliance.
