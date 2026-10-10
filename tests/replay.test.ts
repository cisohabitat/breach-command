// Replayability: the weekly operation, the mastery ladder, the personal record
// and the share card.
import assert from "node:assert/strict";
import { test } from "node:test";
import { attacks, correlateEvidence, getShareCard, newGame, playTurn, resolveCommand, resolveDecision, resolveMapAction, resolveResponse, resolveSetPiece, scenarios, setCaseTheory, setHypothesis, setInfrastructureFocus, type Game } from "../lib/advanced-game.ts";
import { defaultCampaign, ladderRungs, parseCampaign, recordCampaignResult, rungsEarned } from "../lib/campaign.ts";
import { weeklyOperation } from "../lib/command-systems.ts";
import { chooseBotAction, type BotAction } from "../lib/game-bot.ts";
import { hypothesisTrend, ledgerCsv, parseLedger, type LedgerEntry } from "../lib/ledger.ts";
import { decodeChallenge, encodeChallenge, seededChallengeRandom } from "../lib/phase8.ts";
import { en } from "./english.ts";
import { operationSetup } from "../lib/operation-setup.ts";

function apply(game: Game, action: BotAction): Game {
  switch (action.type) {
    case "decision": return resolveDecision(game, action.choice);
    case "command": return resolveCommand(game, action.choice);
    case "set-piece": return resolveSetPiece(game, action.choice);
    case "response": return resolveResponse(game, action.choice);
    case "hypothesis": return setHypothesis(game, action.hypothesis);
    case "case-theory": return setCaseTheory(game, action.objective);
    case "correlate": return correlateEvidence(game, action.evidence, action.assessment);
    case "focus": return setInfrastructureFocus(game, action.nodeId);
    case "map": return resolveMapAction(game, action.nodeId, action.action);
    case "procedure": return playTurn(game, action.procedure, undefined, action.plan);
    case "complete": return game;
  }
}

function played(scenario: number, seed: number, difficulty: Game["difficulty"] = "operational", mode: Game["mode"] = "daily"): Game {
  let game = newGame(scenario, difficulty, seededChallengeRandom(seed), { mode, seed });
  for (let step = 0; step < 200 && (game.status === "playing" || game.status === "response"); step++) {
    const action = chooseBotAction(game);
    if (action.type === "complete") break;
    game = apply(game, action);
  }
  return game;
}

test("shared operations play identically across different campaign records", () => {
  const veteran = { ...defaultCampaign, xp: 900, completed: [0, 1, 2], readiness: 20, leadershipTrust: 25, unresolvedThreads: 5, specialistFatigue: { hunter: 6 }, commandPosture: { observe: 0, act: 8 }, recentCommands: ["board"], recentInjects: ["partner"], recentCrises: ["sector-0-b"] };
  for (const scenario of [0, 4]) for (const mode of ["campaign", "daily", "weekly", "ironman", "escalation", "expert"] as const) {
    const setup = { scenario, mode, specialist: "hunter" as const, difficulty: "operational" as const, seed: 4242 };
    const decoded = decodeChallenge(encodeChallenge(setup))!;
    const start = (campaign: typeof defaultCampaign) => newGame(decoded.scenario, decoded.difficulty, seededChallengeRandom(decoded.seed), operationSetup(decoded.scenario, decoded.mode, decoded.specialist, decoded.seed, true, campaign));
    let a = start(defaultCampaign), b = start(veteran);
    assert.deepEqual(a, b, `${mode}: the code includes every input to the initial state`);
    for (let step = 0; step < 200 && (a.status === "playing" || a.status === "response"); step++) {
      a = apply(a, chooseBotAction(a));
      b = apply(b, chooseBotAction(b));
      assert.deepEqual(a, b, `${mode}: campaign history cannot change a seeded transition`);
    }
    assert.ok(["won", "lost", "exercise"].includes(a.status), `${mode}: the shared operation terminates`);
  }
  const ordinary = operationSetup(0, "campaign", "hunter", 4242, false, veteran);
  assert.equal(ordinary.seed, null);
  assert.equal(ordinary.campaignTier, 3);
  assert.equal(ordinary.inheritedFatigue, 6);
  assert.equal(ordinary.campaignRoute, "breakwater");
  assert.equal(ordinary.readiness, 20);
  assert.equal(ordinary.unresolvedThreads, 5);
  const variant = newGame(0, "operational", () => 0).variant;
  const replay = operationSetup(0, "daily", "hunter", 4242, true, veteran, { campaignRoute: "watchtower", variant });
  assert.equal(replay.campaignRoute, "watchtower", "an existing operation's replay keeps its recorded route");
  assert.deepEqual(replay.variant, variant);
});

test("the weekly operation holds one case and seed from Monday to Sunday, and moves on", () => {
  const monday = weeklyOperation(new Date("2026-10-05T00:00:00Z"), scenarios.length);
  const sunday = weeklyOperation(new Date("2026-10-11T23:59:00Z"), scenarios.length);
  const next = weeklyOperation(new Date("2026-10-12T00:00:00Z"), scenarios.length);
  assert.deepEqual(monday, sunday, "the whole week plays one operation");
  assert.notEqual(next.seed, monday.seed);
  assert.equal(next.scenario, (monday.scenario + 1) % scenarios.length, "and the next week the next case");
  assert.equal(monday.startsOn, "20261005");
  assert.equal(String(monday.seed).length, 9, "a weekly seed is never a daily one, which is a plain eight-digit date");
  const code = encodeChallenge({ scenario: monday.scenario, difficulty: "operational", mode: "weekly", specialist: "hunter", seed: monday.seed });
  assert.equal(decodeChallenge(code)?.mode, "weekly", "the weekly mode round-trips through a code");
  const expert = encodeChallenge({ scenario: 1, difficulty: "crisis", mode: "expert", specialist: "ot", seed: 123456 });
  assert.equal(decodeChallenge(expert)?.mode, "expert", "and appending it moved no earlier mode's index");
});

