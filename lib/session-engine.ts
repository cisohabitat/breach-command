// Only the runtime surface used across the lazy-load boundary. Re-exporting
// the complete engine namespace keeps every public export in browser builds,
// including helpers used only by scripts and tests. UI modules import their
// own named helpers directly and can still be tree-shaken normally.
export {
  attacks, availableIn, correlateEvidence, getAdversaryRead, getAdversaryState,
  getDecisionOptions, getLead, getLossReason, getObjectiveRead,
  getOperationalLabel, getOutcome, getTrainingPrompt, getTurnLimit,
  guidanceLevel, hypotheses, hypothesisSources, newGame, playTurn,
  procedureById, proceduresFor, recommendNext, resolveCommand,
  resolveDecision, resolveMapAction, resolveResponse, resolveSetPiece,
  responseOptionsFor, scenarios, setCaseTheory, setHypothesis,
  setInfrastructureFocus, words,
} from "./advanced-game.ts";
