import { newGame, playTurn, resolveCommand, resolveDecision, resolveSetPiece, setHypothesis, type Game } from "../lib/advanced-game.ts";
import { seededChallengeRandom } from "../lib/challenge.ts";
import { defaultCampaign } from "../lib/campaign.ts";
import { operationSetup } from "../lib/operation-setup.ts";

export function codedPlaytestGame(scenario = 9, difficulty: Game["difficulty"] = "crisis"): Game {
  return newGame(scenario, difficulty, seededChallengeRandom(20261024), operationSetup(scenario, "campaign", "hunter", 20261024, true, defaultCampaign));
}

// One legal reconstruction of the supplied negative test, including the same
// 100 impact, four turns, 1/4 stages, 91 service, 47 sector and old score 52.
export function negativePlaytestGame(turns = 4): Game {
  let game = setHypothesis(codedPlaytestGame(), "cloud");
  for (const source of ["dns", "endpoint", "forensic", "server"].slice(0, turns)) {
    game = playTurn(game, source, undefined, { scope: "enterprise", intensity: "balanced" });
    while (game.status === "playing" && (game.pendingDecision || game.pendingSetPiece || game.pendingCommand)) {
      game = game.pendingDecision ? resolveDecision(game, "observe") : game.pendingSetPiece ? resolveSetPiece(game, "b") : resolveCommand(game, "a");
    }
  }
  return game;
}
