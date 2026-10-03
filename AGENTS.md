# Breach Command contributor instructions

These instructions apply to the entire repository. Preserve the game as a polished, public, single-player incident-response simulation. Changes should strengthen the player experience without turning the project into a reproduction of the commercial Backdoors & Breaches deck.

## Product boundaries

- Keep all scenarios, card wording, characters, art direction and rules text original.
- Retain the existing attribution and the statement that the project is unofficial and not endorsed by the original creators.
- Do not add official card text, commercial artwork, Consultants content or other proprietary deck material.
- Keep the game fictional and educational. It must not connect to, scan or modify real infrastructure.
- Preserve the rule-based computer Incident Captain. Do not introduce a required AI service, account, backend or network dependency.
- Keep campaign, session, preferences and telemetry data local to the player's browser.
- Reach local storage only through `lib/storage.ts`. Storage can be blocked or full, and the game must keep playing and say so rather than fault.
- Only an operation still in progress is offered for resume; a finished operation's save is cleared. A save written by a newer build is left in place — `sessionFromNewerBuild` tells it apart from a damaged one — because an older bundle served offline would otherwise delete it.
- A result is recorded once per operation, from whichever transition ended it: a decision, command event, sector decision, map action or correlation can lose an operation as surely as a procedure. The balance record counts an authorised exercise apart from a loss, as the campaign does.
- Sound, music and haptics never throw into the game. A failed `AudioContext` once left the turn lock held and every later action refused.
- A hook that both reads stored state on mount and writes it on change must not write before it has read. Every effect runs on mount, so an ungated write puts the defaults straight over the player's settings. `tests/e2e/persistence.spec.ts` covers this from the outside.

## Technical baseline

- Framework: Next.js 16 with React 19, built and hosted natively on Vercel.
- Language: TypeScript with strict checking.
- Package manager: pnpm. Preserve `pnpm-lock.yaml` and do not switch package managers.
- UI primitives: reuse the components in `components/ui` when a suitable primitive already exists.
- Icons: use `lucide-react` rather than custom icon SVGs.
- Hosting identity: the existing Vercel project `breach-command`. Preserve `vercel.json` and the checkout-local `.vercel/project.json` link; do not create a duplicate Vercel project.

## Repository map

- `app/page.tsx`: application shell only — topbar, live regions, storage notice and overlay mounting.
- `hooks/use-game-session.ts`: game, session and campaign state, every transition, effect and derived readout.
- `hooks/use-preferences.ts`: audio, haptics and contrast, loaded once and persisted after.
- `hooks/use-challenge-code.ts`: the shareable configuration — seed, code field and whether the operation is reproducible.
- `hooks/use-recover-focus.ts`: returns focus to a panel's heading when the control just used was replaced by it.
- `app/globals.css`: visual system, game layouts and responsive behaviour. One declaration per line, nested by block; keep it that way so a rule change is a one-line diff.
- `components/game/`: focused gameplay surfaces. Prefer a new component here when a coherent game system would otherwise make `app/page.tsx` substantially harder to follow.
- `lib/game.ts`: scenarios, procedures, attacks and baseline rules data.
- `lib/advanced-game.ts`: authoritative game state and transition engine.
- `lib/command-systems.ts`: modes, specialists, scope, intensity, objectives and sector systems.
- `lib/phase8.ts`: infrastructure maps, named specialists, sector set pieces and challenge-code encoding.
- `lib/phase9.ts`: campaign routes, authored incident variants, objective theories and specialist reactions.
- `lib/campaign.ts`: persistent progression, mastery, acts and campaign endings.
- `lib/session.ts`: saved-session schema, migration and rejection of impossible or future saves.
- `lib/storage.ts`: the only local-storage accessor. It answers instead of throwing.
- `lib/feedback.ts`: sound, music and haptic feedback.
- `lib/telemetry.ts`: device-local balance counters.
- `tests/*.test.ts`: the engine suite, run by `node --test`. One file per concern — engine, campaign, reads, session, content, simulation — so a failure in one reports without stopping the rest.
- `tests/e2e/accessibility.spec.ts`: axe audit across the supported widths and overlays.
- `tests/e2e/persistence.spec.ts`: local storage survives a page load and a reload.
- `tests/e2e/keyboard.spec.ts`: where focus lands when an overlay opens or a control is replaced, and that the single-key shortcuts can be turned off.
- `.claude/hooks/session-start.sh`: prepares a Claude Code cloud session — installs from the frozen lockfile and, when the container's Chromium is not the build the pinned Playwright expects, sets `PLAYWRIGHT_CHROMIUM_EXECUTABLE`, which `playwright.config.ts` honours.
- `public/sw.js`: offline cache. Increment the cache name when deployed assets or application behaviour change.

