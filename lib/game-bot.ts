import { attacks, availableIn, commandEvents, getObjectiveRead, hypotheses, hypothesisSources, infrastructureTopologies, proceduresFor, responseOptionsFor, sectorSetPieces, specialists, type AdversaryObjectiveId, type DecisionChoice, type Game, type HypothesisId, type MapAction, type ProcedurePlan, type SetPieceChoice } from "./advanced-game.ts";

export type BotAction =
  | { type: "decision"; choice: DecisionChoice; reason: string }
  | { type: "command"; choice: "a" | "b"; reason: string }
  | { type: "set-piece"; choice: SetPieceChoice; reason: string }
  | { type: "response"; choice: string; reason: string }
  | { type: "hypothesis"; hypothesis: HypothesisId; reason: string }
  | { type: "case-theory"; objective: AdversaryObjectiveId; reason: string }
  | { type: "correlate"; evidence: [string, string]; assessment: "causal" | "coincidental"; reason: string }
  | { type: "focus"; nodeId: string; reason: string }
  | { type: "map"; nodeId: string; action: MapAction; reason: string }
  | { type: "procedure"; procedure: string; plan: ProcedurePlan; reason: string }
  | { type: "complete"; reason: string };

function chooseDecision(game: Game): BotAction {
  let choice: DecisionChoice;
  if (game.continuity <= 48) choice = "notify";
  else if (game.sectorHealth <= 58) choice = "contain";
  else if (game.impact >= 62 || game.adversaryTempo >= 2) choice = "act";
  else if (game.revealed.length <= 1) choice = "attribute";
  else choice = "observe";
  return {
    type: "decision",
    choice,
    reason: `Balancing impact ${game.impact}, continuity ${game.continuity}, and ${game.revealed.length} confirmed stage${game.revealed.length === 1 ? "" : "s"}.`,
  };
}

function chooseCommand(game: Game): BotAction {
  const event = commandEvents[game.pendingCommand!];
  const utility = (choice: "a" | "b") => {
    const option = event[choice];
    return option.quality * 4 - Math.max(0, option.impact) - Math.max(0, -option.continuity) * 2 - option.tempo * 3;
  };
  const choice = utility("a") >= utility("b") ? "a" : "b";
  return { type: "command", choice, reason: `Selecting ${event[choice].title.toLowerCase()} for the strongest command tradeoff.` };
}

function chooseSetPiece(game: Game): BotAction {
  const event = sectorSetPieces[game.scenario];
  const utility = (choice: SetPieceChoice) => {
    const option = event[choice];
    const continuityWeight = game.continuity <= 55 ? 3 : 1;
    return option.quality * 4 - option.impact - Math.max(0, -option.continuity) * continuityWeight + option.sector - option.objective;
  };
  // The graduated measure is often the best available trade, so it is weighed on
  // the same terms as the two extremes rather than treated as a tie-breaker.
  const choice = (["a", "c", "b"] as const).reduce((best, item) => utility(item) > utility(best) ? item : best);
  return { type: "set-piece", choice, reason: `Choosing ${event[choice].title.toLowerCase()} to protect the sector under current pressure.` };
}

function chooseResponse(game: Game): BotAction {
  const phase = game.responseChoices.length === 0 ? "containment" : game.responseChoices.length === 1 ? "assurance" : "recovery";
  const riskValue = { Low: 5, Moderate: 2, High: -3 } as const;
  const confidenceValue = { Strong: 4, Moderate: 2, Developing: 0, Limited: -2 } as const;
  const disruptionCost = { Low: 0, Moderate: 2, High: 5 } as const;
  const continuityWeight = game.continuity <= 55 ? 2 : 1;
  const options = responseOptionsFor(game)[phase];
  const ranked = options.map(option => ({
    option,
    score: option.score + riskValue[option.residual as keyof typeof riskValue] + confidenceValue[option.confidence as keyof typeof confidenceValue]
      - disruptionCost[option.disruption as keyof typeof disruptionCost] * continuityWeight,
  })).sort((a, b) => b.score - a.score || a.option.id.localeCompare(b.option.id));
  return { type: "response", choice: ranked[0].option.id, reason: `Advancing the ${phase} plan with ${ranked[0].option.title.toLowerCase()}.` };
}

function visibleHypothesis(game: Game): HypothesisId {
  const latest = game.revealed.at(-1);
  if (latest) return attacks.find(attack => attack.id === latest)?.vector ?? "endpoint";
  return hypotheses[(game.scenario + game.turns.length) % hypotheses.length].id;
}

