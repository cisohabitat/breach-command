import assert from "node:assert/strict";
import { test } from "node:test";
import { attacks, getHypothesisLedger, getRecoveryRemainder, getScoreBreakdown, getScoreRows, newGame, playTurn, resolveDecision, setHypothesis, type Game } from "../lib/advanced-game.ts";
import { codedPlaytestGame as coded, negativePlaytestGame as negativePath } from "./playtest-fixtures.ts";
import { parseSession, serialiseSession } from "../lib/session.ts";
import { emptyLearning, parseLearning } from "../lib/learning.ts";
import { practiceCases } from "../lib/practice.ts";
import { say } from "../lib/i18n/message.ts";
import "../lib/i18n/engine-messages.ts";

test("the reported four-turn failure earns partial completion and testing credit, not two perfect components", () => {
  const game = negativePath();
  assert.equal(game.status, "lost");
  assert.equal(game.impact, 100);
  assert.equal(game.continuity, 91);
  assert.equal(game.sectorHealth, 47);
  assert.equal(game.turns.length, 4);
  assert.equal(game.revealed.length, 1);
  assert.equal(getScoreBreakdown({ ...game, scoringVersion: undefined }).total, 52, "the original rules reproduce the reported total");
  const score = getScoreBreakdown(game);
  assert.equal(score.investigation, 6);
  assert.equal(score.hypothesis, 1);
  assert.equal(score.total, 24);
  const ledger = getHypothesisLedger(game);
  assert.ok(ledger.every(row => row.matched && !row.discriminating), "all four predictions were right but the sources could not expose the target");
  assert.deepEqual(ledger.map(row => row.credit), [0.25, 0, 0, 0]);
  assert.match(say(ledger[0].verdict), /could not test.*quarter/);
  assert.match(say(ledger[3].verdict), /no further credit/);
  assert.match(say(getScoreRows(game)[0].rule), /1\/4 confirmed stages and round to the nearest point: 6\/25/);
});

test("a complete chain keeps its pace credit, while no confirmed stage earns no completion credit", () => {
  const game = negativePath();
  assert.equal(getScoreBreakdown({ ...game, revealed: [] }).investigation, 0);
  assert.equal(getScoreBreakdown({ ...game, revealed: [...game.chain] }).investigation, 25);
});

test("a useful source paired with the correct reading keeps full analytical credit even when the dice fail", () => {
  for (const roll of [1, 18]) {
    const game = playTurn(setHypothesis(coded(), "cloud"), "cloud", roll);
    assert.equal(game.turns[0].hypothesisMatched, true);
    assert.equal(game.turns[0].discriminating, true);
    assert.equal(getHypothesisLedger(game)[0].credit, 1);
  }
});

test("the exhaustive discovery explains 19 + 3 + 5 - 7 = 20 without changing the rules", () => {
  let game = newGame(0, "training", () => 0);
  const source = attacks.find(attack => attack.id === game.chain[0])!.detect[0];
  game = playTurn({ ...game, impact: 19, injectDeck: [] }, source, 18, { scope: "focused", intensity: "exhaustive" });
  assert.equal(game.impact, 20);
  const movement = game.turns[0].movement!;
  assert.equal(movement.before.impact, 19);
  assert.equal(movement.after.impact, 20);
  assert.deepEqual(movement.parts.filter(part => part.changes.impact).map(part => [part.kind, part.changes.impact]), [["turn", 3], ["plan", 5], ["discovery", -7]]);
  for (const turn of negativePath().turns) for (const key of ["impact", "continuity", "sector", "objective"] as const) {
    const m = turn.movement!;
    assert.equal(m.before[key] + m.parts.reduce((sum, part) => sum + part.changes[key], 0), m.after[key]);
  }
  assert.ok(negativePath().turns.at(-1)!.movement!.parts.some(part => part.kind === "limits"), "the capped loss records the limit adjustment");
});

test("new recorded calculations and decision snapshots survive saves; fabricated calculations are rejected", () => {
  const game = negativePath(3);
  const restored = parseSession(serialiseSession(game, true, true))!.game;
  assert.deepEqual(restored.turns.map(turn => turn.movement), game.turns.map(turn => turn.movement));
  assert.deepEqual(restored.decisions[0].context, game.decisions[0].context);
  assert.ok(restored.decisions[0].context!.turn === 2);
  const original = JSON.parse(serialiseSession(game, true, true));
  for (const tamper of [
    save => { save.game.turns[0].movement.after.impact++; },
    save => { save.game.turns[0].movement.parts[0].kind = "hidden-answer"; },
    save => { save.game.turns[0].movement.parts[0].changes.impact = 201; },
    save => { save.game.decisions[0].context.turn = 100; },
    save => { save.game.scoringVersion = 3; },
  ] as ((save: typeof original) => void)[]) {
    const corrupt = structuredClone(original); tamper(corrupt);
    assert.equal(parseSession(JSON.stringify(corrupt)), null);
  }
});

test("older operations retain their score model and do not acquire invented meter provenance", () => {
  const save = JSON.parse(serialiseSession(negativePath(3), true, false));
  save.version = 21;
  delete save.game.scoringVersion;
  save.game.turns.forEach((turn: Game["turns"][number]) => { delete turn.movement; });
  save.game.decisions.forEach((record: Game["decisions"][number]) => { delete record.context; });
  const loaded = parseSession(JSON.stringify(save))!.game;
  assert.equal(loaded.scoringVersion, undefined);
  assert.ok(loaded.turns.every(turn => turn.movement === undefined));
  assert.ok(loaded.decisions.every(record => record.context === undefined));
  assert.equal(getScoreBreakdown(loaded).investigation, 25);
  assert.equal(getScoreBreakdown(loaded).hypothesis, 10);
});

test("the reproduced Crisis cadence names investigation rather than an intervention the player never made", () => {
  let game = setHypothesis(coded(0), "identity");
  game = resolveDecision(playTurn(game, "firewall"), "attribute");
  game = playTurn(game, "hunt");
  assert.deepEqual(game.turns.map(turn => turn.raw), [15, 16]);
  assert.equal(game.adversaryMemory.actChoices, 0);
  assert.equal(game.mapHistory.length, 0);
  const update = say(game.turns[1].adversaryEvent!);
  assert.match(update, /investigation becomes detectable/);
  assert.doesNotMatch(update, /after detecting intervention/);
});

test("zero impact and moderate recovery uncertainty remain separate, with a concrete explanation", () => {
  const game: Game = { ...coded(0), status: "won", impact: 0, responseChoices: ["credential", "verify", "restore"] };
  assert.match(say(getRecoveryRemainder(game)!), /outside the validated backups may remain/);
  assert.match(say(getRecoveryRemainder(game)!), /impact 0\/100.*not zero residual risk/);
});

test("notebook v1 migrates without changing earlier answers; advanced lineage is separately versioned", () => {
  const old = { ...emptyLearning(), version: 1, attempts: [{ at: 1, lesson: "confidence", answers: [0, 2, 1] }] };
  const migrated = parseLearning(old)!;
  assert.equal(migrated.version, 2);
  assert.deepEqual(migrated.attempts, old.attempts);
  assert.deepEqual(practiceCases.lineage.map(question => question.correct), [2, 0, 1]);
  assert.equal(parseLearning({ ...old, attempts: [{ at: 1, lesson: "lineage", answers: [2, 0, 1] }] }), null);
  assert.ok(parseLearning({ ...migrated, attempts: [{ at: 1, lesson: "lineage", answers: [2, 0, 1] }] }));
});
