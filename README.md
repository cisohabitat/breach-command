# Breach Command

A single-player incident-response tabletop game with a rule-based computer Incident Captain. An unofficial adaptation of the classic Backdoors & Breaches mechanics with original scenarios, card wording and interface. Not affiliated with or endorsed by the original creators.

## Play

Choose one of six fictional settings and three difficulty levels, record a working hypothesis, then reveal four hidden attack stages before time, business impact or operational continuity runs out. Procedure checks use a d20, with +3 for four established procedures and a hidden +1 when the selected evidence source supports a correct hypothesis. Discoveries create technique-specific observe-or-intervene decisions. Intervention can make the actor adapt an unrevealed route. After the chain is found, containment and recovery choices determine the final outcome.

The captain manages hidden scenario variants, ambiguous leads, sector-specific operational pressure, adversary tempo, injects and response consequences. Guided reflection offers reasoning prompts without naming the correct action. The debrief explains counterfactuals and actor adaptations. It does not call an AI service, interact with real infrastructure or transmit incident details. Sessions are in memory and reset on refresh. The full commercial deck, artwork and Consultants are not included.

## Source

- `app/page.tsx`: accessible game interface, dialogs and optional WebMCP read tool.
- `app/globals.css`: responsive tactical card-table theme.
- `lib/game.ts`: original scenario, technique and baseline rules data.
- `lib/advanced-game.ts`: adaptive adversary, hypothesis and response engine.
- `tests/game.test.ts`: rule boundaries and complete simulated playthroughs.

Run engine checks with `node --experimental-strip-types tests/game.test.ts` using Node 24. Build and publication use the Sites project scripts. The site identity is in `.openai/hosting.json`.

## References

- Original game: https://www.blackhillsinfosec.com/tools/backdoorsandbreaches/
- Classic visual guide: https://www.blackhillsinfosec.com/wp-content/uploads/2024/03/BnB_VisualGuide_v2_03052024.pdf

The exercise models investigation, containment and recovery decisions for learning purposes. It is not a security assessment or evidence of compliance.
