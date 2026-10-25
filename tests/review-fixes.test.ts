// The game review of 25 October 2026: replayed codes that paid every time,
// abandoned operations that cost nothing, a reading re-declared before every
// roll, restored backups that wrote any score into the campaign, and sector
// decisions solved by always taking the first measure.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { attackVector, attacks, getModifierBreakdown, hypotheses, hypothesisSources, newGame, playTurn, procedures, resolveDecision, setHypothesis, type Game } from "../lib/advanced-game.ts";
import { campaignChanges, defaultCampaign, isRehearsal, parseCampaign, recordCampaignResult, recordCampaignWithdrawal } from "../lib/campaign.ts";
import { isCampaignBackup } from "../lib/campaign-backup.ts";
import { parseSession } from "../lib/session.ts";
import { en } from "./english.ts";

const won = (seed: number | null): Game => ({ ...newGame(3, "operational", () => 0, { mode: "daily", seed }), status: "won" });

test("a reproducible operation counts once in the campaign", () => {
  const first = recordCampaignResult(defaultCampaign, won(123), 85);
  assert.ok(first.xp > 0 && first.completed.includes(3));
  assert.ok(isRehearsal(first, won(123)));
  const again = recordCampaignResult(first, won(123), 85);
  assert.equal(again, first, "the same case and seed change nothing the second time");
  assert.deepEqual(en(campaignChanges(first, again, won(123), 85)), ["A replay of an operation already recorded; its chain and dice were known, so the campaign is unchanged."]);
  assert.ok(recordCampaignResult(first, won(124), 85).xp > first.xp, "another seed is another operation");
  assert.ok(recordCampaignResult(first, won(null), 85).xp > first.xp, "an unseeded operation is never a replay");
  assert.deepEqual(parseCampaign(JSON.stringify(first)).rehearsed, first.rehearsed, "the record survives a reload");
  assert.ok(isCampaignBackup(first, 10), "and an export");
});

test("leaving an operation after its first turn is recorded as a loss", () => {
  const start = { ...defaultCampaign, leadershipTrust: 62, readiness: 58, streak: 4, unresolvedThreads: 1, xp: 300 };
  const left = recordCampaignWithdrawal(start, { scenario: 2, seed: null });
  assert.deepEqual([left.leadershipTrust, left.readiness, left.streak, left.unresolvedThreads, left.xp, left.operations], [54, 55, 0, 2, 300, 1]);
  const lost = recordCampaignResult(start, { ...newGame(2, "operational", () => 0), status: "lost" }, 30);
  assert.deepEqual([lost.leadershipTrust, lost.readiness, lost.streak, lost.unresolvedThreads], [left.leadershipTrust, left.readiness, left.streak, left.unresolvedThreads], "the same cost to standing as a loss");
  const seeded = recordCampaignWithdrawal(start, { scenario: 2, seed: 9 });
  assert.equal(recordCampaignResult(seeded, { ...won(9), scenario: 2 }, 90), seeded, "leaving a code and replaying it earns nothing");
});

test("a campaign result is bounded whatever score reaches it", () => {
  for (const score of [Number.NaN, 1e6, -5]) {
    const result = recordCampaignResult(defaultCampaign, won(null), score);
    assert.ok(Number.isFinite(result.xp) && result.xp <= 200, `xp from ${score} is ${result.xp}`);
    assert.ok(isCampaignBackup(result, 10), "the campaign can still be exported");
  }
});

test("a campaign keeps each existing case once", () => {
  const parsed = parseCampaign(JSON.stringify({ completed: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 99, -1, 1.5, 2] }), 10);
  assert.deepEqual(parsed.completed, [0, 2]);
  assert.ok(isCampaignBackup(parsed, 10));
});

test("a restored operation cannot widen its window or score beyond the grades", () => {
  const save = JSON.parse(readFileSync(new URL("./fixtures/saves/session-v23.json", import.meta.url), "utf8"));
  const restore = (change: (game: Record<string, unknown>) => void) => {
    const copy = structuredClone(save);
    change(copy.game);
    return parseSession(JSON.stringify(copy));
  };
  const forged = restore(game => {
    (game.decisions as { quality: number }[])[0].quality = 1e6;
    game.turnLimit = 9999;
    game.mapActionsRemaining = 1e6;
  })!;
  assert.equal(forged.game.decisions[0].quality, 5);
  assert.equal(forged.game.turnLimit, 12);
  assert.equal(forged.game.mapActionsRemaining, 4);
  assert.equal(restore(game => { game.commandHistory = [{ event: "scope", choice: "a", quality: {} }]; })!.game.commandHistory[0].quality, 3);
  assert.equal(restore(game => { game.commandHistory = [{ id: "x", choice: "a", quality: 4 }]; }), null, "an unnamed command event is refused");
  assert.equal(restore(game => { game.setPieceHistory = [{ event: "sector-0", choice: "d", quality: 4 }]; }), null, "and an unknown sector choice");
  assert.equal(restore(game => { game.rulesVersion = 3; }), null);
});

