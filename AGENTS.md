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
- `public/sw.js`: offline cache. Increment the cache name when deployed assets or application behaviour change.

## Game-engine invariants

- Treat game state as immutable. Clone collections before changing them and return a new `Game` object from transitions. A new collection on `Game` belongs in every transition's clone block, and `tests/game.test.ts` asserts this for `playTurn`.
- Keep hidden attack-chain information out of player-facing text until it has been revealed.
- A procedure consumes one turn. Procedure cooldown, difficulty thresholds, turn limits and end-state checks must remain internally consistent.
- Pending evidence decisions, command events and sector set pieces are blocking states. The player must resolve them before changing hypotheses, infrastructure focus or running another procedure.
- The response phase begins only after all four stages have been revealed. A completed response requires both containment and recovery choices.
- An authorised exercise is a conclusion the investigation earns. It requires at least two confirmed stages; an earlier draw clears part of the activity and play continues. It is not a defeat and must never be recorded as one in `recordCampaignResult`.
- Crisis must stay mechanically distinct, not merely tighter: fewer map actions, a higher starting objective, a faster objective advance and an unprompted adversary re-route on the escalation beat.
- Response is a three-stage sequence: containment, assurance, then recovery. Do not bypass the assurance gate.
- Infrastructure monitoring and isolation consume scarce map actions. Their node posture and action history are persistent game state and must migrate safely.
- Clamp impact, continuity, sector health and objective progress to their documented ranges.
- A finished operation holds no blocking state. Every end-state check routes through `settle`, which clears `pendingDecision`, `pendingCommand` and `pendingSetPiece`; the interface must never be left asking for a choice a transition would refuse. `tests/game.test.ts` asserts this for every simulated operation.
- Name the cause when an operation is lost. `getLossReason` distinguishes the objective, impact, continuity, sector and window endings; the investigation window is only one of five.
- A technique's `evidence` states the finding, not the log that held it: it must read correctly from any of its three detect sources, so no `"<Source> and <source> records show"` leads. The presented narrative names the procedure and node that produced it.
- A sound but unlucky action — one that earned the planning bonus and still failed the roll — does not hand the adversary tempo or objective progress. Reasoning is protected; certainty is not.
- Two consecutive failed rolls add a persistence bonus to the next action. It is derived from the player's own turn record, it appears in `getModifierBreakdown` like any other part so the preview and the resolution stay one computation, and it clears on the first success. It is not difficulty-specific: measurement shows it moves the overall win rate by a point or two and leaves Crisis unchanged, because Crisis is lost to its other pressures rather than to the roll.
- The procedure cooldown window is `cooldownWindow`: three turns at Training and four elsewhere. Training already withholds less; leaving a beginner with no source their declared reading predicts teaches nothing. Everything that reads the window reads that function, and everything that states it in words states turns *skipped* — one less than the window, which is the number the card counts down. `tests/engine.test.ts` ties the two together.
- Every procedure is predicted by at least one route, every technique is reachable through its own route's sources, and each route's listed sources mostly detect that route. DNS review and Email investigation were listed by nobody, so two of eleven procedures could never earn the planning bonus and only ever produced windfalls. `tests/content.test.ts` asserts all three properties. Adding a high-purity source to a route raises discrimination rather than diluting it — DNS is 78% application — so measure a candidate's purity before assuming a longer list is a weaker one.
- A critical roll draws an inject that agrees with it. A natural 20 reaches past unfavourable cards to a favourable or neutral one, a natural 1 reaches past favourable ones, and a run of failed rolls still draws from the whole deck. Excluding the neutral authorised stand-down from a natural 20 dropped that ending from six per cent of operations to one, so `neutral` belongs with `good` on a 20.
- A stage disclosed by the partner inject records a finding like any other, attributed to the disclosure. Without it a player can hold four confirmed stages and be unable to select one of them for correlation.
- A hypothesis premise describes a route through the whole chain, not the way in. The same four routes classify the exfiltration stage, so a premise that reads as an entry vector leaves a player no reason to pick it for an outbound channel.
- A finding is not a stage. A successful check that exposes nothing is still recorded, so every count of findings — in play and in the review — says how many confirmed a stage and how many settled nothing, and each card is labelled in words. `5 findings` next to `3 stages` reads to a beginner as two of their discoveries going missing.
- The review counts command events and sector decisions separately and shows both. A single `command events` tile reading zero next to a sector decision the player just resolved looks like a defect in the game rather than two different systems.
- `getKnownFacts` restates the briefing observations, the incident timeline, the stages the player has confirmed and the captain's unverified signal. It is the standing context once Operational withdraws the training aid, so it may hold nothing the player has not already been shown, and `tests/reads.test.ts` asserts it is unchanged when the hidden chain is rewritten.
- `getBeginnerReview` must not tell a player nothing stands out when the score is about to disagree. Choosing sources that find stages and naming the route correctly are separate skills; a run that did the first and not the second is told so, and only a clean record gets the all-clear.
- The modifier shown before an action and the modifier the roll resolves with are one computation, `getModifierBreakdown`. `playTurn` adds only the planning bonus on top, and that bonus must never appear in the preview: it depends on the hidden chain, so showing it would let a player read the answer off the interface by cycling hypotheses.
- `getHypothesisStanding` reports how the declared reading is holding up from the player's own record — which of its evidence sources have been spent since the last confirmation, and with what result. Repeated absence across a reading's own sources is evidence against it and must be surfaced during play, never only in the review. It names the reading that is weakening; it never names the one that is right.
- Campaign standing must change what an operation has to work with, not only its opening numbers: established sources, command actions, the investigation window and the rapid-coordination grace. Seniority follows results — `recordCampaignResult` scales the reward by outcome, so a command that keeps losing does not reach the tier of one that keeps winning.
- The training aid is `getTrainingPrompt`, and it prompts the next step in the reasoning — declare, test, revise, correlate — never the source to click. It must never return `nextEvidenceSource`: an aid that names the source walks the player to every stage while the rest of the interface tells them the same action tests nothing, and it scored three out of ten on hypothesis accuracy. The sources it lists are always the declared reading's own, so it cannot contradict `getDiscriminatingRead`.
- Training discloses exactly one thing the player could not derive: the `clue` on the next unconfirmed stage. It names what was observed, never the technique or the source that would expose it, and it is available at Training difficulty only. Without it the opening hypothesis is a coin flip between four routes and the game teaches nothing.
- Absence is evidence only when the check completed. A failed roll settles nothing about a source, so `getHypothesisStanding` and `getDiscriminatingRead` count it as inconclusive and never against the reading.
- Anything shown before an action, including `getDiscriminatingRead` and `getHypothesisStanding`, may use only state the player has already declared or observed, with the Training clue as the single stated exception. It must return the same value when the hidden chain is rewritten underneath it, and `tests/game.test.ts` asserts this.
- Each turn records what its hypothesis was tested against. The planning bonus, `getScoreBreakdown` and `getHypothesisLedger` all read those fields, so the bonus a player is given and the score they are graded on cannot disagree. The bonus is applied before the roll resolves, so the stage under test is the only thing any of them can key to.
- A source shared between routes can expose a stage further along than the one under test. That is a find, not a correct prediction: the turn is marked `windfall`, and the ledger must name the route the stage under test actually used, so a score of nothing is checkable against what the player saw.
- Evidence correlation is valid on consecutive stages or a shared route, and the result text must say which. Naming the two systems taught that sharing a node is the reason, which it is not.
- Challenge codes must reproduce the same scenario configuration and random sequence. A reproducible operation carries `Game.seed`, and `playTurn` derives its d20 from the seed and the turn index. Leave `seed` null for ordinary campaign play.
- Any new persistent `Game` field requires a `SESSION_VERSION` increment and a safe migration in `lib/session.ts`.
- Any new campaign field requires a backward-compatible default in `parseCampaign`.
- Campaign routes and incident variants must remain deterministic for the same challenge seed and campaign state.
- Case-theory changes are blocked by every pending decision state and must never reveal the hidden objective.
- Adversary identity remains progressively attributed. Do not expose the profile name in opening briefings or low-confidence operational text.
- Evidence correlation records both the player's causal assessment and whether that assessment was correct. Timing alone must not be presented as causation.
- New scenarios must include a topology, sector system, set piece, adversary profile mapping and complete four-stage choice sets.

