// Repetition audit: simulated campaigns of ten cases, played by the Bot
// Commander through `recordCampaignResult` as a player's would be, counting how
// often a command event, an inject or a sector crisis is met twice within one
// act. Pass "forget" as the second argument to play without campaign memory.
//
//   pnpm repetition            3,000 campaigns
//   pnpm repetition 500 forget
import { correlateEvidence, getScoreBreakdown, newGame, playTurn, resolveCommand, resolveDecision, resolveMapAction, resolveResponse, resolveSetPiece, scenarios, setCaseTheory, setHypothesis, setInfrastructureFocus, type Game } from "../lib/advanced-game.ts";
import { campaignAct, campaignTier, defaultCampaign, nextCase, recordCampaignResult } from "../lib/campaign.ts";
import { chooseBotAction, type BotAction } from "../lib/game-bot.ts";
import { seededChallengeRandom } from "../lib/phase8.ts";
import { incidentVariant, routeForCampaign } from "../lib/phase9.ts";

const campaigns = Number(process.argv[2] ?? 3000);
const forget = process.argv[3] === "forget";

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

const repeats = { command: 0, inject: 0, crisis: 0 };
let operations = 0;
for (let run = 0; run < campaigns; run++) {
  let campaign = defaultCampaign;
  const random = seededChallengeRandom(700000 + run);
  const seen: Record<number, { command: string[]; inject: string[]; crisis: string[] }> = {};
  const repeated = { command: false, inject: false, crisis: false };
  for (let step = 0; step < 30 && campaign.completed.length < scenarios.length; step++) {
    const scenario = nextCase(campaign, scenarios.length);
    const route = routeForCampaign(campaign);
    const act = campaignAct(campaign.completed.length).number;
    let game = newGame(scenario, "operational", random, { mode: "campaign", campaignTier: campaignTier(campaign.xp), readiness: campaign.readiness, leadershipTrust: campaign.leadershipTrust, unresolvedThreads: campaign.unresolvedThreads, campaignRoute: route, variant: incidentVariant(scenario, route, random(100000)), seed: null, ...(forget ? {} : { recentCommands: campaign.recentCommands, recentInjects: campaign.recentInjects, recentCrises: campaign.recentCrises }) });
    for (let move = 0; move < 200 && (game.status === "playing" || game.status === "response"); move++) {
      const action = chooseBotAction(game);
      if (action.type === "complete") break;
      game = apply(game, action);
    }
    operations++;
    const record = (seen[act] ??= { command: [], inject: [], crisis: [] });
    const met = { command: game.commandHistory.map(item => item.event as string), inject: game.turns.flatMap(turn => turn.inject ? [turn.inject.id] : []), crisis: game.setPieceHistory.map(item => item.event as string) };
    for (const kind of ["command", "inject", "crisis"] as const) {
      if (met[kind].some(id => record[kind].includes(id))) repeated[kind] = true;
      record[kind].push(...met[kind]);
    }
    campaign = recordCampaignResult(campaign, game, getScoreBreakdown(game).total);
  }
  for (const kind of ["command", "inject", "crisis"] as const) if (repeated[kind]) repeats[kind]++;
}
const percent = (count: number) => `${(100 * count / campaigns).toFixed(1)}%`;
console.log(`${campaigns} campaigns, ${operations} operations, ${forget ? "without" : "with"} campaign memory`);
console.table({ "command event": percent(repeats.command), inject: percent(repeats.inject), "sector crisis": percent(repeats.crisis) });
