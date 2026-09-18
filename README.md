# Breach Command

A single-player incident-response tabletop game with a rule-based computer Incident Captain. An unofficial adaptation of the classic Backdoors & Breaches mechanics with original scenarios, card wording and interface. Not affiliated with or endorsed by the original creators.

## Play

Choose one of six fictional settings, optionally enable guided recommendations, and reveal the four hidden attack stages within ten turns. A procedure succeeds at 11+ on a d20, with +3 for one of four established procedures. All used procedures have a three-intervening-turn cooldown. Natural 1, natural 20 or three failed rolls trigger one inject. Full rules and explicit solo conventions are in the Field Guide.

The captain is deterministic apart from randomly selected scenarios, established procedures, inject ordering and fair d20 rolls. It does not call an AI service, interact with real infrastructure or transmit incident details. Sessions are in memory and reset on refresh. The full commercial deck, artwork and Consultants are not included.

## Source

- `app/page.tsx`: accessible game interface, dialogs and optional WebMCP read tool.
- `app/globals.css`: responsive tactical card-table theme.
- `lib/game.ts`: original scenario data and pure turn resolver.
- `tests/game.test.ts`: rule boundaries and complete simulated playthroughs.

Run engine checks with `node --experimental-strip-types tests/game.test.ts` using Node 24. Build and publication use the Sites project scripts. The site identity is in `.openai/hosting.json`.

## References

- Original game: https://www.blackhillsinfosec.com/tools/backdoorsandbreaches/
- Classic visual guide: https://www.blackhillsinfosec.com/wp-content/uploads/2024/03/BnB_VisualGuide_v2_03052024.pdf

Discovery does not demonstrate containment, eradication, safe recovery or compliance. Debriefs explicitly distinguish the game outcome from a real security assessment.
