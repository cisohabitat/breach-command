// The message catalogue: interpolation, plurals and numbers through Intl, the
// pseudo-locale, and a ratchet on the strings still written into components.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { en } from "../lib/i18n/en.ts";
import { formatNumber, pseudo, translate } from "../lib/i18n/index.ts";

test("messages interpolate, pluralise by Intl and format numbers", () => {
  assert.equal(translate("en", "tabs.stages", { found: 3 }), "3 of 4 stages");
  assert.equal(translate("en", "tabs.turns", { count: 1 }), "1 turn");
  assert.equal(translate("en", "tabs.turns", { count: 4 }), "4 turns");
  assert.equal(translate("en", "tabs.turns", { count: 0 }), "0 turns");
  assert.equal(formatNumber("en", 12500), "12,500");
  assert.equal(translate("en", "window.remaining", {}), "of {limit} turns remaining", "a missing parameter is left visible, not blanked");
  for (const [key, value] of Object.entries(en)) {
    if (typeof value === "string") assert.ok(value.trim(), `${key} has text`);
    else assert.ok(value.other, `${key} has an "other" form`);
  }
});

test("the pseudo-locale lengthens every string by about a third and keeps its placeholders", () => {
  for (const [key, value] of Object.entries(en)) {
    for (const text of typeof value === "string" ? [value] : Object.values(value)) {
      const out = pseudo(text);
      for (const placeholder of text.match(/\{[a-zA-Z]+\}/g) ?? []) assert.ok(out.includes(placeholder), `${key} keeps ${placeholder}`);
      assert.ok(out.length >= text.length * 1.3, `${key} is lengthened`);
    }
  }
  assert.match(translate("en-XA", "tabs.turns", { count: 2 }), /^\[2 /);
});

// Strings still written into components rather than the catalogue: JSX text
// and the aria-label, placeholder and title attributes. The count may only
// fall; lower it here as components move onto the catalogue.
const CEILING = 441;
function hardCoded() {
  const files = [...readdirSync(new URL("../components/game/", import.meta.url)).filter(name => name.endsWith(".tsx")).map(name => `../components/game/${name}`), "../app/page.tsx"];
  let count = 0;
  for (const file of files) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    for (const match of source.matchAll(/>([^<>{}]*[A-Za-z]{2,}[^<>{}]*)</g)) {
      const text = match[1].trim();
      if (text && !text.startsWith("//") && !text.includes("=>") && !text.includes("&&")) count++;
    }
    count += (source.match(/\b(aria-label|placeholder|title)="[^"]*[A-Za-z]{2,}[^"]*"/g) ?? []).length;
  }
  return count;
}
test("no more strings are written into components than before", () => {
  const count = hardCoded();
  assert.ok(count <= CEILING, `${count} hard-coded strings, ceiling ${CEILING}`);
});
