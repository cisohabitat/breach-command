// The stylesheet is written in logical properties, so a right-to-left locale
// is a catalogue rather than a restyle. In a left-to-right page they render
// exactly as the physical ones did: the conversion (scripts/logical-css.py)
// changed no pixel of the visual baselines.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// Both sheets: the page's and the game's (components/game/game.css).
const css = ["../app/globals.css", "../components/game/game.css"].flatMap(path => readFileSync(new URL(path, import.meta.url), "utf8").split("\n"));

test("the stylesheet uses logical properties for every inline-direction declaration", () => {
  const physical = /^\s*(margin-(left|right)|padding-(left|right)|border-(left|right)(-[a-z]+)?|left|right|border-(top|bottom)-(left|right)-radius)\s*:/;
  const aligned = /^\s*(text-align|float)\s*:\s*(left|right)\b/;
  const offenders = css.map((line, index) => ({ line, number: index + 1 })).filter(({ line }) => physical.test(line) || aligned.test(line));
  assert.deepEqual(offenders.map(({ number, line }) => `${number}: ${line.trim()}`), [], "write margin-inline-start, inset-inline-end, text-align:start and their kin");
});

test("no four-value shorthand sets left and right differently", () => {
  const offenders = css.filter(line => {
    const match = line.match(/^\s*(margin|padding|inset)\s*:\s*([^;!]+)/);
    if (!match || match[2].includes("(")) return false;
    const parts = match[2].trim().split(/\s+/);
    return parts.length === 4 && parts[1] !== parts[3];
  });
  assert.deepEqual(offenders.map(line => line.trim()), [], "split it into -block and -inline");
});
