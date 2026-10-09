// The engine's public surface. The implementation lives in lib/engine/: authored
// content, types, shared rules, the reads shown during play, the transitions
// that change an operation and the after-action review.
import { attacks, procedures, sectorProcedures, scenarios, stages, difficulties, hypotheses, scenarioDynamics, attackVector, type Difficulty, type HypothesisId } from "./game.ts";
import { adversaryObjectives, gameModes, procedureIntensities, procedureScopes, sectorSystems, specialists, type AdversaryObjectiveId, type GameMode, type ProcedureIntensity, type ProcedurePlan, type ProcedureScope, type SpecialistId } from "./command-systems.ts";
import { infrastructureTopologies, sectorSetPieces } from "./phase8.ts";

export {
  attacks,
  procedures,
  sectorProcedures,
  scenarios,
  stages,
  difficulties,
  hypotheses,
  scenarioDynamics,
  attackVector,
};
export type { Difficulty, HypothesisId };
export { adversaryObjectives, gameModes, infrastructureTopologies, procedureIntensities, procedureScopes, sectorSetPieces, sectorSystems, specialists };
export type { AdversaryObjectiveId, GameMode, ProcedureIntensity, ProcedurePlan, ProcedureScope, SpecialistId };
export { adversaryProfiles, commandEvents, decisionChoices, glossaryParts, inSentence, plainLanguage, responseOptions, responseProfiles } from "./engine/content.ts";
export type { AdversaryMemory, AdversaryProfileId, BeginnerReview, CommandEventId, CommandRecord, CorrelationRecord, DecisionChoice, DecisionOption, DecisionRecord, DiscriminatingRead, EvidenceItem, Game, GameSetup, GameStatus, GuidanceLevel, HypothesisLedgerRow, HypothesisStanding, KnownFacts, LossCause, MapAction, MapActionRecord, ModifierPart, NodePosture, ReadingOdds, ResponseOption, ResponsePhase, ResponseProfile, ScoreBreakdown, SectorRead, SetPieceChoice, SetPieceRecord, TrainingPrompt, Turn } from "./engine/types.ts";
export { OWN_SOURCE_BONUS, SPECIALIST_EXHAUSTED_AT, availableIn, carryModifier, cooldownWindow, decisionRollShift, describeChange, describePart, describeRollShift, describeMeterChange, getAdversaryProfile, getAdversaryState, getMapActionEffect, getModifierBreakdown, getOperationalLabel, getTurnLimit, hypothesisSources, procedureById, proceduresFor, responseOptionsFor } from "./engine/rules.ts";
export { getAdversaryRead, getAttributionRead, getCoachPrompt, getDecisionOptions, getDiscriminatingRead, getHypothesisStanding, getKnownFacts, getLead, getLossReason, getObjectiveRead, getReadingOdds, getRuledOutRoutes, getSectorAlert, getSectorRead, SECTOR_ALERT_AT, getMapHint, getTrainingPrompt, guidanceLevel, nextEvidenceSource, readyForTheory, readyToCorrelate, sourceSeesReading } from "./engine/reads.ts";
export { correlateEvidence, newGame, playTurn, resolveCommand, resolveDecision, resolveMapAction, resolveResponse, resolveSetPiece, setCaseTheory, setHypothesis, setInfrastructureFocus } from "./engine/transitions.ts";
export { getBeginnerReview, getCounterfactuals, getHypothesisLedger, getOutcome, getResultSummary, getScoreBreakdown, getScoreRows, countRevisions, recommendNext } from "./engine/review.ts";
export type { Recommendation } from "./engine/review.ts";
