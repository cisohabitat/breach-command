// The balance and repetition smoke test CI runs on every push and pull request:
// 600 seeded operations per difficulty and 300 seeded campaigns, compared with
// the figures recorded in scripts/balance-expected.json. The seeds are fixed, so
// the figures repeat exactly until a rule or content change moves them; a move
// of more than three points fails the run and names the figure. When a change is
// meant to move balance, measure it at 3,000 by hand (pnpm balance), explain it
// in AGENTS.md, and record the new smoke figures with --record.
import { readFileSync, writeFileSync } from "node:fs";
import { correlateEvidence, getScoreBreakdown, newGame, playTurn, resolveCommand, resolveDecision, resolveMapAction, resolveResponse, resolveSetPiece, scenarios, setCaseTheory, setHypothesis, setInfrastructureFocus, type Difficulty, type Game } from "../lib/advanced-game.ts";
import { campaignAct, campaignTier, defaultCampaign, nextCase, recordCampaignResult } from "../lib/campaign.ts";
import { chooseBotAction, type BotAction } from "../lib/game-bot.ts";
import { seededChallengeRandom } from "../lib/phase8.ts";
import { incidentVariant, routeForCampaign } from "../lib/phase9.ts";

// A campaign operation has no seed of its own, so its dice come from crypto.
// Here they come from a seeded Math.random instead (randomInt falls back to it
// without crypto), so the repetition figures repeat as the balance ones do.
let state = 20261009;
Math.random = () => { state = (state * 16807) % 2147483647; return (state - 1) / 2147483646; };
Object.defineProperty(globalThis, "crypto", { value: undefined, configurable: true });

const expectedPath = new URL("./balance-expected.json", import.meta.url);
const record = process.argv.includes("--record");
const TOLERANCE = 3;

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

function play(game: Game) {
  for (let step = 0; step < 200 && (game.status === "playing" || game.status === "response"); step++) {
    const action = chooseBotAction(game);
    if (action.type === "complete") break;
    game = apply(game, action);
  }
  return game;
}

const round = (value: number) => Math.round(value * 10) / 10;
const figures: Record<string, number> = {};
for (const difficulty of ["training", "operational", "crisis"] as Difficulty[]) {
  let won = 0, total = 0, score = 0;
  for (let scenario = 0; scenario < scenarios.length; scenario++) for (let index = 0; index < 60; index++) {
    const seed = 900000 + scenario * 1000 + index;
    const game = play(newGame(scenario, difficulty, seededChallengeRandom(seed), { seed }));
    total++;
    if (game.status === "won") won++;
    score += getScoreBreakdown(game).total;
  }
  figures[`${difficulty} win rate`] = round(100 * won / total);
  figures[`${difficulty} mean score`] = round(score / total);
}

const repeats = { command: 0, inject: 0, crisis: 0 };
const campaigns = 300;
for (let run = 0; run < campaigns; run++) {
  let campaign = defaultCampaign;
  const random = seededChallengeRandom(700000 + run);
  const seen: Record<number, Record<string, string[]>> = {};
  const repeated = { command: false, inject: false, crisis: false };
  for (let step = 0; step < 30 && campaign.completed.length < scenarios.length; step++) {
    const scenario = nextCase(campaign, scenarios.length);
    const route = routeForCampaign(campaign);
    const act = campaignAct(campaign.completed.length).number;
    const game = play(newGame(scenario, "operational", random, { mode: "campaign", campaignTier: campaignTier(campaign.xp), readiness: campaign.readiness, leadershipTrust: campaign.leadershipTrust, unresolvedThreads: campaign.unresolvedThreads, campaignRoute: route, variant: incidentVariant(scenario, route, random(100000)), seed: null, recentCommands: campaign.recentCommands, recentInjects: campaign.recentInjects, recentCrises: campaign.recentCrises }));
    const met = { command: game.commandHistory.map(item => item.event as string), inject: game.turns.flatMap(turn => turn.inject ? [turn.inject.id] : []), crisis: game.setPieceHistory.map(item => item.event as string) };
    const record = (seen[act] ??= { command: [], inject: [], crisis: [] });
    for (const kind of ["command", "inject", "crisis"] as const) {
      if (met[kind].some(id => record[kind].includes(id))) repeated[kind] = true;
      record[kind].push(...met[kind]);
    }
    campaign = recordCampaignResult(campaign, game, getScoreBreakdown(game).total);
  }
  for (const kind of ["command", "inject", "crisis"] as const) if (repeated[kind]) repeats[kind]++;
}
for (const kind of ["command", "inject", "crisis"] as const) figures[`${kind} repeats within an act`] = round(100 * repeats[kind] / campaigns);

if (record) {
  writeFileSync(expectedPath, `${JSON.stringify(figures, null, 2)}\n`);
  console.log("Recorded", figures);
} else {
  const expected = JSON.parse(readFileSync(expectedPath, "utf8")) as Record<string, number>;
  const moved = Object.entries(figures).filter(([name, value]) => expected[name] === undefined || Math.abs(value - expected[name]) > TOLERANCE);
  console.table(Object.fromEntries(Object.entries(figures).map(([name, value]) => [name, { recorded: expected[name], now: value }])));
  if (moved.length) {
    for (const [name, value] of moved) console.error(`Balance moved: ${name} is ${value}, recorded ${expected[name]} (tolerance ${TOLERANCE} points).`);
    process.exit(1);
  }
  console.log("Balance and repetition within", TOLERANCE, "points of the record.");
}
