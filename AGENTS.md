# Breach Command contributor instructions

These instructions apply to the entire repository. Preserve the game as a polished, public, single-player incident-response simulation. Changes should strengthen the player experience without turning the project into a reproduction of the commercial Backdoors & Breaches deck.

## Product boundaries

- Keep all scenarios, card wording, characters, art direction and rules text original.
- Retain the existing attribution and the statement that the project is unofficial and not endorsed by the original creators.
- Do not add official card text, commercial artwork, Consultants content or other proprietary deck material.
- Keep the game fictional and educational. It must not connect to, scan or modify real infrastructure.
- Preserve the rule-based computer Incident Captain. Do not introduce a required AI service, account, backend or network dependency.
- Keep campaign, session, preferences and telemetry data local to the player's browser.

## Technical baseline

- Framework: Next.js 16 with React 19, built through Vinext for Cloudflare Workers.
- Language: TypeScript with strict checking.
- Package manager: pnpm. Preserve `pnpm-lock.yaml` and do not switch package managers.
- UI primitives: reuse the components in `components/ui` when a suitable primitive already exists.
- Icons: use `lucide-react` rather than custom icon SVGs.
- Hosting identity: `.openai/hosting.json`. Never replace its `project_id` or create a second Site for this checkout.

## Repository map

- `app/page.tsx`: top-level game flow, state orchestration, dialogs, settings, debrief and start screen.
- `app/globals.css`: visual system, game layouts and responsive behaviour.
- `components/game/`: focused gameplay surfaces. Prefer a new component here when a coherent game system would otherwise make `app/page.tsx` substantially harder to follow.
- `lib/game.ts`: scenarios, procedures, attacks and baseline rules data.
- `lib/advanced-game.ts`: authoritative game state and transition engine.
- `lib/command-systems.ts`: modes, specialists, scope, intensity, objectives and sector systems.
- `lib/phase8.ts`: infrastructure maps, named specialists, sector set pieces and challenge-code encoding.
- `lib/phase9.ts`: campaign routes, authored incident variants, objective theories and specialist reactions.
- `lib/campaign.ts`: persistent progression, mastery, acts and campaign endings.
- `lib/session.ts`: saved-session schema and migration.
- `lib/feedback.ts`: sound, music and haptic feedback.
- `lib/telemetry.ts`: device-local balance counters.
- `tests/game.test.ts`: deterministic rule checks and complete simulations.
- `public/sw.js`: offline cache. Increment the cache name when deployed assets or application behaviour change.

## Game-engine invariants

- Treat game state as immutable. Clone collections before changing them and return a new `Game` object from transitions.
- Keep hidden attack-chain information out of player-facing text until it has been revealed.
- A procedure consumes one turn. Procedure cooldown, difficulty thresholds, turn limits and end-state checks must remain internally consistent.
- Pending evidence decisions, command events and sector set pieces are blocking states. The player must resolve them before changing hypotheses, infrastructure focus or running another procedure.
- The response phase begins only after all four stages have been revealed. A completed response requires both containment and recovery choices.
- Clamp impact, continuity, sector health and objective progress to their documented ranges.
- Challenge codes must reproduce the same scenario configuration and random sequence.
- Any new persistent `Game` field requires a `SESSION_VERSION` increment and a safe migration in `lib/session.ts`.
- Any new campaign field requires a backward-compatible default in `parseCampaign`.
- Campaign routes and incident variants must remain deterministic for the same challenge seed and campaign state.
- Case-theory changes are blocked by every pending decision state and must never reveal the hidden objective.
- New scenarios must include a topology, sector system, set piece, adversary profile mapping and complete four-stage choice sets.

## Experience requirements

- The game must remain fully usable with mouse, keyboard and touch.
- Maintain visible focus states, semantic controls, accessible names and live announcements for material state changes.
- Support widths from 320 px mobile screens through desktop without horizontal page overflow, clipped text or unreachable controls.
- Keep essential tap targets at least 40 px high, preferably 44 px on mobile.
- Never rely on colour alone to communicate state.
- Preserve reduced-motion behaviour and high-contrast support.
- Keep main gameplay readable on phone, iPad and PC. Test start, investigation, decisions, response and debrief surfaces when changing shared layout rules.
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
node /root/.codex/plugins/cache/openai-curated-remote/sites/0.1.65/scripts/build-site.mjs
git diff --check
```

For engine changes, add a deterministic assertion and ensure all simulated playthroughs terminate. For UI changes, exercise the affected flow in the managed preview and check 320, 375, 430, 768, 810, 820, 834, 1024, 1080, 1194 and 1280 px widths. Treat 768–834 px portrait and 1024–1194 px landscape as explicit iPad targets. A successful build does not replace interaction and responsive checks.

## Publication

The production Site is `https://breach-command.cfusion2k.chatgpt.site`. Preserve its public audience. Publish only a tested, committed source state and keep the private `cisohabitat/breach-command` repository synchronized with the deployed version.
