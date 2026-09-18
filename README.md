# Breach Command

Breach Command is a public, single-player incident-response card game played against a rule-based computer Incident Captain. It is an unofficial adaptation inspired by the investigation structure of Backdoors & Breaches, using original scenarios, wording, characters, systems and presentation.

Play the current release at [breach-command.cfusion2k.chatgpt.site](https://breach-command.cfusion2k.chatgpt.site).

## What the player does

The player takes command of one of ten fictional cyber incidents. Each operation requires the player to:

1. Form a working hypothesis about the intrusion path.
2. Focus an infrastructure node and select an evidence procedure.
3. Choose the scope and intensity of the action.
4. Reveal four hidden attack stages before the investigation window closes.
5. Balance evidence preservation, intervention and essential-service continuity.
6. Assess selected findings as causal or coincidental, then test that judgement.
7. Declare and revise a case theory for the adversary objective, then test it against causal evidence.
8. Make containment and recovery decisions, then review the after-action report.

Procedure checks use a d20, but evidence-led reasoning now carries more weight than tool familiarity. Correct hypotheses receive a larger bonus than established procedures or specialist familiarity. Used procedures cool down, while failed actions, actor tempo and sector pressure can end an operation before the chain is found.

## Major systems

- **Ten sector scenarios:** enterprise IT, healthcare, energy, maritime, cloud, shared services, government, telecommunications, water and financial clearing.
- **Three difficulty levels:** Training, Operational and Crisis.
- **Five modes:** Campaign, Daily Operation, Ironman, Escalation and Expert.
- **Distinct adaptive adversaries:** recurring threat groups have signature mechanics, learn from procedure use, hypotheses and command posture, and can move to less-exposed routes.
- **Progressive attribution:** threat-group identity is withheld until the evidence supports behavioural, suspected, probable and attributed confidence levels.
- **Focused command workspace:** Command, Investigate and Briefing views keep the immediate decision, analytical work and supporting context separate without removing information.
- **Infrastructure command maps:** every incident has a selectable five-node topology. Aligned procedures receive a planning bonus.
- **Evidence workspace:** successful actions build a timeline. Players declare an objective theory, select findings, judge the relationship as causal or coincidental, and receive consequences for unsupported inference.
- **Operational decisions:** technique decisions, command events and a unique sector crisis change pressure, continuity, sector condition and actor progress.
- **Persistent command team:** six named specialists have distinct capabilities, callsigns, fatigue, cohesion and after-action reactions.
- **Branching campaign director:** command posture, trust and completed operations select Watchtower, Breakwater, Common Ground or Convergence routes. Routes alter starting conditions and mission priorities.
- **Authored incident variants:** each of the ten scenarios has two operational variants with distinct briefings and starting pressure.
- **Three-act campaign:** progression tracks experience, trust, readiness, unresolved access, mastery, team cohesion and command doctrine, leading to one of four endings.
- **Challenge codes:** compact `BC-...` codes reproduce a scenario, difficulty, mode, specialist and random seed.
- **After-action review:** scoring, timelines, decision quality, evidence reconstruction, actor adaptation and counterfactuals support facilitated learning.
- **Accessible, responsive play:** dedicated phone, iPad portrait, iPad landscape and desktop layouts, plus optional procedural sound, adaptive music, haptics, high contrast, reduced motion and guided reflection.
- **Offline and local-first play:** the installable PWA caches core assets. Sessions, campaign progress, settings and anonymous balance counters remain on the device. Portable backup text can transfer progress without an account.

The game does not call an AI service, inspect real systems or transmit incident information.

## Campaign and saves

Campaign progression is stored in browser local storage. Mid-operation sessions are versioned and migrated by `lib/session.ts`; Ironman mode intentionally disables normal mid-operation saving. Clearing browser storage resets local progress.

The settings panel can export a portable backup containing campaign progress and the current non-Ironman operation. Restoring the text validates its format before replacing the local campaign state.

Daily Operation and challenge codes use deterministic seeds, allowing the same configuration to be replayed or shared. Scenario mastery awards one star for a successful recovery, two for a score of 74 or above, and three for a score of 88 or above.

## Run locally

Requirements:

- Node.js 22.13 or newer
- pnpm 11.25

Install and start the development server:

```bash
pnpm install
pnpm dev
```

Run the verification suite:

```bash
pnpm test
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

`pnpm test` includes deterministic rule checks and 1,200 complete simulated operations across scenarios, difficulties, modes and specialists.

## Architecture

| Path | Responsibility |
| --- | --- |
| `app/page.tsx` | Game orchestration, focused workspaces, start screen, action sheet, settings and debrief |
| `app/globals.css` | Tactical visual system and responsive layouts |
| `components/game/` | Gameplay boards, maps, events, procedures and tutorial surfaces |
| `components/ui/` | Reusable interface primitives |
| `lib/game.ts` | Scenario, procedure and attack data |
| `lib/advanced-game.ts` | Game state, transitions, adaptive adversary and scoring |
| `lib/command-systems.ts` | Modes, specialists, procedure plans, objectives and sector rules |
| `lib/phase8.ts` | Infrastructure topologies, named team, set pieces and challenge codes |
| `lib/phase9.ts` | Campaign routes, incident variants, objective theories and team reactions |
| `lib/campaign.ts` | Persistent progression, acts, mastery and endings |
| `lib/session.ts` | Versioned save format and migration |
| `lib/feedback.ts` | Audio and haptic feedback |
| `lib/telemetry.ts` | Device-local balance counters |
| `tests/game.test.ts` | Engine assertions and full-game simulations |

The interface is built with Next.js 16, React 19 and TypeScript. Vinext produces the Cloudflare Workers-compatible deployment used by OpenAI Sites.

See [`AGENTS.md`](AGENTS.md) for repository-wide contribution rules, game-engine invariants and required verification.

## Attribution

Breach Command is not affiliated with or endorsed by Black Hills Information Security or Active Countermeasures. It does not reproduce the commercial deck, official artwork, official card wording, Consultants or expansion content.

- [Backdoors & Breaches](https://www.blackhillsinfosec.com/tools/backdoorsandbreaches/)
- [Classic visual guide](https://www.blackhillsinfosec.com/wp-content/uploads/2024/03/BnB_VisualGuide_v2_03052024.pdf)

This project is a learning simulation. Its outcomes are not a security assessment, certification or evidence of regulatory compliance.