## Experience requirements

- The game must remain fully usable with mouse, keyboard and touch.
- Maintain visible focus states, semantic controls, accessible names and live announcements for material state changes.
- Support widths from 320 px mobile screens through desktop without horizontal page overflow, clipped text or unreachable controls.
- Keep essential tap targets at least 40 px high, preferably 44 px on mobile.
- Never rely on colour alone to communicate state.
- No overlay may place initial focus on a control that changes state. The action sheet's first tabbable control is a plan toggle, so it moves focus to the sheet itself on open; otherwise Space — the key that scrolls a dialog — commits a plan change, and Rapid sits two tabs from where focus lands.
- Scope and intensity persist between turns. The selection says so in words as well as colour, carries `aria-pressed`, and the carried plan is stated before the options and on the procedure heading outside the sheet — a plan that silently stays selected accumulates impact and fatigue a beginner never chose.
- A meter change is shown with its direction, through `describeChange`. Impact rising is bad and continuity rising is good; a bare signed number leaves a new player guessing which.
- Field vocabulary carries a plain-language translation in `plainLanguage`, and the review opens with four plain sentences from `getBeginnerReview` before any scoring.
- Business impact, service integrity and adversary progress are the three readouts that decide an operation and share the top row. The investigation window stays subordinate to them; it rarely ends an operation.
- Preserve reduced-motion behaviour and high-contrast support.
- Keep main gameplay readable on phone, iPad and PC. Test start, investigation, decisions, response and debrief surfaces when changing shared layout rules.
- The Investigate column leads with the working hypothesis, because every procedure is gated on it. Reference material — trust relationships, dependency notes, the findings list — folds away behind a summary that carries the state it hides, so collapsing costs no situational awareness.
- Preserve the Command, Investigate and Briefing workspace separation. Blocking decisions return focus to Command; routine analytical actions remain in Investigate.
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

Run these checks before committing code changes:

```bash
pnpm test
pnpm lint
pnpm exec tsc --noEmit
pnpm build
git diff --check
```

`tests/e2e/responsive-game.spec.ts` builds the response phase from the engine and resumes it from a saved session. Do not make a browser fixture depend on a bot run winning under a stubbed random source: that run is decided by one constant, and a balance change silently takes the whole suite with it.

Run `pnpm test:a11y` for any change to markup, labels or the responsive rules that hide them; it must report zero violations, and `pnpm test:persistence` for any change to stored state. `pnpm test:e2e` runs every browser suite. For engine changes, add a deterministic assertion and ensure all simulated playthroughs terminate. For UI changes, exercise the affected flow in the managed preview and check 320, 375, 430, 768, 810, 820, 834, 1024, 1080, 1194 and 1280 px widths. Treat 768–834 px portrait and 1024–1194 px landscape as explicit iPad targets. A successful build does not replace interaction and responsive checks.

## Publication

Production is [breach-command.vercel.app](https://breach-command.vercel.app), deployed from the existing Vercel project `breach-command`. Publish only a tested, committed source state and keep the private `cisohabitat/breach-command` repository synchronized with the deployed version.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
