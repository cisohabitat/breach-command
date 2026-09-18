# Breach Command

A single-player incident-response tabletop game with a rule-based computer Incident Captain. An unofficial adaptation of the classic Backdoors & Breaches mechanics with original scenarios, card wording and interface. Not affiliated with or endorsed by the original creators.

## Play

Choose one of six fictional settings and three difficulty levels, then reveal four hidden attack stages before time or business impact runs out. Procedure checks use a d20, with +3 for four randomly established procedures. Discoveries force a choice between preserving evidence and disrupting the attacker. After the chain is found, containment and recovery choices determine the final outcome. Used procedures have a three-turn cooldown, while natural 1, natural 20 or three failed rolls trigger an inject.

The captain manages hidden scenario variants, ambiguous leads, pressure, injects and response consequences. Guided reflection offers reasoning prompts without naming the correct action. It does not call an AI service, interact with real infrastructure or transmit incident details. Sessions are in memory and reset on refresh. The full commercial deck, artwork and Consultants are not included.

## Source

- `app/page.tsx`: accessible game interface, dialogs and optional WebMCP read tool.
- `app/globals.css`: responsive tactical card-table theme.
- `lib/game.ts`: original scenario data and pure turn resolver.
- `tests/game.test.ts`: rule boundaries and complete simulated playthroughs.

Run engine checks with `node --experimental-strip-types tests/game.test.ts` using Node 24. Build and publication use the Sites project scripts. The site identity is in `.openai/hosting.json`.

## References

- Original game: https://www.blackhillsinfosec.com/tools/backdoorsandbreaches/
- Classic visual guide: https://www.blackhillsinfosec.com/wp-content/uploads/2024/03/BnB_VisualGuide_v2_03052024.pdf

The exercise models investigation, containment and recovery decisions for learning purposes. It is not a security assessment or evidence of compliance.
