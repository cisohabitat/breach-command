# Practitioner review brief

Phase 6 of [the roadmap](../ROADMAP.md) asks a practitioner to read the whole
corpus and sign off that every word could stand in a training room. This is
the brief for that review: what to read, where it lives, what to look for,
and how to record the result. Nothing here has been reviewed by a human yet.

## What to read

| Table | Where | Count | Questions |
| --- | --- | --- | --- |
| Techniques: title, evidence, clue, detect sources, route | `lib/game.ts`, `attacks` | 96 | Could this happen as written? Could each listed source really see it? Does the clue say what someone would notice, in their words? |
| ATT&CK mapping | `lib/game.ts`, `attackMitre` | 96 | Is the first ID the technique a practitioner would file the finding under? |
| Procedures and sector actions | `lib/game.ts`, `procedures`, `sectorProcedures` | 21 | Would a responder run this, and does it collect what it says? |
| Scenarios: summary, briefing, leads, scope | `lib/game.ts`, `scenarios` | 10 | Is the sector plausible to someone who works in it? |
| Sector rules and decisions | `lib/command-systems.ts`, `lib/phase8.ts` | 10 sectors, 20 crises | Would that sector's people own the decision, and are the three measures the ones they would weigh? |
| Response options | `lib/engine/content.ts`, `responseProfiles` | 10 sectors × 3 phases | Is the cheap option a real shortcut in that sector, and is its cost right? |
| Command events and injects | `lib/engine/content.ts` | 18 and 20 | Does this happen in the middle of a real incident? |
| Glossary | `lib/engine/content.ts`, `plainLanguage` | about 70 | Correct, and plain enough for someone outside the field? |

The game's own tests already hold the structure (every technique has three or
more real sources, every stage four techniques across three routes, every
signal word matches its numbers); this review is about whether the words are
true.

## ATT&CK mappings to look at first

Each technique maps to its nearest Enterprise technique. These were the least
certain when the table was drafted:

| Technique | Mapped to | Doubt |
| --- | --- | --- |
| `ci`, Pipeline runner hijack | T1677 | Poisoned Pipeline Execution is recent; confirm the ID in the current release. |
| `backbone`, Backbone dependency persistence | T1584.002 | A DNS record kept in configuration; Resource Development may be the wrong tactic. |
| `routepolicy`, Routing policy reinstatement | T1053 | Reinstated by an unscheduled change job; a network-device technique may fit better. |
| `githook`, Repository hook persistence | T1546 | No dedicated technique; Event Triggered Execution is the nearest parent. |
| `paysupport`, Payment-support component tampering | T1554 | Compromise Host Software Binary, or Data Manipulation? |
| `kiosk`, Shared kiosk session takeover | T1078 | Remote Service Session Hijacking (T1563) is the alternative. |
| `id-broker`, National identity broker assertion | T1199 | An assertion issued, not forged; Trusted Relationship rather than T1606.002. |
| `historian`, `tos-access`, `record-export` | T1213 | Data from Information Repositories; an ICS mapping may serve OT readers better. |
| `telemetry-out`, `backup-out` | T1048 | Exfiltration Over Alternative Protocol, the parent only. |
| `delegation`, `grant`, `entitlement` | T1098 | Account Manipulation, the parent only. |

## How to record it

One file per reviewer in this folder, `PRACTITIONER-<name>-<date>.md`, with a
row per table: reviewed in full, in part, or not; the findings, each with the
item's id; and a sign-off line. A finding the team accepts becomes a change
whose commit names the review. The roadmap's exit criterion is a sign-off for
every table.
