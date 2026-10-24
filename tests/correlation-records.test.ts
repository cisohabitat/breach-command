import assert from "node:assert/strict";
import { test } from "node:test";
import { correlateEvidence, getEvidenceAssessment, newGame, playTurn, responseOptionScore, responseOptionsFor, resolveResponse, setHypothesis, type EvidenceItem, type Game } from "../lib/advanced-game.ts";
import { parseSession, serialiseSession } from "../lib/session.ts";
import { lit } from "../lib/i18n/message.ts";

const finding = (id: string, supports: string | null, record: string, parent: string): EvidenceItem => ({
  id, supports, turn: Number(id[1]), title: lit(id), source: lit(id), system: lit("Boundary"), confidence: "MODERATE", detail: lit("Recorded activity"),
  ...(supports ? { trace: { record, parent } } : {}),
});
function incident(evidence: EvidenceItem[]): Game {
  return { ...newGame(0, "training", () => 0), evidence, impact: 50, objectiveProgress: 50, nextModifier: 0 };
}

test("recorded initiation, rather than stage, route or hidden state, determines a causal link", () => {
  const first = finding("E1-email", "phish", "A", "X");
  const adjacent = finding("E2-identity", "spray", "B", "Y");
  const remote = finding("E3-server", "task", "C", "A");
  const game = incident([first, adjacent, remote]);
  assert.equal(correlateEvidence(game, [first.id, adjacent.id], "causal").correlations[0].valid, false, "adjacent stages on one route do not prove causation");
  const linked = correlateEvidence(game, [first.id, remote.id], "causal");
  assert.equal(linked.correlations[0].valid, true, "an explicit reference can skip a stage and cross routes");
  const changed = correlateEvidence({ ...game, chain: ["token", "role", "vault", "apikey"], evidence: [
    { ...first, supports: "apikey" }, adjacent, { ...remote, supports: "token" },
  ] }, [first.id, remote.id], "causal");
  assert.equal(changed.correlations[0].valid, true);
  assert.deepEqual(changed.correlations[0].finding, linked.correlations[0].finding);
  assert.equal(getEvidenceAssessment(linked, first).confidence, "strong");
});

test("an empty finding cannot print comparison rewards against multiple earlier findings", () => {
  const evidence = [finding("E1-email", "phish", "A", "X"), finding("E2-identity", "spray", "B", "A"), finding("E3-server", null, "", "")];
  let game = incident(evidence);
  const before = JSON.stringify(game);
  for (const earlier of evidence.slice(0, 2)) game = correlateEvidence(game, [earlier.id, evidence[2].id], "coincidental");
  assert.equal(game.impact, 50);
  assert.equal(game.objectiveProgress, 50);
  assert.equal(game.nextModifier, 0);
  assert.ok(game.correlations.every(record => record.correct && !record.effects?.rewarded));
  assert.equal(JSON.stringify(incident(evidence)), before, "the input is unchanged");
});

test("linking already corroborated groups pays nothing, even when earlier roll rewards were capped", () => {
  const evidence = [finding("E1-email", "phish", "A", "X"), finding("E2-identity", "spray", "B", "A"), finding("E3-server", "task", "C", "B"), finding("E4-network", "https", "D", "C")];
  let game = { ...incident(evidence), nextModifier: 3 };
  game = correlateEvidence(game, [evidence[0].id, evidence[1].id], "causal");
  game = correlateEvidence(game, [evidence[2].id, evidence[3].id], "causal");
  assert.ok(game.correlations.every(record => record.effects?.rewarded && record.effects.roll === 0));
  const { impact, objectiveProgress } = game;
  game = correlateEvidence(game, [evidence[1].id, evidence[2].id], "causal");
  assert.equal(game.impact, impact);
  assert.equal(game.objectiveProgress, objectiveProgress);
  assert.equal(game.correlations[2].valid, true);
  assert.equal(game.correlations[2].effects?.rewarded, false);
});

test("single-source comparisons cannot earn independent corroboration or pressure relief", () => {
  const first = finding("E1-email", "phish", "A", "X"), second = finding("E2-email", "spray", "B", "A");
  const game = correlateEvidence(incident([first, second]), [first.id, second.id], "causal");
  assert.equal(game.correlations[0].correct, true);
  assert.equal(game.correlations[0].effects?.rewarded, false);
  assert.equal(game.impact, 50);
  assert.equal(getEvidenceAssessment(game, first).confidence, "weak");
});

test("comparison records store actual relief and penalties at meter and roll limits", () => {
  const evidence = [finding("E1-email", "phish", "A", "X"), finding("E2-identity", "spray", "B", "A")];
  const relieved = correlateEvidence({ ...incident(evidence), impact: 1, objectiveProgress: 2, nextModifier: 2 }, [evidence[0].id, evidence[1].id], "causal");
  assert.deepEqual(relieved.correlations[0].effects, { impact: -1, objective: -2, roll: 1, rewarded: true });
  const disputed = correlateEvidence({ ...incident(evidence), impact: 99, objectiveProgress: 99 }, [evidence[0].id, evidence[1].id], "coincidental");
  assert.deepEqual(disputed.correlations[0].effects, { impact: 1, objective: 1, roll: 0, rewarded: false });
});

test("new records and paid-reward markers survive saves; malformed provenance and effects are refused", () => {
  let game = setHypothesis({ ...newGame(0, "training", () => 0), injectDeck: [] }, "identity");
  game = playTurn(game, "email", 18);
  assert.ok(game.evidence[0].trace);
  const save = JSON.parse(serialiseSession(game, true, false));
  assert.deepEqual(parseSession(JSON.stringify(save))?.game.evidence[0].trace, game.evidence[0].trace);
  for (const trace of [{ record: {}, parent: "A" }, { record: "A", parent: "A" }, { record: "A", parent: "x".repeat(65) }]) {
    assert.equal(parseSession(JSON.stringify({ ...save, game: { ...game, evidence: [{ ...game.evidence[0], trace }] } })), null);
  }
  assert.equal(parseSession(JSON.stringify({ ...save, game: { ...game, comparisonVersion: 3 } })), null);
  const first = finding("E1-email", "phish", "A", "X"), second = finding("E2-identity", "spray", "B", "A");
  const compared = correlateEvidence(incident([first, second]), [first.id, second.id], "causal");
  const restored = parseSession(serialiseSession(compared, true, false));
  assert.deepEqual(restored?.game.correlations[0].effects, compared.correlations[0].effects);
  const corrupt = JSON.parse(serialiseSession(compared, true, false));
  corrupt.game.correlations[0].effects.roll = 100;
  assert.equal(parseSession(JSON.stringify(corrupt)), null);
});

test("response advice and resolution include the same sector and objective bonuses", () => {
  const game = { ...newGame(0, "training", () => 0), status: "response" as const, objective: "exfiltration" as const, responseChoices: ["monitor"], responseScore: 0 };
  const options = responseOptionsFor(game).assurance;
  assert.equal(responseOptionScore(game, 1, options.find(option => option.id === "verify")!), 17);
  assert.equal(responseOptionScore(game, 1, options.find(option => option.id === "preserve")!), 20);
  for (const option of options) assert.equal(resolveResponse(game, option.id).responseScore, responseOptionScore(game, 1, option));
});