## Game-engine invariants

- Treat game state as immutable. Clone collections before changing them and return a new `Game` object from transitions. A new collection on `Game` belongs in every transition's clone block, and `tests/game.test.ts` asserts this for `playTurn`.
- Keep hidden attack-chain information out of player-facing text until it has been revealed, and out of player-facing numbers. The planning bonus once applied only when the declared reading matched the hidden route: the Captain's Report said "including hypothesis bonus", a protected failure read "the route under test was the right one", and even with both words gone the report's total less the preview's modifier gave the answer. Nothing hidden now touches the roll. Every failed roll the grace did not absorb reads as `FAILED_CHECK`.
- A procedure consumes one turn. Procedure cooldown, difficulty thresholds, turn limits and end-state checks must remain internally consistent.
- Pending evidence decisions, command events and sector set pieces are blocking states. The player must resolve them before changing hypotheses, infrastructure focus or running another procedure.
- The response phase begins only after all four stages have been revealed. A completed response requires both containment and recovery choices.
- An authorised exercise is a conclusion the investigation earns. It requires at least two confirmed stages; an earlier draw clears part of the activity and play continues. It is not a defeat and must never be recorded as one in `recordCampaignResult`.
- Crisis must stay mechanically distinct, not merely tighter: fewer map actions, a higher starting objective, a faster objective advance and an unprompted adversary re-route on the escalation beat.
- Response is a three-stage sequence: containment, assurance, then recovery. Do not bypass the assurance gate.
- The cheap option in each phase must be a different call in each sector, in cost and not only in wording. The assurance shortcut and the patch-in-place recovery were once identical across all ten profiles — same title, disruption, confidence, residual and score — which taught players to reuse one pattern rather than read the sector. Shortcutting is now defensible where independent assurance exists outside the compromised estate (plant instrumentation, manual process supervision, clinical checks) and close to indefensible where the control being skipped is the one under investigation (settlement reconciliation, a cloud control plane, a routing management plane). `tests/content.test.ts` asserts the spread, the per-sector naming, and that the confidence and residual a player reads before choosing agree with the score.
- Every sector decision offers three measures: decisive, narrow and permissive. "Stop it" or "carry on" is not the shape of a real incident decision — the option that gets used is usually the narrow one, applying the control to the affected part or adding a verification step and continuing. The narrow measure earns its place by keeping the service running rather than by being a weaker copy of the decisive one: it concedes objective progress and sector protection, and costs less continuity. Tuned as a weaker copy it was chosen in 7% of bot decisions; given its own virtue it reaches 22%. `tests/content.test.ts` holds its effects between the two extremes.
- `getSectorRead` explains why service continuity and the sector's own margin can diverge — one is what the organisation is delivering now, the other is how much room is left before the sector's limit. A player watching treatment continuity fall while process safety holds is looking at a deliberate trade, and the board says so instead of leaving them to guess.
- Infrastructure monitoring and isolation consume scarce map actions. Their node posture and action history are persistent game state and must migrate safely. Their full cost — impact, continuity, sector margin and actor progress — comes from `getMapActionEffect`, which the button and the resolution both read. The sector margin was once missing from the label and could end the operation unannounced.
- Clamp impact, continuity, sector health and objective progress to their documented ranges.
- Every transition that moves a meter — procedure, evidence decision, command event, sector decision, map action, correlation and response choice — asks `breached` and settles a loss through `settle`. Map actions and correlations once left a meter at its limit with play continuing, a later correct correlation could take a lost operation back, and a response choice could win at 100 impact.
- A finished operation holds no blocking state. Every end-state check routes through `settle`, which clears `pendingDecision`, `pendingCommand` and `pendingSetPiece`; the interface must never be left asking for a choice a transition would refuse. `tests/game.test.ts` asserts this for every simulated operation.
- Name the cause when an operation is lost. `getLossReason` distinguishes the objective, impact, continuity, sector and window endings by `cause`; the investigation window is only one of five, and its detail already counts the stages, so callers add that count only for the other four. The report for the turn that ends an operation says how it ended before anything else, because that turn's own headline can be good news.
- A technique's `evidence` states the finding, not the log that held it: it must read correctly from any of its detect sources, so no `"<Source> and <source> records show"` leads. The presented narrative names the procedure and node that produced it.
- The planning bonus is the own-source bonus, `OWN_SOURCE_BONUS` (+1): a procedure that is one of the declared reading's own sources earns it whether or not the reading is right, and it is a part of `getModifierBreakdown` like any other. Correctness is rewarded where it belongs — the right source on the right route reveals the stage, and hypothesis accuracy is scored after the operation. At +2 it made the game five or six points easier for a player who never revised; at +1 that player is within two points of where they were, and sound revision is what pays.
- A sound but unlucky action — one of the declared reading's own sources, failed on the roll — does not hand the adversary tempo or objective progress. Testing what you committed to is protected; certainty is not. It is checked before the rapid-coordination grace, so a failure that was already protected never spends the grace.
- Two consecutive failed rolls add a persistence bonus to the next action. It is derived from the player's own turn record, it appears in `getModifierBreakdown` like any other part so the preview and the resolution stay one computation, and it clears on the first success. It is not difficulty-specific: measurement shows it moves the overall win rate by a point or two and leaves Crisis unchanged, because Crisis is lost to its other pressures rather than to the roll.
- The procedure cooldown window is `cooldownWindow`: three turns at Training and four elsewhere. Training already withholds less; leaving a beginner with no source their declared reading predicts teaches nothing. Everything that reads the window reads that function, and everything that states it in words states turns *skipped* — one less than the window, which is the number the card counts down. `tests/engine.test.ts` ties the two together.
- Each scenario offers one investigative action no other scenario has, in `sectorProcedures`. The eleven shared procedures are correct — responders use the same evidence sources everywhere — but each sector also has a reconciliation only its own people would run: manifest and berth reconciliation, historian reconciliation, approval and settlement reconstruction. It is a procedure in every sense, so everything that lists, looks up or validates one goes through `proceduresFor` and `procedureById`, and a reading's own sources come from `hypothesisSources`, never the static route list. The sector action joins that list when it tests the same route, which is how it earns the planning bonus instead of sitting outside the reasoning.
- A technique's `detect` names at least three sources, drawn from the shared procedures or its own sector's action.
- Every procedure is predicted by at least one route, every technique is reachable through its own route's sources, and each route's listed sources mostly detect that route. DNS review and Email investigation were listed by nobody, so two of eleven procedures could never earn the planning bonus and only ever produced windfalls. `tests/content.test.ts` asserts all three properties. Adding a high-purity source to a route raises discrimination rather than diluting it — DNS is 78% application — so measure a candidate's purity before assuming a longer list is a weaker one.
- A critical roll draws an inject that agrees with it. A natural 20 reaches past unfavourable cards to a favourable or neutral one, a natural 1 reaches past favourable ones, and a run of failed rolls still draws from the whole deck. Excluding the neutral authorised stand-down from a natural 20 dropped that ending from six per cent of operations to one, so `neutral` belongs with `good` on a 20. With none of the wanted valence left in the deck, a critical roll draws nothing rather than the next card.
- The exercise card drawn on the turn that completes the chain has nothing to stand down: it eases pressure and the response goes ahead.
- A stage disclosed by the partner inject records a finding like any other, attributed to the disclosure. Without it a player can hold four confirmed stages and be unable to select one of them for correlation. When the partner discloses a stage on the same turn a procedure found one, each gets its own evidence decision, the procedure's first.
- A hypothesis premise describes a route through the whole chain, not the way in. The same four routes classify the exfiltration stage, so a premise that reads as an entry vector leaves a player no reason to pick it for an outbound channel.
- A finding is not a stage. A successful check that exposes nothing is still recorded, so every count of findings — in play and in the review — says how many confirmed a stage and how many settled nothing, and each card is labelled in words. `5 findings` next to `3 stages` reads to a beginner as two of their discoveries going missing.
- The review counts command events and sector decisions separately and shows both. A single `command events` tile reading zero next to a sector decision the player just resolved looks like a defect in the game rather than two different systems.
- `getKnownFacts` restates the briefing observations, the incident timeline, the stages the player has confirmed and the captain's unverified signal. It is the standing context once Operational withdraws the training aid, so it may hold nothing the player has not already been shown, and `tests/reads.test.ts` asserts it is unchanged when the hidden chain is rewritten.
- `getBeginnerReview` judges the response's cost only when a response was completed, and names what ended a lost operation rather than telling it nothing stands out.
- `getBeginnerReview` must not tell a player nothing stands out when the score is about to disagree. Choosing sources that find stages and naming the route correctly are separate skills; a run that did the first and not the second is told so, and only a clean record gets the all-clear.
- The modifier shown before an action and the modifier the roll resolves with are one computation, `getModifierBreakdown`, and `playTurn` adds nothing to it. No part of it may read the hidden chain, and `tests/reads.test.ts` asserts the preview is unchanged when the chain is rewritten.
- Fast resolution is the switch that skips the ceremony. With it off, every turn gets the captain's report — including the turn that found nothing, which is the turn whose result most needs explaining and which used to pass with only a strip in the column the player had just left. With it on, the report is reserved for what has to be acknowledged: a revealed stage, an inject, an adversary move or an ended operation.
- The report says what an empty result settled, and only when it settled something. A completed check that finds nothing rules out every technique its source could have seen, on any route, so the standing block appears after any completed empty check on the latest turn. A failed roll settles nothing, and captioning it as a result teaches the wrong inference.
- `getHypothesisStanding` reports how the declared reading is holding up, through `getReadingOdds`: among the techniques the scenario's published pool allows at the stage under test, which ones completed empty checks — and checks that exposed a later stage — have ruled out, and what share each route still holds. The window runs from the last visible change to the chain, an adversary re-route or an adaptation after a decision; a confirmation alone does not reset what a source could not see. It names the reading that is weakening; it never names the one that is right. It replaced a count of empty checks across the reading's whole source list, under which a "holding" reading was right 29% of the time and a "weakening" one 22% — barely apart, because any one technique is visible to only about three sources. Measured over 1,500 operations, a route with nothing left open is "poorly supported" and was right in none of 1,772 cases; "holding" is right 57% of the time. A share between half and four-fifths of the starting share was still right about half the time, so "weakening" is reserved for less than half (`STANDING_WEAKENS_BELOW`).
- The Bot Commander revises on that standing. It starts from the route of its latest find and moves to the most open route when its reading is poorly supported or weakening, keeping a revision until the record turns against it. It used to snap back to the latest find's route every turn, and lost most operations to the window with three stages confirmed.
- Campaign standing must change what an operation has to work with, not only its opening numbers: established sources, command actions, the investigation window and the rapid-coordination grace. Seniority follows results — `recordCampaignResult` scales the reward by outcome, so a command that keeps losing does not reach the tier of one that keeps winning.
- The training aid is `getTrainingPrompt`, and it prompts the next step in the reasoning — declare, test, revise, correlate — never the source to click. It must never return `nextEvidenceSource`: an aid that names the source walks the player to every stage while the rest of the interface tells them the same action tests nothing, and it scored three out of ten on hypothesis accuracy. The sources it lists are always the declared reading's own, so it cannot contradict `getDiscriminatingRead`.
- Training discloses exactly one thing the player could not derive: the `clue` on the next unconfirmed stage. It names what was observed, never the technique or the source that would expose it, and it is available at Training difficulty only. Without it the opening hypothesis is a coin flip between four routes and the game teaches nothing.
- Absence is evidence only when the check completed. A failed roll settles nothing about a source, so `getHypothesisStanding` and `getDiscriminatingRead` count it as inconclusive and never against the reading.
- Anything shown before an action, including `getDiscriminatingRead` and `getHypothesisStanding`, may use only state the player has already declared or observed, with the Training clue as the single stated exception. It must return the same value when the hidden chain is rewritten underneath it, and `tests/game.test.ts` asserts this.
- Hypothesis accuracy credits sound reasoning, not only correct answers. A turn scores in full when the declared reading matched the stage under test, and half when the reading was wrong but properly tested — one of its own sources spent, the check completed — which rules it out. That half is paid once per reading, so revising is rewarded and re-declaring a reading whose own sources came back empty is not; a failed roll settles nothing and earns nothing. Scoring exact matches alone put sound play and random play both near three out of ten while perfect knowledge scored ten, which is why players kept reading the number as arbitrary. Measured over 800 operations the spread is now 10.0 perfect, 5.0 sound, 4.5 random, 3.8 never-revising.
- Each turn records what its hypothesis was tested against. `getScoreBreakdown` and `getHypothesisLedger` both read those fields, so the score and the ledger that explains it cannot disagree. They are graded after the operation; nothing during play reads them.
- A source shared between routes can expose a stage further along than the one under test. That is a find, not a correct prediction: the turn is marked `windfall`, and the ledger must name the route the stage under test actually used, so a score of nothing is checkable against what the player saw.
- Evidence correlation is valid on consecutive stages or a shared route, and the result text must say which. Naming the two systems taught that sharing a node is the reason, which it is not.
- Challenge codes must reproduce the same scenario configuration and random sequence. A reproducible operation carries `Game.seed`, and `playTurn` derives its d20 from the seed and the turn index. Leave `seed` null for ordinary campaign play, and draw its hidden chain fresh as well: a chain taken from the date replayed the same answer on every restart that day. Daily Operation plays today's seed unless a loaded code says otherwise, and a loaded or generated code covers the next operation begun and is then spent. The date is read on the client after hydration, never in a state initialiser of the prerendered page.
- Any new persistent `Game` field requires a `SESSION_VERSION` increment and a safe migration in `lib/session.ts`.
- Any new campaign field requires a backward-compatible default in `parseCampaign`.
- Campaign routes and incident variants must remain deterministic for the same challenge seed and campaign state.
- Case-theory changes are blocked by every pending decision state and must never reveal the hidden objective.
- Adversary identity remains progressively attributed. Do not expose the profile name in opening briefings or low-confidence operational text.
- The assessed objective stays unconfirmed until two stages are confirmed, however many turns pass, and nothing may name it before then — including an accessible name. The objective bar's label once read the hidden objective to screen readers from the first turn.
- Undo exists only for map actions, whose effects are stated before they are chosen. A procedure's result is information: undoing it after seeing a stage, an empty source or a failed roll hands over the answer or a free re-roll.
- Evidence correlation records both the player's causal assessment and whether that assessment was correct. Timing alone must not be presented as causation.
- Every scenario keeps at least two techniques no other scenario can draw, and `tests/content.test.ts` asserts it. A chain assembled entirely from the shared pool is the sector's vocabulary painted onto a generic incident: the test to apply is whether the chain could move to another sector without changing a single technical noun. Banking, government and telecommunications each had one such technique and now have three to five, which is why a settlement incident can run approver takeover, entitlement widening, payment-support tampering and reconciliation suppression rather than a cloud pipeline compromise under a banking headline.
- The technique pool grows as sectors earn their own techniques. Assert that every stage draws from a pool of the same size, never a fixed count, or each authored addition becomes a test edit.
- The node in a finding's narrative is where collection was focused, not where the technique lives. The finding leads in its own words and the attribution follows, because `Identity audit at the payment gateway` in front of a mailbox relay asserts a location the game never established.
- New scenarios must include a topology, sector system, set piece, adversary profile mapping and complete four-stage choice sets.

