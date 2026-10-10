// Scenario drafts: the scaffold covers every per-scenario table, and a draft in
// content-drafts/ fails until every TODO in it is written.
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { test } from "node:test";
import { scenarios } from "../lib/game.ts";
import { scaffold, scenarioTables, todosIn } from "../scripts/scenario-scaffold.ts";

test("the scaffold covers every table that holds one entry per scenario", async () => {
  const modules = ["../lib/scenarios.ts", "../lib/game.ts", "../lib/phase8.ts", "../lib/phase9.ts", "../lib/command-systems.ts", "../lib/engine/content.ts"];
  const covered = new Set(Object.values(scenarioTables).map(entry => entry.table.split(" ")[0]));
  // Shared tables whose length can match the scenario count by chance: the
  // eleven shared procedures met an eleventh scenario in the scaffold's dry run.
  const shared = new Set(["procedures"]);
  for (const path of modules) {
    for (const [name, value] of Object.entries(await import(path))) {
      if (Array.isArray(value) && value.length === scenarios.length && !shared.has(name)) assert.ok(covered.has(name), `${name} in ${path} is per scenario; add it to scenarioTables`);
    }
  }
  const draft = scaffold("example");
  assert.match(draft, /export const draft = /);
  assert.ok(todosIn(JSON.parse(draft.slice(draft.indexOf("{"), draft.lastIndexOf("}") + 1))).length > 100, "a fresh draft is all TODOs");
});

const drafts = readdirSync(new URL("../content-drafts/", import.meta.url)).filter(name => name.endsWith(".ts"));
for (const name of drafts) {
  test(`content-drafts/${name} is complete`, async () => {
    const { draft } = await import(`../content-drafts/${name}`);
    const left = todosIn(draft);
    assert.deepEqual(left, [], `${left.length} TODOs left in ${name}`);
  });
}