function nextCorrelation(game: Game): BotAction | null {
  if (game.evidence.length < 2 || game.correlations.length >= Math.floor(game.evidence.length / 2)) return null;
  for (let firstIndex = 0; firstIndex < game.evidence.length - 1; firstIndex++) {
    for (let secondIndex = firstIndex + 1; secondIndex < game.evidence.length; secondIndex++) {
      const first = game.evidence[firstIndex];
      const second = game.evidence[secondIndex];
      if (game.correlations.some(record => record.evidence.includes(first.id) && record.evidence.includes(second.id))) continue;
      const firstAttack = first.supports ? attacks.find(attack => attack.id === first.supports) : null;
      const secondAttack = second.supports ? attacks.find(attack => attack.id === second.supports) : null;
      const causal = !!firstAttack && !!secondAttack
        && (Math.abs(firstAttack.stage - secondAttack.stage) <= 1 || firstAttack.vector === secondAttack.vector);
      return {
        type: "correlate",
        evidence: [first.id, second.id],
        assessment: causal ? "causal" : "coincidental",
        reason: `Comparing ${first.title.toLowerCase()} with ${second.title.toLowerCase()} before the next action.`,
      };
    }
  }
  return null;
}

function rankProcedure(game: Game) {
  const hypothesis = hypotheses.find(item => item.id === game.hypothesis);
  const topology = infrastructureTopologies[game.scenario];
  const focus = topology.nodes.find(node => node.id === game.focusedNode);
  return proceduresFor(game)
    .filter(procedure => availableIn(game, procedure.id) === 0)
    .map(procedure => {
      const uses = game.turns.filter(turn => turn.procedure === procedure.id).length;
      const recent = game.turns.slice(-2).some(turn => turn.procedure === procedure.id);
      const score = (game.established.includes(procedure.id) ? 4 : 0)
        + (hypothesis && hypothesisSources(game, hypothesis.id).includes(procedure.id) ? 5 : 0)
        + (focus?.procedures.includes(procedure.id) ? 2 : 0)
        + (specialists[game.specialist].procedures.includes(procedure.id as never) && game.specialistFatigue < 5 ? 2 : 0)
        - uses * 2
        - (recent ? 5 : 0);
      return { procedure, score };
    })
    .sort((a, b) => b.score - a.score || a.procedure.id.localeCompare(b.procedure.id))[0]?.procedure;
}

function choosePlan(game: Game): ProcedurePlan {
  const turnsRemaining = Math.max(0, game.turnLimit - game.turns.length);
  const intensity = game.impact >= 68 || turnsRemaining <= 2
    ? "rapid"
    : game.impact <= 42 && game.specialistFatigue < 4
      ? "exhaustive"
      : "balanced";
  const scope = game.turns.length >= 3 && (game.revealed.length <= 1 || game.objectiveProgress >= 58) ? "enterprise" : "focused";
  return { scope, intensity };
}

export function chooseBotAction(game: Game): BotAction {
  if (["won", "lost", "exercise"].includes(game.status)) return { type: "complete", reason: "The automated operation is complete." };
  if (game.pendingDecision) return chooseDecision(game);
  if (game.pendingCommand) return chooseCommand(game);
  if (game.pendingSetPiece) return chooseSetPiece(game);
  if (game.status === "response") return chooseResponse(game);

  const hypothesis = visibleHypothesis(game);
  if (game.hypothesis !== hypothesis) {
    return { type: "hypothesis", hypothesis, reason: `Updating the working hypothesis to ${hypotheses.find(item => item.id === hypothesis)!.title.toLowerCase()} from confirmed evidence.` };
  }

  const objectiveRead = getObjectiveRead(game);
  if (!game.caseTheory && objectiveRead.confidence !== "LOW") {
    return { type: "case-theory", objective: game.objective, reason: `Recording ${objectiveRead.title.toLowerCase()} as the visible case theory.` };
  }

  const correlation = nextCorrelation(game);
  if (correlation) return correlation;

  const monitorBudget = Math.min(2, Math.floor(game.turns.length / 2));
  if (game.mapHistory.length < monitorBudget && game.mapActionsRemaining > 0) {
    const topology = infrastructureTopologies[game.scenario];
    const node = topology.nodes.find(item => game.nodePosture[item.id] === "normal");
    if (node) return { type: "map", nodeId: node.id, action: "monitor", reason: `Establishing telemetry on ${node.label.toLowerCase()} before committing another turn.` };
  }

  const procedure = rankProcedure(game);
  if (!procedure) return { type: "complete", reason: "No procedure is currently available." };
  const topology = infrastructureTopologies[game.scenario];
  const focus = topology.nodes.find(node => node.id === game.focusedNode);
  if (!focus?.procedures.includes(procedure.id)) {
    const node = topology.nodes.find(item => item.procedures.includes(procedure.id) && game.nodePosture[item.id] !== "isolated");
    if (node) return { type: "focus", nodeId: node.id, reason: `Moving the evidence boundary to ${node.label.toLowerCase()} for ${procedure.title.toLowerCase()}.` };
  }
  return { type: "procedure", procedure: procedure.id, plan: choosePlan(game), reason: `Running ${procedure.title.toLowerCase()} against the current hypothesis.` };
}
