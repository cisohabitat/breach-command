import type { Game } from "./advanced-game.ts";
import type { CaptainVoiceCue, CaptainReactionCue } from "./captain-voice.ts";
import { CONTINUITY_AT_RISK } from "./meter-thresholds.ts";

export type RecordedCaptainCue = Exclude<CaptainVoiceCue, "debrief"> | CaptainReactionCue;

// Loaded with the optional voice player. A review can assess the full record,
// but never selects or reveals an answer while the operation is in progress.
export function captainDebriefFor(game: Game, grade?: string, recoveryRisk?: string): RecordedCaptainCue[] {
  if (game.status !== "won" && game.status !== "lost" && game.status !== "exercise") return [];
  const results = { A: "reviewControlled", B: "reviewStable", C: "reviewCostly", D: "reviewFragile" } as const;
  const losses = { objective: "reviewObjective", impact: "reviewImpact", continuity: "reviewContinuityLost", sector: "reviewSector", window: "reviewWindow" } as const;
  const cause = game.objectiveProgress >= 100 ? "objective" : game.impact >= 100 ? "impact" : game.continuity <= 0 ? "continuity" : game.sectorHealth <= 0 ? "sector" : "window";
  // The owning game bundle supplies the published risk; importing the engine
  // here would duplicate it in the optional narration chunk.
  const costly = game.continuity <= CONTINUITY_AT_RISK || recoveryRisk === "High";
  const result = game.status === "won" ? costly && grade ? "reviewServices" : results[grade as keyof typeof results] : game.status === "exercise" ? "reviewExercise" : losses[cause];
  if (!result) return [];
  const decisions = { contain: "reviewContain", observe: "reviewObserve", attribute: "reviewAttribute", notify: "reviewNotify", act: "reviewAct" } as const;
  const good = game.decisions.find(decision => decision.quality >= 3);
  const strength = good ? decisions[good.choice] : game.turns.some(turn => turn.hypothesisMatched && turn.discriminating) ? "reviewAligned" : game.revealed.length ? "reviewEvidence" : game.turns.length && game.continuity >= 70 ? "reviewContinuity" : "reviewNoStrength";
  const improvement = game.turns.some(turn => !turn.hypothesis) ? "reviewReading" : game.decisions.some(decision => decision.quality <= 2) ? "reviewDecisions" : game.continuity <= 50 || game.impact >= 60 ? "reviewServices" : "reviewPractice";
  return [result, strength, result === improvement ? "reviewPractice" : improvement];
}
