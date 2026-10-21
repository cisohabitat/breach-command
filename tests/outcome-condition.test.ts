import assert from "node:assert/strict";
import { test } from "node:test";
import { attacks, attackVector, getOutcome, newGame, playTurn, resolveDecision, responseOptionsFor, resolveResponse, setHypothesis, type Game } from "../lib/advanced-game.ts";
import { captainDebriefFor } from "../lib/captain-debrief.ts";
import { CONTINUITY_AT_RISK } from "../lib/meter-thresholds.ts";
import { en } from "./english.ts";

test("a high score cannot praise service protection when recovery leaves service at risk", () => {
  const initial = { ...newGame(0, "training", () => 0), injectDeck: [] };
  const finding = attacks.find(attack => attack.id === initial.chain[0])!;
  const checked = playTurn(setHypothesis(initial, attackVector(finding.id)), finding.detect[0], 20);
  const decided = resolveDecision(checked, "act");
  let game: Game = { ...decided, status: "response", impact: 0, continuity: 78, sectorHealth: 98, responseScore: 0 };
  for (const choice of ["isolate", "verify", "rebuild"]) game = resolveResponse(game, choice);
  assert.equal(game.status, "won");
  assert.equal(game.continuity, CONTINUITY_AT_RISK);
  const outcome = getOutcome(game);
  assert.equal(outcome.grade, "A");
  assert.match(en(outcome.title), /service at risk/);
  assert.match(en(outcome.detail), /45\/100.*98\/100.*residual risk: low/);
  assert.doesNotMatch(en(outcome.detail), /strong operational judgement|balanced/);
  assert.equal(captainDebriefFor(game, outcome.grade, responseOptionsFor(game).recovery.find(option => option.id === game.responseChoices[2])?.residual)[0], "reviewServices");
  assert.equal(new Set(captainDebriefFor(game, outcome.grade)).size, 3);
  const healthier = getOutcome({ ...game, continuity: CONTINUITY_AT_RISK + 1 });
  assert.doesNotMatch(en(healthier.title), /service at risk/);
});

test("the verdict names high recovery risk without changing the score or grade", () => {
  const base = newGame(1, "training", () => 0);
  const recovery = responseOptionsFor(base).recovery.find(option => option.residual === "High")!;
  assert.ok(recovery);
  const game = { ...base, status: "won" as const, continuity: 90, sectorHealth: 90, responseScore: 55, responseChoices: ["isolate", "verify", recovery.id] };
  const outcome = getOutcome(game);
  assert.match(en(outcome.title), /high residual risk/);
  assert.match(en(outcome.detail), /90\/100.*residual risk: high/);
  assert.equal(outcome.grade, getOutcome({ ...game, status: "response" }).grade);
  assert.deepEqual(outcome.breakdown, getOutcome({ ...game, status: "response" }).breakdown);
  assert.equal(captainDebriefFor(game, outcome.grade, recovery.residual)[0], "reviewServices");
});
