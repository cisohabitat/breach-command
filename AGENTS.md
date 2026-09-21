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
- `app/globals.css`: visual system, game layouts and responsive behaviour.
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
- `tests/game.test.ts`: deterministic rule checks and complete simulations.
- `tests/e2e/accessibility.spec.ts`: axe audit across the supported widths and overlays.
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
- The modifier shown before an action and the modifier the roll resolves with are one computation, `getModifierBreakdown`. `playTurn` adds only the planning bonus on top, and that bonus must never appear in the preview: it depends on the hidden chain, so showing it would let a player read the answer off the interface by cycling hypotheses.
- Anything shown before an action, including `getDiscriminatingRead`, may use only state the player has already declared or observed. It must return the same value when the hidden chain is rewritten underneath it, and `tests/game.test.ts` asserts this.
- Each turn records what its hypothesis was tested against. The planning bonus, `getScoreBreakdown` and `getHypothesisLedger` all read those fields, so the bonus a player is given and the score they are graded on cannot disagree.
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
- Business impact, service integrity and adversary progress are the three readouts that decide an operation and share the top row. The investigation window stays subordinate to them; it rarely ends an operation.
- Preserve reduced-motion behaviour and high-contrast support.
- Keep main gameplay readable on phone, iPad and PC. Test start, investigation, decisions, response and debrief surfaces when changing shared layout rules.
- Preserve the Command, Investigate and Briefing workspace separation. Blocking decisions return focus to Command; routine analytical actions remain in Investigate.
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

Run `pnpm test:a11y` for any change to markup, labels or the responsive rules that hide them; it must report zero violations. For engine changes, add a deterministic assertion and ensure all simulated playthroughs terminate. For UI changes, exercise the affected flow in the managed preview and check 320, 375, 430, 768, 810, 820, 834, 1024, 1080, 1194 and 1280 px widths. Treat 768–834 px portrait and 1024–1194 px landscape as explicit iPad targets. A successful build does not replace interaction and responsive checks.

## Publication

Production is [breach-command.vercel.app](https://breach-command.vercel.app), deployed from the existing Vercel project `breach-command`. Publish only a tested, committed source state and keep the private `cisohabitat/breach-command` repository synchronized with the deployed version.
