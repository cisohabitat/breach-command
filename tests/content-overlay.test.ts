// The content overlay: the words of the content tables, extracted by path for a
// translator and replaced in place for a locale. The extracted file matches the
// tables, an overlay round-trips to English, and the rules play the same game
// in any language: the balance check's figures and its fingerprint of every
// seeded game are identical with the pseudo-locale applied.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { extractContent } from "../scripts/extract-content.ts";
import { contentTables } from "../lib/i18n/content/tables.ts";
import { contentLeaves } from "../lib/i18n/content/walk.ts";
import { applyContentOverlay, pseudoOverlay } from "../lib/i18n/content/overlay.ts";

test("lib/i18n/content/en.json is what the tables hold (pnpm extract:content)", () => {
  const committed = JSON.parse(readFileSync(new URL("../lib/i18n/content/en.json", import.meta.url), "utf8"));
  assert.deepEqual(committed, extractContent());
  const leaves = contentLeaves(contentTables);
  assert.equal(new Set(leaves.map(leaf => leaf.path)).size, leaves.length, "every path names one string");
});

test("tables.ts reaches every module that registers content", () => {
  const tables = readFileSync(new URL("../lib/i18n/content/tables.ts", import.meta.url), "utf8");
  const modules = [...readdirSync(new URL("../lib/", import.meta.url)).filter(name => name.endsWith(".ts")).map(name => `lib/${name}`), ...readdirSync(new URL("../lib/engine/", import.meta.url)).map(name => `lib/engine/${name}`)];
  const registering = modules.filter(path => /^registerContent\(/m.test(readFileSync(new URL(`../${path}`, import.meta.url), "utf8")));
  assert.ok(registering.length >= 7);
  for (const path of registering) assert.ok(tables.includes(`"../../${path.slice(4)}"`), `tables.ts imports ${path}`);
});

test("an overlay replaces every leaf and English restores the tables exactly", () => {
  const before = JSON.stringify(contentTables);
  applyContentOverlay(pseudoOverlay);
  const replaced = contentLeaves(contentTables);
  assert.ok(replaced.every(leaf => leaf.text.startsWith("[")), "every leaf was replaced");
  applyContentOverlay(() => undefined);
  assert.equal(JSON.stringify(contentTables), before);
});

test("the rules play the same game with the content in another language", () => {
  const run = (...flags: string[]) => execFileSync(process.execPath, ["scripts/balance-check.ts", "--figures", ...flags], { cwd: new URL("..", import.meta.url), encoding: "utf8" });
  assert.equal(run("--overlay=en-XA"), run());
});
