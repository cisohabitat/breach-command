import type { Game } from "./engine/types.ts";

// The bounded, published assessment, shared with the lightweight practice desk.
// No content tables, hidden chain or engine transitions are needed here.
export function getEvidenceAssessment(game: Game, item: Game["evidence"][number]) {
  const sourceId = (id: string) => id.replace(/^E\d+-/, "");
  const corroborated = game.correlations.some(record => record.correct && record.valid && record.evidence.includes(item.id) && record.evidence.some(id => id !== item.id && sourceId(id) !== sourceId(item.id)));
  const turn = game.turns.find(turn => turn.number === item.turn && sourceId(item.id) === turn.procedure);
  const basis = corroborated ? "corroborated" : turn?.plan.intensity === "exhaustive" ? "exhaustive" : turn ? "single" : "recorded";
  return { signal: item.supports ? "strong" : "weak", confidence: corroborated || basis === "exhaustive" || (!turn && item.confidence === "HIGH") ? "strong" : "weak", basis } as const;
}
