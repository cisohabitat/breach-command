import type { Game } from "./engine/types.ts";

// Only an explicit initiating-record reference establishes this direct link.
// A shared route, stage, collection location or timestamp is not proof.
export function evidenceRecordLink(first: Game["evidence"][number], second: Game["evidence"][number]) {
  if (!first.supports || !second.supports || !first.trace || !second.trace) return null;
  return first.trace.parent === second.trace.record ? second.trace.record
    : second.trace.parent === first.trace.record ? first.trace.record : null;
}

export function newCorroboration(game: Game, first: Game["evidence"][number], second: Game["evidence"][number]) {
  const source = (id: string) => id.replace(/^E\d+-/, "");
  return !!evidenceRecordLink(first, second) && source(first.id) !== source(second.id)
    && [first, second].some(item => !game.correlations.some(record => record.effects?.rewarded && record.evidence.includes(item.id)));
}

// The bounded, published assessment, shared with the lightweight practice desk.
// No content tables, hidden chain or engine transitions are needed here.
export function getEvidenceAssessment(game: Game, item: Game["evidence"][number]) {
  const sourceId = (id: string) => id.replace(/^E\d+-/, "");
  const corroborated = game.correlations.some(record => {
    if (!record.correct || !record.valid || !record.evidence.includes(item.id) || !record.evidence.some(id => id !== item.id && sourceId(id) !== sourceId(item.id))) return false;
    if (game.comparisonVersion !== 2) return true;
    const [first, second] = record.evidence.map(id => game.evidence.find(item => item.id === id));
    return !!first && !!second && !!evidenceRecordLink(first, second);
  });
  const turn = game.turns.find(turn => turn.number === item.turn && sourceId(item.id) === turn.procedure);
  const basis = corroborated ? "corroborated" : turn?.plan.intensity === "exhaustive" ? "exhaustive" : turn ? "single" : "recorded";
  return { signal: item.supports ? "strong" : "weak", confidence: corroborated || basis === "exhaustive" || (!turn && item.confidence === "HIGH") ? "strong" : "weak", basis } as const;
}
