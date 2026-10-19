import assert from "node:assert/strict";
import { test } from "node:test";
import { newGame, responseOptionsFor, type Game } from "../lib/advanced-game.ts";
import { reviewChoices } from "../lib/review-choices.ts";
import { lit } from "../lib/i18n/message.ts";

const decision = (quality: number, change: number): Game["decisions"][number] => ({
  stage: "stage", choice: "observe", title: lit("Recorded observation"), effect: lit("Recorded effect"),
  counterfactual: lit("Alternative"), adaptedFrom: null, adaptedTo: null, adaptationReason: null,
  quality, rationale: lit("Assessed reason"), impactChange: change, continuityChange: 0,
  sectorChange: 0, objectiveChange: 0, tempoChange: 0,
});

test("choice highlights are unavailable during live play and never inspect hidden answers", () => {
  for (const status of ["playing", "response"] as const) {
    const game = { ...newGame(0, "training", () => 0), status };
    Object.defineProperty(game, "chain", { get() { throw new Error("must not inspect answers during play"); } });
    assert.deepEqual(reviewChoices(game), []);
  }
});

test("review prioritises weak assessments then recorded pressure movement without mutating history", () => {
  const game = { ...newGame(0, "training", () => 0), status: "lost" as const,
    decisions: [decision(5, 80), decision(1, 3), decision(1, -20), decision(2, 40)] };
  const before = structuredClone(game);
  const rows = reviewChoices(game);
  assert.deepEqual(rows.map(row => row.id), ["decision-2", "decision-1", "decision-3"]);
  assert.deepEqual(rows[0].effect, game.decisions[2].effect);
  assert.deepEqual(rows[0].reason, game.decisions[2].rationale);
  assert.deepEqual(game, before);
});

test("short and empty reviews never invent choices, grades or event timestamps", () => {
  const game = { ...newGame(0, "training", () => 0), status: "exercise" as const };
  assert.deepEqual(reviewChoices(game), []);
  const profile = responseOptionsFor(game);
  const responseChoices = [profile.containment[1].id, profile.assurance[0].id];
  const rows = reviewChoices({ ...game, responseChoices });
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map(row => row.title), [lit(profile.containment[1].title), lit(profile.assurance[0].title)]);
  assert.ok(rows.every(row => row.reason === null && !("turn" in row) && !("quality" in row) && !("movement" in row)));
});

test("weak command and sector calls participate without fabricated movement", () => {
  const game: Game = { ...newGame(0, "training", () => 0), status: "lost",
    decisions: [decision(5, 90)],
    commandHistory: [{ event: "provider", choice: "b", title: lit("Provider call"), effect: lit("Actual event effect"), quality: 1 }],
    setPieceHistory: [{ event: "sector-0", choice: "a", title: lit("Sector call"), effect: lit("Actual sector effect"), quality: 2 }] };
  assert.deepEqual(reviewChoices(game).map(row => row.id), ["command-0", "sector-0", "decision-0"]);
  assert.ok(reviewChoices(game).slice(0, 2).every(row => !("movement" in row) && row.reason === null));
});
