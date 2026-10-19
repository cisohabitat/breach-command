import assert from "node:assert/strict";
import { test } from "node:test";
import { newGame } from "../lib/advanced-game.ts";
import { getResumeBrief } from "../lib/resume-brief.ts";

test("resume orientation follows public blocking tasks without reading hidden answers", () => {
  const game = newGame(0, "training", () => 0);
  Object.defineProperty(game, "chain", { get() { throw new Error("hidden chain read"); } });
  assert.equal(getResumeBrief(game).next, "gameScreen.resumeReading");
  assert.equal(getResumeBrief(Object.assign(Object.create(game), { hypothesis: "identity" })).next, "gameScreen.resumeInvestigate");
  for (const [patch, next] of [
    [{ status: "response", responseChoices: [] }, "gameScreen.resumeContainment"],
    [{ status: "response", responseChoices: ["chosen"] }, "gameScreen.resumeAssurance"],
    [{ status: "response", responseChoices: ["chosen", "chosen"] }, "gameScreen.resumeRecovery"],
    [{ pendingSetPiece: "sector-0-a" }, "gameScreen.resumeSector"],
    [{ pendingCommand: "event" }, "gameScreen.resumeCommand"],
    [{ pendingDecision: "stage" }, "gameScreen.resumeEvidence"],
  ] as const) assert.equal(getResumeBrief(Object.assign(Object.create(game), patch)).next, next);
  assert.equal(getResumeBrief(game).last, null);
  assert.equal(getResumeBrief(game).checks, 0);
});
