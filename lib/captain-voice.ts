import type { Game, Turn } from "./engine/types.ts";

export type CaptainVoiceCue = "opening" | "firstFinding" | "connectedFindings" | "pressure" | "response" | "won" | "lost" | "exercise";

// Only public findings and meter crossings drive the pilot. No hidden chain,
// objective, profile or hypothesis correctness can select a spoken line.
export function captainUpdateFor(game: Game, turn: Turn): CaptainVoiceCue | null {
  if (game.scenario !== 0 || game.status !== "playing" || turn.number !== game.turns.length) return null;
  const added = Number(!!turn.revealed) + Number(!!turn.injectReveal);
  const before = game.revealed.length - added;
  if (added && before < 2 && game.revealed.length >= 2) return "connectedFindings";
  if (added && before === 0) return "firstFinding";
  if (game.impact >= 75 && game.impact - turn.impactChange < 75) return "pressure";
  if (game.continuity <= 35 && game.continuity - turn.continuityChange > 35) return "pressure";
  return null;
}
