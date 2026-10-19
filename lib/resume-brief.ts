import type { Game } from "./engine/types.ts";

// Reorientation uses only the saved public record, never a hidden answer.
export function getResumeBrief(game: Game) {
  const next = game.pendingDecision ? "gameScreen.resumeEvidence"
    : game.pendingCommand ? "gameScreen.resumeCommand"
    : game.pendingSetPiece ? "gameScreen.resumeSector"
    : game.status === "response" ? (["gameScreen.resumeContainment", "gameScreen.resumeAssurance", "gameScreen.resumeRecovery"] as const)[Math.min(game.responseChoices.length, 2)]
    : !game.hypothesis ? "gameScreen.resumeReading" : "gameScreen.resumeInvestigate";
  return { next, checks: game.turns.length, confirmed: game.revealed.length, last: game.turns.at(-1)?.narrative ?? null } as const;
}