// The first unconfirmed stage, a source that sees it, and one from a reading that cannot.
function underTest() {
  const game: Game = { ...newGame(0, "operational", () => 0), injectDeck: [] };
  const stage = attacks.find(attack => attack.id === game.chain[0])!;
  const right = attackVector(stage.id);
  const wrong = hypotheses.find(item => item.id !== right && !hypothesisSources(game, item.id).some(id => stage.detect.includes(id)))!.id;
  return { game, right, wrong, wrongSource: hypothesisSources(game, wrong).find(id => procedures.some(p => p.id === id))! };
}

test("failure protection follows the hidden route, not the declared one", () => {
  const { game, right, wrong, wrongSource } = underTest();
  const rightSource = hypothesisSources(game, right).find(id => procedures.some(p => p.id === id))!;
  const failedRight = playTurn(setHypothesis(game, right), rightSource, 1);
  const failedWrong = playTurn(setHypothesis(game, wrong), wrongSource, 1);
  assert.equal(failedRight.turns[0].planningBonus, 1);
  assert.equal(failedWrong.turns[0].planningBonus, 1, "the +1 is the declared reading's, shown before the roll");
  assert.equal(failedRight.adversaryTempo, game.adversaryTempo, "a sound test on the right route keeps its footing");
  assert.equal(failedWrong.adversaryTempo, game.adversaryTempo + 1, "re-declaring the source's own route no longer does");
  const legacy = { ...game, rulesVersion: undefined };
  assert.equal(playTurn(setHypothesis(legacy, wrong), wrongSource, 1).adversaryTempo, game.adversaryTempo, "an older operation keeps its rules");
});

test("a reading changed after a failed roll forfeits that roll's own-source bonus", () => {
  const { game, right, wrong, wrongSource } = underTest();
  const rightSource = hypothesisSources(game, right).find(id => procedures.some(p => p.id === id) && id !== wrongSource)!;
  const failed = playTurn(setHypothesis(game, right), rightSource, 1);
  const swapped = setHypothesis(failed, wrong);
  const part = getModifierBreakdown(swapped, wrongSource).parts.find(item => en(item.label) === "Own source")!;
  assert.deepEqual([part.value, part.suppressed], [0, true], "the preview says why");
  assert.equal(playTurn(swapped, wrongSource, 15).turns[1].planningBonus, 0);
  const completed = playTurn(setHypothesis(game, right), rightSource, 15);
  if (!completed.pendingDecision) assert.equal(playTurn(setHypothesis(completed, wrong), wrongSource, 15).turns[1].planningBonus, 1, "after a completed check a revision is free");
  assert.equal(playTurn(setHypothesis(failed, right), hypothesisSources(failed, right).find(id => id !== rightSource && procedures.some(p => p.id === id))!, 15).turns[1].planningBonus, 1, "keeping the reading keeps it");
});

test("a command event owed on a turn that found a stage waits for its decision", () => {
  let game: Game = { ...newGame(0, "operational", () => 0), injectDeck: [] };
  const sources = procedures.map(p => p.id);
  let used = 0;
  // Two quiet turns with nothing pending, then a turn three that finds a stage.
  for (; game.turns.length < 2; used++) {
    game = playTurn(game, sources[used], 1);
    if (game.pendingSetPiece) game = { ...game, pendingSetPiece: null };
  }
  const stage = attacks.find(attack => attack.id === game.chain.find(id => !game.revealed.includes(id)))!;
  const finder = stage.detect.find(id => sources.includes(id) && (game.lastUsed[id] === undefined))!;
  game = playTurn(game, finder, 20);
  assert.ok(game.pendingDecision, "turn three found a stage");
  assert.equal(game.pendingCommand, null);
  game = resolveDecision(game, "observe");
  assert.ok(game.pendingCommand, "the turn's command event follows the decision");
});

test("service above full lowers starting impact rather than vanishing", () => {
  const plain = newGame(0, "operational", () => 0, { mode: "daily" });
  const route = newGame(0, "operational", () => 0, { mode: "campaign", campaignRoute: "common-ground" });
  assert.equal(route.continuity, 100);
  assert.equal(route.impact, plain.impact - 3, "Common Ground's +3 service becomes 3 less impact");
  assert.equal(newGame(0, "operational", () => 0, { mode: "campaign", campaignRoute: "common-ground", rulesVersion: 1 }).impact, plain.impact, "a historical replay keeps the old start");
});
