import assert from "node:assert/strict";
import { test } from "node:test";
import { retryableLoad } from "../lib/game-loader.ts";

test("a failed module download can be retried and successful loads stay shared", async () => {
  let attempts = 0;
  const loaded = { ready: true };
  const load = retryableLoad(async () => {
    if (++attempts === 1) throw new Error("Connection interrupted");
    return loaded;
  });
  const first = load();
  assert.equal(load(), first, "concurrent callers share the download");
  await assert.rejects(first, /Connection interrupted/);
  const second = load();
  assert.notEqual(second, first, "a rejection does not poison the next attempt");
  assert.equal(await second, loaded);
  assert.equal(load(), second, "a successful module is kept");
  assert.equal(attempts, 2);
});
