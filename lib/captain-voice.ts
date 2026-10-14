import type { Game, Turn } from "./engine/types.ts";

export type CaptainVoiceCue = "opening" | `opening${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}` | "firstFinding" | "connectedFindings" | "thirdFinding" | "unexpectedFinding" | "pressure" | "serviceStabilising" | "failedCheck" | "weakSignal" | "newDevelopment" | "noFinding" | "noFindingAgain" | "response" | "assurance" | "recovery" | "won" | "lost" | "exercise";

export function captainOpeningFor(scenario: number): CaptainVoiceCue {
  return scenario >= 1 && scenario <= 9 ? ("opening" + scenario) as CaptainVoiceCue : "opening";
}

// Only public findings and meter crossings drive speech. No hidden chain,
// objective, profile or hypothesis correctness can select a spoken line.
export function captainUpdateFor(game: Game, turn: Turn): CaptainVoiceCue | null {
  if (game.status !== "playing" || turn.number !== game.turns.length) return null;
  const added = Number(!!turn.revealed) + Number(!!turn.injectReveal);
  const before = game.revealed.length - added;
  if (added && turn.windfall) return "unexpectedFinding";
  if (added && before < 3 && game.revealed.length >= 3) return "thirdFinding";
  if (added && before < 2 && game.revealed.length >= 2) return "connectedFindings";
  if (added && before === 0) return "firstFinding";
  if (game.impact >= 75 && game.impact - turn.impactChange < 75) return "pressure";
  if (game.continuity <= 35 && game.continuity - turn.continuityChange > 35) return "pressure";
  if (game.continuity >= 60 && game.continuity - turn.continuityChange < 60) return "serviceStabilising";
  if (!turn.success) return "failedCheck";
  if (game.evidence.some(item => item.turn === turn.number && item.confidence === "LOW")) return "weakSignal";
  if (turn.inject) return "newDevelopment";
  if (!added) return game.turns.some(previous => previous.number < turn.number && previous.success && !previous.revealed && !previous.injectReveal) ? "noFindingAgain" : "noFinding";
  return null;
}
