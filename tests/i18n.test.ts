// The message catalogue: interpolation, plurals and numbers through Intl, the
// pseudo-locale, and a ratchet on the strings still written into components.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
import { en } from "../lib/i18n/en.ts";
import { formatNumber, pseudo, register, translate } from "../lib/i18n/index.ts";
import { catalogueFiles } from "../lib/i18n/keys.ts";

// The shared base and each component's catalogue, by file stem.
const catalogues: Record<string, Record<string, unknown>> = {};
for (const stem of catalogueFiles) {
  const module: Record<string, Record<string, unknown>> = await import(`../lib/i18n/en/${stem}.ts`);
  catalogues[stem] = Object.values(module)[0];
  register(catalogues[stem] as Parameters<typeof register>[0]);
}
const every = [en, ...Object.values(catalogues)].flatMap(catalogue => Object.entries(catalogue)) as [string, string | Record<string, string>][];

test("messages interpolate, pluralise by Intl and format numbers", () => {
  assert.equal(translate("en", "tabs.stages", { found: 3 }), "3 of 4 stages");
  assert.equal(translate("en", "tabs.turns", { count: 1 }), "1 turn");
  assert.equal(translate("en", "tabs.turns", { count: 4 }), "4 turns");
  assert.equal(translate("en", "tabs.turns", { count: 0 }), "0 turns");
  assert.equal(formatNumber("en", 12500), "12,500");
  assert.equal(translate("en", "window.remaining", {}), "of {limit} turns remaining", "a missing parameter is left visible, not blanked");
  for (const [key, value] of every) {
    if (typeof value === "string") assert.ok(value.trim(), `${key} has text`);
    else assert.ok(value.other, `${key} has an "other" form`);
  }
});

test("the pseudo-locale lengthens every string by about a third and keeps its placeholders", () => {
  for (const [key, value] of every) {
    for (const text of typeof value === "string" ? [value] : Object.values(value)) {
      const out = pseudo(text);
      for (const placeholder of text.match(/\{[a-zA-Z]+\}/g) ?? []) assert.ok(out.includes(placeholder), `${key} keeps ${placeholder}`);
      assert.ok(out.length >= text.length * 1.3, `${key} is lengthened`);
    }
  }
  assert.match(translate("en-XA", "tabs.turns", { count: 2 }), /^\[2 /);
});

// No interface string is written into a component: every JSX text and every
// aria-label, placeholder, title and alt literal in components/game and the
// page shell comes from the catalogue. Read with the TypeScript parser, not a
// pattern, so generics and arrows are not mistaken for text.
function hardCoded() {
  const files = [...readdirSync(new URL("../components/game/", import.meta.url)).filter(name => name.endsWith(".tsx")).map(name => `../components/game/${name}`), "../app/page.tsx"];
  const found: string[] = [];
  for (const file of files) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (node: ts.Node) => {
      if (ts.isJsxText(node) && /[A-Za-z]{2,}/.test(node.getText())) found.push(`${file}: ${node.getText().trim().slice(0, 60)}`);
      if (ts.isJsxAttribute(node) && ["aria-label", "placeholder", "title", "alt"].includes(node.name.getText()) && node.initializer && ts.isStringLiteral(node.initializer) && /[A-Za-z]{2,}/.test(node.initializer.text)) found.push(`${file}: ${node.name.getText()}="${node.initializer.text}"`);
      ts.forEachChild(node, visit);
    };
    visit(tree);
  }
  return found;
}
test("no interface string is written into a component", () => {
  assert.deepEqual(hardCoded(), [], "move it into the component's catalogue in lib/i18n/en/ and read it with t()");
});

// A component's strings travel with it: every key a file reads is in the shared
// base or in the catalogue that file registers, so a lazily loaded dialog never
// shows a bare key, and no key is defined twice with different words.
test("every key a component reads is in the base or its own catalogue", () => {
  const files = [...readdirSync(new URL("../components/game/", import.meta.url)).filter(name => name.endsWith(".tsx")).map(name => `../components/game/${name}`), "../app/page.tsx"];
  const missing: string[] = [];
  for (const file of files) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    const stem = source.match(/from "@\/lib\/i18n\/en\/([a-z-]+)"/)?.[1];
    const own = stem ? catalogues[stem] : {};
    for (const [, key] of source.matchAll(/\b(?:t|textFor)\("([^"]+)"/g)) if (!(key in en) && !(key in own)) missing.push(`${file}: ${key}`);
  }
  assert.deepEqual(missing, []);
  const seen = new Map<string, unknown>();
  for (const [key, value] of every) {
    if (seen.has(key)) assert.deepEqual(value, seen.get(key), `${key} has one wording`);
    seen.set(key, value);
  }
  assert.equal(Object.keys(catalogues).length, readdirSync(new URL("../lib/i18n/en/", import.meta.url)).length, "keys.ts lists every catalogue");
});
