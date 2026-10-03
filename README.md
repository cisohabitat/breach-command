# Breach Command

Breach Command is a public, single-player incident-response card game played against a rule-based computer Incident Captain. It is an unofficial adaptation inspired by the investigation structure of Backdoors & Breaches, using original scenarios, wording, characters, systems and presentation.

Play the current release at [breach-command.vercel.app](https://breach-command.vercel.app).

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

The working hypothesis carries a standing readout built from the player's own results: how many of that reading's evidence sources have been spent since the last confirmation, and whether it is holding, weakening or poorly supported. Absence across a reading's own sources is evidence against it, and the game says so during the operation rather than only in the review.

Before committing an action the interface names what it buys — whether it tests the hypothesis you have declared, merely collects, or tests nothing because no hypothesis is recorded — and how many times that source has already been spent without exposing a stage. The roll's modifier can be expanded into its parts. All of it is built from what the player has already declared or seen; the planning bonus stays hidden until the roll, because showing it would answer the question under investigation.

Procedure checks use a d20, but evidence-led reasoning now carries more weight than tool familiarity. Correct hypotheses receive a larger bonus than established procedures or specialist familiarity. A used procedure is unavailable for the next two turns at Training and three elsewhere, counted down on its own card, while failed actions, actor tempo and sector pressure can end an operation before the chain is found. An action that tested the right route with one of that route's own evidence sources and still failed the roll costs the team nothing in tempo: reasoning is protected, certainty is not. Two failed rolls in a row add a visible persistence bonus to the next action, which clears as soon as one lands, so an operation is not decided by the dice alone.

## Major systems

- **Ten sector scenarios:** enterprise IT, healthcare, energy, maritime, cloud, shared services, government, telecommunications, water and financial clearing.
- **Graduated sector decisions:** every sector crisis offers a decisive measure, a narrow one and a permissive one — reset only the exposed accounts, move only the affected clinical lane, require out-of-band approval above a lowered threshold — because a real incident is rarely a choice between stopping and carrying on.
- **Chains a sector could not lend to another:** every scenario draws on techniques no other scenario can, so a settlement incident runs approver takeover, entitlement widening, payment-support tampering and reconciliation suppression rather than a generic compromise under a banking headline.
- **Sector-specific response trade-offs:** containment, assurance and recovery each cost what they would cost in that sector. Accepting assurance without re-proving the boundary is a reasonable call where independent instrumentation or manual supervision exists, and close to indefensible where the control being skipped is the one under investigation — so the same shortcut is worth a third as much in a clearing house as on a treatment plant.
- **One investigative action per sector:** alongside the eleven shared procedures, each scenario offers a reconciliation only that sector would run — manifest and berth reconciliation, work order validation, historian reconciliation, approval and settlement reconstruction — and it earns the planning bonus when the declared reading matches it.
- **Eleven shared procedures, every one inside the reasoning system:** each is predicted by at least one working hypothesis and every technique can be reached through its own route, so no evidence source is reduced to a lucky find.
- **Ninety-six original techniques:** twenty-four per stage, each with its own detectable evidence sources, so every incident draws a different set of investigative procedures rather than the same rotation.
- **Three difficulty levels:** Training, Operational and Crisis. Training shortens the procedure cooldown by a turn so a beginner is rarely left without a source their reading predicts. Crisis is a different operation rather than the same one with tighter numbers: one fewer command action, an adversary objective that is already moving and advances faster every turn, and an adversary that re-routes the next unrevealed stage on its own escalation beat instead of waiting to be pressed.
- **Five modes:** Campaign, Daily Operation, Ironman, Escalation and Expert.
- **Local Bot Commander:** an optional visible-evidence operator can run a complete practice incident, explain its current intent, pause on request and hand control back without writing saves, campaign rewards or balance telemetry.
- **Distinct adaptive adversaries:** recurring threat groups have signature mechanics, learn from procedure use, hypotheses and command posture, and can move to less-exposed routes.
- **Progressive attribution:** threat-group identity is withheld until the evidence supports behavioural, suspected, probable and attributed confidence levels.
- **Focused command workspace:** Command, Investigate and Briefing views keep the immediate decision, analytical work and supporting context separate without removing information. The three readouts that decide an operation — business impact, service integrity and adversary progress — sit together above the workspaces, and the investigation window reads as context under the incident title. First-time guidance names the next move and links directly to the relevant workspace. Guidance is tiered: guided reflection offers strategic prompts and Expert disables guidance entirely. Training prompts the next step in the reasoning — record a reading, test it with one of its own evidence sources, revise it when those sources come back empty, compare two findings once you hold them — and surfaces the observation behind the next unconfirmed stage so the opening hypothesis is a judgement rather than a guess. It never names the source to click, so it cannot contradict what the cards say.
- **Playable infrastructure command maps:** each incident has its own topology of four to seven nodes, a distinct trust-edge set, its own documented critical dependency and scarce monitoring and isolation actions with post-recovery state.
- **Living incident presentation:** visible propagation, node posture, sector conditions, adaptive specialist transmissions and sector-specific ambient scoring respond to the operation. Healthcare, energy and telecommunications incidents also include dedicated live operating views for clinical services, engineering margins and routing domains.
- **Evidence workspace:** successful actions build a timeline. Players declare an objective theory, select findings, judge the relationship as causal or coincidental, and receive consequences for unsupported inference.
- **Five decision verbs:** every confirmed technique offers observe, act, attribute, contain and notify. Each verb moves the operational picture by its own terms across impact, continuity, sector condition, adversary tempo and objective progress, and the after-action review records the exact consequence of the chosen verb.
- **Operational decisions:** technique decisions, command events and a unique sector crisis change pressure, continuity, sector condition and actor progress.
- **Mechanically distinct sector systems:** every sector combines its own base loss, tempo weighting, containment cost and recovery terms, so the same action has different consequences from one incident to the next.
- **Persistent command team:** six named specialists have distinct capabilities, callsigns, fatigue, cohesion and after-action reactions.
- **Branching campaign director:** command posture, trust and completed operations select Watchtower, Breakwater, Common Ground or Convergence routes. Routes alter starting conditions and mission priorities.
- **Authored incident variants:** each of the ten scenarios has five operational variants with distinct briefings and starting pressure, and the campaign route selects between them, so a route change produces a different operation.
- **Resolved endings:** a win stands the incident down, a loss closes the record naming which of the five endings occurred — the adversary's objective, business impact, service continuity, sector confidence or the investigation window — with the unresolved stages noted, and an authorised exercise stops at the drill boundary. Each is a distinct presentation rather than one banner with different text. The exercise is a conclusion the investigation earns: it can only be reached once at least two stages are confirmed, and because nothing was missed it costs no leadership trust, breaks no streak and leaves no unresolved access.
- **Three-stage response:** containment is followed by an assurance gate and deliberate recovery, with isolated infrastructure restored only after the response completes. Containment, assurance and recovery options are authored per sector, so disruption, service cost and residual risk reflect the incident's own constraint while the strict three-stage sequence is preserved.
- **Three-act campaign:** progression tracks experience, trust, readiness, unresolved access, mastery, team cohesion and command doctrine, leading to one of four endings. Standing changes what an operation has to work with — established sources, command actions, the investigation window, and a rapid-coordination grace that absorbs one unlucky action — while unresolved access, lost leadership trust and low readiness each take something away. Seniority follows results, so a command that keeps losing does not reach the tier of one that keeps winning.
- **Challenge codes:** compact `BC-...` codes reproduce a scenario, difficulty, mode, specialist and random seed. A seeded operation replays its hidden chain and procedure rolls as well as its configuration, so the same code produces the same incident on any device. A loaded or generated code applies to the next operation begun and is then spent; ordinary campaign operations draw a fresh chain every time, so a restart never replays a chain the player has already seen.
- **Plain language throughout:** every meter change states its direction, field vocabulary carries a translation in the field guide, and the review opens with four plain sentences — what went well, what to look at, the idea behind it, one thing to try — before any scoring.
- **After-action review:** scoring, timelines, decision quality, evidence reconstruction, actor adaptation and counterfactuals support facilitated learning. A hypothesis ledger explains the accuracy score turn by turn — naming the route each stage actually used, and marking the turns where a shared source exposed something further along the chain than the one being tested — what was predicted, which stage it was tested against, whether the procedure could have exposed that stage, and why the turn did or did not score — and a sticky section index makes the long review navigable.
- **Accessible, responsive play:** dedicated phone, tablet and desktop layouts that recompose at nine width breakpoints, plus optional procedural sound, adaptive music, haptics, high contrast (applied to every dialog and sheet as well as the page), reduced motion and guided reflection. The single-key shortcuts — F field guide, M mute, G guided reflection — can be turned off in settings for speech-input users. `pnpm test:a11y` runs axe against the assignment screen, the overlays and the command workspace from 320 px to 1280 px and requires zero violations.
- **Offline and local-first play:** the installable PWA caches core assets, and only complete same-origin responses are ever cached. Sessions, campaign progress, settings and anonymous balance counters remain on the device. A browser that refuses local storage still plays a complete operation from memory and says so. Portable backup text can transfer progress without an account.

The game does not call an AI service, inspect real systems or transmit incident information.

## Campaign and saves

Campaign progression is stored in browser local storage. Mid-operation sessions are versioned and migrated by `lib/session.ts`, which refuses a save from a newer build or one describing a state the engine's own transitions could not produce. A save from a newer build is left in place rather than deleted, so an older offline bundle cannot destroy it. Only an operation still in progress is offered for resume; a finished operation's save is cleared. Ironman mode intentionally disables normal mid-operation saving. Clearing browser storage resets local progress. The balance record counts wins, losses and authorised exercises separately — an exercise is never recorded as a defeat.

Every storage access goes through `lib/storage.ts`, which answers rather than throws. In a private window, with site data blocked, or against a full quota the game reports that nothing is being kept and continues from memory.

The settings panel can export a portable backup containing campaign progress and the current non-Ironman operation. Restoring the text validates both halves before replacing anything: the campaign through `parseCampaign` and the operation through the same migration a local save goes through. An unreadable operation is reported and left out rather than stored, and a backup without a readable campaign is refused rather than restoring an empty one. A restored operation is offered for resume straight away; restored while another operation is in play, it replaces that one when the player returns to assignments.

Daily Operation always plays the day's seed unless a loaded code says otherwise, and challenge codes use their own, allowing the same configuration to be replayed or shared. Scenario mastery awards one star for a successful recovery, two for a score of 74 or above, and three for a score of 88 or above.

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
pnpm test:responsive:install # first run only; or set PLAYWRIGHT_CHROMIUM_EXECUTABLE to an installed Chromium
pnpm test:responsive
pnpm test:a11y
pnpm test:persistence
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Measure balance before and after a rule change. `pnpm balance` has the Bot Commander play 3,000 seeded operations per difficulty from visible evidence alone and reports win, loss and exercise rates, average score and hypothesis accuracy, and what ended each lost operation. The seeds are fixed, so two runs play the same incidents; `pnpm balance 300 2` measures a command at campaign tier 2.

`pnpm test` runs the engine suites under `node --test` — one file per concern, so a failure reports rather than stopping the run — with deterministic rule checks and 1,230 complete simulated operations across scenarios, difficulties, modes, specialists and the Bot Commander. `pnpm test:responsive` drives a deterministic practice operation through assignment, investigation, decisions, containment, assurance, recovery and debrief at every supported phone, iPad and desktop audit width. It also checks horizontal fit, essential target size, pause/resume and manual takeover. `pnpm test:a11y` runs an axe audit over the assignment screen at every supported width and over the field guide, settings and command surfaces at a phone width; the narrow widths matter because the topbar hides its button labels below 431 px.

## Architecture

| Path | Responsibility |
| --- | --- |
| `app/page.tsx` | Application shell: topbar, workspace switch, live regions and overlay mounting |
| `hooks/use-game-session.ts` | Game, session and campaign state, every transition, effect and derived readout |
| `hooks/use-preferences.ts` | Audio, haptics and contrast, loaded once and persisted after |
| `hooks/use-challenge-code.ts` | Seed, challenge code and whether the operation is reproducible |
| `app/globals.css` | Tactical visual system, motion and responsive layouts |
| `components/game/` | Workspaces, gameplay boards, maps, dialogs, end states and the tutorial |
| `components/ui/` | The interface primitives the game actually imports |
| `lib/game.ts` | Scenario, procedure and attack data |
| `lib/advanced-game.ts` | Game state, transitions, adaptive adversary and scoring |
| `lib/game-bot.ts` | Visible-evidence Bot Commander policy and action selection |
| `lib/command-systems.ts` | Modes, specialists, procedure plans, objectives and sector rules |
| `lib/phase8.ts` | Infrastructure topologies, named team, set pieces and challenge codes |
| `lib/phase9.ts` | Campaign routes, incident variants, objective theories and team reactions |
| `lib/campaign.ts` | Persistent progression, acts, mastery and endings |
| `lib/session.ts` | Versioned save format, migration and save rejection |
| `lib/storage.ts` | Non-throwing local-storage access |
| `lib/feedback.ts` | Audio and haptic feedback |
| `lib/telemetry.ts` | Device-local balance counters |
| `tests/*.test.ts` | Engine, campaign, reads, session, content and simulation suites (`node --test`) |
| `tests/e2e/responsive-game.spec.ts` | Cross-width browser interaction and overflow audit |
| `tests/e2e/accessibility.spec.ts` | Cross-width axe accessibility audit |
| `tests/e2e/persistence.spec.ts` | Stored settings survive a load and a reload |
| `tests/e2e/keyboard.spec.ts` | Initial focus in overlays, focus recovery and switchable shortcuts |
| `playwright.config.ts` | Deterministic Chromium test runner and local preview lifecycle |

The interface is built with Next.js 16, React 19 and TypeScript and deployed as a native Next.js application on Vercel.

See [`AGENTS.md`](AGENTS.md) for repository-wide contribution rules, game-engine invariants and required verification.

## Attribution

Breach Command is not affiliated with or endorsed by Black Hills Information Security or Active Countermeasures. It does not reproduce the commercial deck, official artwork, official card wording, Consultants or expansion content.

- [Backdoors & Breaches](https://www.blackhillsinfosec.com/tools/backdoorsandbreaches/)
- [Classic visual guide](https://www.blackhillsinfosec.com/wp-content/uploads/2024/03/BnB_VisualGuide_v2_03052024.pdf)

This project is a learning simulation. Its outcomes are not a security assessment, certification or evidence of regulatory compliance.
