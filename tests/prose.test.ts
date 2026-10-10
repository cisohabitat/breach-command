// The English the engine composes is recorded as one hash (scripts/prose-check.ts):
// moving its sentences into the catalogue, or any other change to the engine,
// must leave every word where it was unless the record moves on purpose.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";

test("the engine's composed prose reads as recorded", () => {
  const output = execFileSync(process.execPath, ["scripts/prose-check.ts"], { cwd: new URL("..", import.meta.url), encoding: "utf8" });
  assert.match(output, /Composed prose unchanged/);
});
