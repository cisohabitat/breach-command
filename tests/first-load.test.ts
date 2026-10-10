// What the assignment screen parses before it answers. The engine and the
// tables only it plays with (the attacks, procedures and routes, the map's
// topologies, the set pieces, the specialists' notes), the session's
// migration, the Bot Commander, the game screen, the dialogs and the text
// they share load later, in one bundle (lib/game-loader.ts); this follows
// every static import from the page and fails if one of them is reached, so a
// new feature cannot pull the engine back onto the first load unnoticed.
import assert from "node:assert/strict";
import { test } from "node:test";
import { firstLoad, root } from "./first-load.ts";

test("the assignment screen loads without the engine", () => {
  const modules = firstLoad(`${root}app/page.tsx`);
  assert.ok(modules.includes("components/game/briefing-screen.tsx") && modules.includes("hooks/use-game-session.ts"), "the walk reaches the assignment screen and the session hook");
  const engine = /^(lib\/advanced-game\.ts|lib\/engine\/(content|transitions|reads|review|rules)\.ts|lib\/session\.ts|lib\/game-bot\.ts|lib\/game\.ts|lib\/phase8\.ts|lib\/specialist-notes\.ts|lib\/engine\/words\.ts|lib\/glossary\.ts|lib\/i18n\/en\/engine\.ts|lib\/i18n\/engine-messages\.ts|components\/game\/(game-bundle|game-screen|action-sheet|roll-dialog|mission-briefing-dialog|captain-report-dialog|field-guide-dialog|debrief-dialog|settings-dialog|new-incident-dialog)\.tsx?)$/;
  assert.deepEqual(modules.filter(file => engine.test(file)), [], "load it through lib/game-loader.ts instead");
});
