import assert from "node:assert/strict";
import { test } from "node:test";
import { correlateEvidence, getConfidenceChanges, getEvidenceAssessment, newGame, playTurn, setHypothesis, type Game } from "../lib/advanced-game.ts";
import { parseSession, serialiseSession } from "../lib/session.ts";

function collect(source: string, intensity: "rapid" | "balanced" | "exhaustive") {
  const game = setHypothesis({ ...newGame(0, "training", () => 0), chain: ["phish", "spray", "task", "https"], injectDeck: [] }, "endpoint");
  return playTurn(game, source, 18, { scope: "focused", intensity });
}

test("signal and confidence vary independently, without using roll magnitude", () => {
  const combinations = new Set<string>();
  for (const source of ["email", "cloud"]) for (const intensity of ["balanced", "exhaustive"] as const) {
    const game = collect(source, intensity);
    assert.equal(game.evidence.length, 1);
    const item = game.evidence[0];
    const read = getEvidenceAssessment(game, item);
    assert.equal(read.signal, item.supports ? "strong" : "weak");
    assert.equal(read.confidence, intensity === "exhaustive" ? "strong" : "weak");
    combinations.add(`${read.signal}/${read.confidence}`);
    assert.deepEqual(getEvidenceAssessment({ ...game, chain: ["token", "role", "vault", "apikey"], objective: "fraud", turns: game.turns.map(turn => ({ ...turn, raw: 20, total: 99 })) }, item), read);
  }
  assert.equal(combinations.size, 4, "all four combinations arise from actual completed checks");
  const rapid = collect("email", "rapid");
  assert.equal(getEvidenceAssessment(rapid, rapid.evidence[0]).confidence, "weak");
});

test("only a supported causal comparison across different sources strengthens interpretation", () => {
  const first = collect("email", "balanced");
  const second = { ...first.evidence[0], id: "E2-identity", supports: "spray", turn: 2, confidence: "LOW" as const };
  const game: Game = { ...first, pendingDecision: null, evidence: [...first.evidence, second] };
  const before = JSON.stringify(game);
  const compared = correlateEvidence(game, [game.evidence[0].id, second.id], "causal");
  assert.deepEqual(getConfidenceChanges(compared, 0).map(item => item.id), game.evidence.map(item => item.id));
  assert.deepEqual(getConfidenceChanges(compared, 1), []);
  const thorough: Game = { ...game, turns: game.turns.map(turn => ({ ...turn, plan: { ...turn.plan, intensity: "exhaustive" } })) };
  const oneGain = correlateEvidence(thorough, [game.evidence[0].id, second.id], "causal");
  assert.deepEqual(getConfidenceChanges(oneGain, 0).map(item => item.id), [second.id], "a finding already at strong confidence is not counted again");
  assert.deepEqual(getConfidenceChanges({ ...compared, correlations: [...compared.correlations, compared.correlations[0]] }, 1), [], "an already corroborated finding is not reported as a new gain");
  for (const item of compared.evidence) assert.equal(getEvidenceAssessment(compared, item).confidence, "strong");
  assert.equal(JSON.stringify(game), before, "assessment and comparison preserve the input state");
  const wrong = correlateEvidence(game, [game.evidence[0].id, second.id], "coincidental");
  assert.deepEqual(getConfidenceChanges(wrong, 0), []);
  assert.equal(getEvidenceAssessment(wrong, game.evidence[0]).confidence, "weak");
  const sameSource: Game = { ...game, evidence: [game.evidence[0], { ...second, id: "E2-email" }] };
  const repeated = correlateEvidence(sameSource, [sameSource.evidence[0].id, "E2-email"], "causal");
  assert.deepEqual(getConfidenceChanges(repeated, 0), []);
  assert.equal(getEvidenceAssessment(repeated, repeated.evidence[0]).confidence, "weak");
  const unrelated = { ...game, evidence: [game.evidence[0], { ...second, supports: null }] };
  const coincidence = correlateEvidence(unrelated, [unrelated.evidence[0].id, second.id], "coincidental");
  assert.equal(getEvidenceAssessment(coincidence, coincidence.evidence[0]).confidence, "weak");
  const restored = parseSession(serialiseSession(compared, true, false));
  assert.ok(restored);
  assert.deepEqual(getEvidenceAssessment(restored.game, restored.game.evidence[0]), getEvidenceAssessment(compared, compared.evidence[0]));
});

test("partner confidence is not borrowed from collection on the same turn; failures make no finding", () => {
  const game = collect("email", "rapid");
  const partner = { ...game.evidence[0], id: "E1-partner", confidence: "HIGH" as const };
  assert.equal(getEvidenceAssessment(game, partner).confidence, "strong");
  assert.equal(getEvidenceAssessment(game, partner).basis, "recorded");
  const failed = playTurn({ ...newGame(0, "training", () => 0), injectDeck: [] }, "email", 1);
  assert.equal(failed.evidence.length, 0);
});
