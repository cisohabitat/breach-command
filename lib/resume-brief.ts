import type { Game } from "./engine/types.ts";

// Reorientation uses only the saved public record, never a hidden answer.
export function getResumeBrief(game: Game) {
  // Blocking decisions already open on their own task and recorded context.
  // Repeating that above them hid their options on phones.
  if (game.status !== "playing" || game.pendingDecision || game.pendingCommand || game.pendingSetPiece) return null;
  const next = !game.hypothesis ? "gameScreen.resumeReading" : "gameScreen.resumeInvestigate";
  return { next, checks: game.turns.length, confirmed: game.revealed.length, last: game.turns.at(-1)?.narrative ?? null } as const;
}
