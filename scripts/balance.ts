// Balance measurement: the Bot Commander plays seeded operations from visible
// evidence only, and the outcomes are tallied by difficulty. The seeds are fixed,
// so a run before a rule change and a run after it play the same incidents.
//
//   pnpm balance              3,000 operations per difficulty, a new command
//   pnpm balance 60 2         600 per difficulty at campaign tier 2
//
// Below about 3,000 per difficulty, differences of two or three points are noise.
import { correlateEvidence, getLossReason, getScoreBreakdown, newGame, playTurn, resolveCommand, resolveDecision, resolveMapAction, resolveResponse, resolveSetPiece, scenarios, setCaseTheory, setHypothesis, setInfrastructureFocus, type Difficulty, type Game } from "../lib/advanced-game.ts";
import { chooseBotAction, type BotAction } from "../lib/game-bot.ts";
import { seededChallengeRandom } from "../lib/phase8.ts";

const perScenario = Number(process.argv[2] ?? 300);
const campaignTier = Number(process.argv[3] ?? 0);

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

const percent = (count: number, total: number) => `${(100 * count / total).toFixed(1)}%`;
const rows = [];
for (const difficulty of ["training", "operational", "crisis"] as Difficulty[]) {
  const tally = { won: 0, lost: 0, exercise: 0, score: 0, hypothesis: 0, reasons: {} as Record<string, number> };
  let total = 0;
  for (let scenario = 0; scenario < scenarios.length; scenario++) {
    for (let index = 0; index < perScenario; index++) {
      const seed = 900000 + scenario * 1000 + index;
      let game = newGame(scenario, difficulty, seededChallengeRandom(seed), { seed, campaignTier });
      for (let step = 0; step < 200 && (game.status === "playing" || game.status === "response"); step++) {
        const action = chooseBotAction(game);
        if (action.type === "complete") break;
        game = apply(game, action);
      }
      total++;
      if (game.status === "won" || game.status === "lost" || game.status === "exercise") tally[game.status]++;
      if (game.status === "lost") {
        const reason = getLossReason(game).title;
        tally.reasons[reason] = (tally.reasons[reason] ?? 0) + 1;
      }
      const breakdown = getScoreBreakdown(game);
      tally.score += breakdown.total;
      tally.hypothesis += breakdown.hypothesis;
    }
  }
  rows.push({
    difficulty,
    operations: total,
    won: percent(tally.won, total),
    lost: percent(tally.lost, total),
    exercise: percent(tally.exercise, total),
    score: (tally.score / total).toFixed(1),
    hypothesis: (tally.hypothesis / total).toFixed(2),
    losses: Object.entries(tally.reasons).sort((a, b) => b[1] - a[1]).map(([reason, count]) => `${reason} ${count}`).join("; "),
  });
}
console.log(`Campaign tier ${campaignTier}, ${perScenario} operations per scenario and difficulty`);
console.table(rows);