## Experience requirements

- The game must remain fully usable with mouse, keyboard and touch.
- Maintain visible focus states, semantic controls, accessible names and live announcements for material state changes.
- Support widths from 320 px mobile screens through desktop without horizontal page overflow, clipped text or unreachable controls.
- Keep essential tap targets at least 40 px high, preferably 44 px on mobile.
- Never rely on colour alone to communicate state.
- A hover state must not move an element out from under the pointer. A lift of even a pixel un-hovers it at its edge, it drops back, and it lifts again every frame; that flicker kept the first response option permanently unstable at 834 px once the response moved to the top of Command. Lift only what keeps the vacated strip as part of the element, as procedure cards do with `::after`.
- No overlay may place initial focus on a control that changes state. The action sheet's first tabbable control is a plan toggle, so it moves focus to the sheet itself on open; otherwise Space — the key that scrolls a dialog — commits a plan change, and Rapid sits two tabs from where focus lands. The Captain's Report with a decision pending and the settings dialog do the same.
- When a blocking panel, a new response phase or an end state replaces the control just used, focus moves to its heading through `useRecoverFocus`, and only when focus was actually lost.
- High contrast is carried on the document root as well as the shell, because dialogs and sheets render outside the shell.
- The single-key shortcuts can be turned off in settings (WCAG 2.1.4) and never fire from an input, select or editable field.
- Scope and intensity persist between turns. The selection says so in words as well as colour, carries `aria-pressed`, and the carried plan is stated before the options and on the procedure heading outside the sheet — a plan that silently stays selected accumulates impact and fatigue a beginner never chose.
- A meter change is shown with its direction, through `describeChange`. Impact rising is bad and continuity rising is good; a bare signed number leaves a new player guessing which.
- Field vocabulary carries a plain-language translation in `plainLanguage`, and the review opens with four plain sentences from `getBeginnerReview` before any scoring.
- Business impact, service integrity and adversary progress are the three pressure readouts and share the top row; the investigation window stays subordinate to them in the layout. It is not rare as an ending: it is the most common one for a player who does not revise, because it is where a misread last stage runs out. A player who knows the answer almost never reaches it.
- Preserve reduced-motion behaviour and high-contrast support.
- Balance is measured, not assumed: run `pnpm balance` (the Bot Commander over seeded operations, by difficulty; `pnpm balance 300 2` for campaign tier 2) before and after a rule change. Samples of 600 per difficulty move two or three points on noise alone once the bot's choices diverge; use 3,000. Measured that way with the revising Bot Commander and the +1 own-source bonus, win rates are 72.0 / 64.3 / 42.3 per cent at Training, Operational and Crisis for a new command and 73.6 / 65.0 / 44.2 at tier 2. The same bot without revision scores 59.6 / 53.5 / 40.4 — the gap is what sound reasoning is worth — and a player who knows the answer wins 92–97 per cent, so the window is not what decides an operation; the last stage's reading is.
- Keep main gameplay readable on phone, iPad and PC. Test start, investigation, decisions, response and debrief surfaces when changing shared layout rules.
- Measure the fold on a phone when anything is added above the procedure grid. The stack grew round by round until the grid sat at y=1613 on a 390×844 screen with the page 6.8 screens tall; it is now at y=797 once a reading is recorded, with the first row of cards on screen and the page 4.8 screens. The compaction lives in a single `@media(max-width:650px)` block at the end of `app/globals.css`, last on purpose — several earlier blocks set the same properties for wider screens and cascade order is what settles it.
- The procedure grid is what a player touches every turn, so it never sits last. The Investigate column is a grid of three areas — the reading, the actions, the reference material — and stacked they collapse in that order. Every round of added content pushed the grid further down until it was six screens below the fold on a phone; check the fold, not just the absence of horizontal overflow, when adding to this column.
- Once a reading is recorded, the phone layout collapses the whole board to a bar — what is declared, how it is holding up, and the way to change it — with the premises and the predicted sources one tap down in the comparison. Four expanded premises are 955 px on a phone and the full board 315 px; the bar is about a hundred.
- Once a reading is recorded, the stacked layout replaces the four premise cards with a compact strip and folds all four behind a selectable comparison. Four expanded premises are 955 px on a phone.
- The Investigate column leads with the working hypothesis, because every procedure is gated on it. Reference material — trust relationships, dependency notes, the findings list — folds away behind a summary that carries the state it hides, so collapsing costs no situational awareness.
- Preserve the Command, Investigate and Briefing workspace separation. Blocking decisions return focus to Command; routine analytical actions remain in Investigate.
- Command leads with what needs the player — a command event, a sector decision, the response sequence, the ending, or otherwise the current intelligence and the next move — and the situation picture follows. A sector decision once sat 1,500 px below the fold on a phone with nothing on screen saying one was waiting. A dialog that closes over one of these hands focus to its heading (`data-awaiting-heading`, `returnFocusToAwaiting`).
- Changing workspace returns to the top of the new one. Keeping the old page's scroll position dropped a player half-way down the infrastructure map. It runs on a change only; on mount the screen is already scrolling to the top.
- On a phone the first screen carries the first move: the quick-start strip resumes the saved operation or starts the selected assignment. The assignment panel and its start button otherwise sat 2,000 px down, behind the campaign record.
- A first operation defaults to Training, the difficulty that discloses the clue. Before a reading is declared the four premises and their evidence stay on the cards at every width, with the training prompt and clue above them; the procedures are locked until a reading exists, so that height costs nothing a player could use.
- Resuming a saved operation opens the workspace that holds its next required decision. A save already in the response phase opens on Command, because Investigate is disabled there and the player would be looking at nothing.
- Player-facing language should be concise, professional and operationally plausible. Avoid exaggerated claims and unnecessary jargon.

