import assert from "node:assert/strict";
import { test } from "node:test";
import { newGame } from "../lib/advanced-game.ts";
import { getResumeBrief } from "../lib/resume-brief.ts";

test("resume orientation preserves direct decision entry without reading hidden answers", () => {
  const game = newGame(0, "training", () => 0);
  Object.defineProperty(game, "chain", { get() { throw new Error("hidden chain read"); } });
  assert.equal(getResumeBrief(game)?.next, "gameScreen.resumeReading");
  assert.equal(getResumeBrief(Object.assign(Object.create(game), { hypothesis: "identity" }))?.next, "gameScreen.resumeInvestigate");
  for (const patch of [{ status: "response" }, { status: "won" }, { pendingSetPiece: "sector-0-a" }, { pendingCommand: "event" }, { pendingDecision: "stage" }]) {
    assert.equal(getResumeBrief(Object.assign(Object.create(game), patch)), null, "pending decisions take the player directly to their existing task");
  }
  assert.equal(getResumeBrief(game)?.last, null);
  assert.equal(getResumeBrief(game)?.checks, 0);
});