test("the mastery ladder records only what a won operation earned, and survives a parse", () => {
  const won = { ...played(0, 4100), status: "won" as const };
  const base = { ...won, difficulty: "operational" as const, mode: "campaign" as const, specialistFatigue: 0, turnLimit: 11 };
  assert.deepEqual(rungsEarned({ ...base, status: "lost" }), [], "a loss climbs nothing");
  assert.deepEqual(rungsEarned({ ...base, status: "exercise" }), [], "nor does an authorised exercise, which clears the case but runs no response");
  assert.ok(rungsEarned({ ...base, difficulty: "crisis" }).includes("crisis"));
  assert.ok(rungsEarned({ ...base, mode: "expert" }).includes("expert"));
  assert.ok(rungsEarned({ ...base, specialistFatigue: 5 }).includes("tired"));
  assert.equal(rungsEarned({ ...base, turns: base.turns.slice(0, 5) }).includes("swift"), true, "five turns of an eleven-turn window is under half");
  assert.equal(rungsEarned({ ...base, turns: [...base.turns, ...base.turns, ...base.turns].slice(0, 6) }).includes("swift"), false);
  const steady = { ...base, hypothesisHistory: [{ turn: 1, id: "identity" as const }] };
  assert.ok(rungsEarned(steady).includes("steady"));
  assert.ok(!rungsEarned({ ...steady, hypothesisHistory: [{ turn: 1, id: "identity" as const }, { turn: 2, id: "cloud" as const }] }).includes("steady"));

  let campaign = recordCampaignResult(defaultCampaign, { ...base, difficulty: "crisis" }, 80);
  campaign = recordCampaignResult(campaign, { ...base, mode: "expert", scenario: 0 }, 80);
  campaign = recordCampaignResult(campaign, { ...base, status: "lost" }, 20);
  assert.ok(campaign.ladder["0"].includes("crisis") && campaign.ladder["0"].includes("expert"), "rungs accumulate and a loss takes none away");
  assert.deepEqual(parseCampaign(JSON.stringify(campaign)).ladder, campaign.ladder);
  assert.deepEqual(parseCampaign(JSON.stringify({ ...campaign, ladder: { "0": ["crisis", "flying"], x: ["expert"] } })).ladder, { "0": ["crisis"] }, "an unknown rung or case is dropped");
  assert.deepEqual(parseCampaign(JSON.stringify({ completed: [] })).ladder, {}, "an older campaign has an empty ladder");
  assert.equal(ladderRungs.length, 5);
});

test("the personal record keeps valid entries, shows the trend and exports as CSV", () => {
  const entry = (at: number, hypothesis: number): LedgerEntry => ({ at, scenario: 1, difficulty: "operational", mode: "campaign", outcome: "won", score: 70, hypothesis, stages: 4, turns: 8, code: null });
  const entries = [...Array.from({ length: 10 }, (_, index) => entry(index, 4)), ...Array.from({ length: 10 }, (_, index) => entry(100 + index, 7))];
  assert.equal(parseLedger([...entries, { ...entry(1, 4), scenario: 42 }, { ...entry(1, 4), hypothesis: 11 }, "x", null], scenarios.length).length, 20, "an impossible entry is dropped");
  assert.deepEqual(parseLedger("nonsense", scenarios.length), []);
  assert.deepEqual(hypothesisTrend(entries), { recent: 7, recentCount: 10, before: 4 });
  assert.deepEqual(hypothesisTrend(entries.slice(0, 3)), { recent: 4, recentCount: 3, before: null });
  const csv = ledgerCsv([{ ...entry(0, 5), code: "BC6-1-1-0-0-1-11" }], index => `Case, "${index}"`).split("\n");
  assert.equal(csv[0], "ended,case,title,difficulty,mode,outcome,score,hypothesis,stages,turns,code");
  assert.match(csv[1], /^1970-01-01T00:00:00.000Z,2,"Case, ""1""",operational,campaign,won,70,5,4,8,BC6-1-1-0-0-1-11$/);
});

test("the share card names no technique, whatever the operation found", () => {
  const forbidden = attacks.map(attack => attack.title.toLowerCase());
  for (let scenario = 0; scenario < scenarios.length; scenario++) for (const seed of [11, 22, 33]) {
    for (const game of [played(scenario, seed), played(scenario, seed, "crisis", "expert")]) {
      const card = en(getShareCard(game));
      const text = Object.values(card).filter(value => typeof value === "string").join(" | ").toLowerCase();
      for (const word of forbidden) assert.ok(!new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(text), `${word} appears on the card for scenario ${scenario}: ${text}`);
      assert.ok(card.code?.startsWith("BC"), "a reproducible operation carries its code");
      assert.equal(card.expert, game.mode === "expert" && game.status === "won");
    }
  }
});