## Change discipline

- Use `apply_patch` for hand-authored changes.
- Preserve unrelated user changes in a dirty worktree.
- Avoid broad refactors during a feature or bug fix unless they are required for correctness.
- Do not edit generated build output or vendored files in `components/ui` for ordinary styling changes.
- Do not add dependencies when the existing stack can implement the requirement.
- Update `README.md` whenever commands, architecture, game modes, persistence or major systems change.

## Required verification

Run these checks before committing code changes. `.github/workflows/verify.yml` runs the same checks and every browser suite, against a production build, on each push to `main` and each pull request. Vercel deploys `main`, so a red run there is a broken production build: fix it before anything else.

```bash
pnpm test
pnpm lint
pnpm exec tsc --noEmit
pnpm build
git diff --check
```

`tests/e2e/responsive-game.spec.ts` builds the response phase from the engine and resumes it from a saved session. Do not make a browser fixture depend on a bot run winning under a stubbed random source: that run is decided by one constant, and a balance change silently takes the whole suite with it.

Run `pnpm test:a11y` for any change to markup, labels or the responsive rules that hide them; it must report zero violations, and `pnpm test:persistence` for any change to stored state. `pnpm test:e2e` runs every browser suite; run it for any change to focus handling or keyboard behaviour, which `tests/e2e/keyboard.spec.ts` covers. A browser test that acts on the page waits for it to hydrate (`networkidle`) first: the page is prerendered, so it is visible before its handlers exist, and the dev server makes the gap wide enough to fail on. For engine changes, add a deterministic assertion and ensure all simulated playthroughs terminate. For UI changes, exercise the affected flow in the managed preview and check 320, 375, 430, 768, 810, 820, 834, 1024, 1080, 1194 and 1280 px widths. Treat 768–834 px portrait and 1024–1194 px landscape as explicit iPad targets. A successful build does not replace interaction and responsive checks.

## Publication

Production is [breach-command.vercel.app](https://breach-command.vercel.app), deployed from the existing Vercel project `breach-command`. Publish only a tested, committed source state and keep the private `cisohabitat/breach-command` repository synchronized with the deployed version.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
