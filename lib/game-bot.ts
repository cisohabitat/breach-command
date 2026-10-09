import { SECTOR_ALERT_AT, attacks, availableIn, commandEvents, getHypothesisStanding, getMapActionEffect, getSectorAlert, sectorSystems, getObjectiveRead, getReadingOdds, hypotheses, hypothesisSources, infrastructureTopologies, proceduresFor, responseOptionsFor, setPieceById, specialists, type AdversaryObjectiveId, type DecisionChoice, type Game, type HypothesisId, type MapAction, type ProcedurePlan, type SetPieceChoice } from "./advanced-game.ts";

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
  const event = setPieceById(game.pendingSetPiece!, game.scenario);
  const utility = (choice: SetPieceChoice) => {
    const option = event[choice];
    const continuityWeight = game.continuity <= 55 ? 3 : 1;
    // With the sector margin low enough to be named on screen, protecting it
    // outweighs the rest, as it would for a player reading that alert.
    const sectorWeight = game.sectorHealth <= SECTOR_ALERT_AT ? 3 : 1;
    return option.quality * 4 - option.impact - Math.max(0, -option.continuity) * continuityWeight + option.sector * sectorWeight - option.objective;
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

// The operator starts from an assumption — the chain continues on the route its
// latest find was on, or a rotation before any find — and revises on the record,
// as the game asks a player to. It used to snap back to that assumption every
// turn and never revise, so in four of five operations it lost to the window it
// stalled on the last stage testing a route the evidence had already ruled out.
// Everything it reads here is visible to the player.
function visibleHypothesis(game: Game): HypothesisId {
  const latest = game.revealed.at(-1);
  const assumed: HypothesisId = latest
    ? attacks.find(attack => attack.id === latest)?.vector ?? "endpoint"
    : hypotheses[(game.scenario + game.turns.length) % hypotheses.length].id;
  const odds = getReadingOdds(game);
  const viable = (id: HypothesisId) => odds.candidates[id].open > 0 && odds.share[id] >= odds.prior[id] * 0.5;
  const best = hypotheses
    .map(item => item.id)
    .filter(id => odds.candidates[id].open > 0)
    .sort((a, b) => odds.share[b] - odds.share[a] || Number(b === assumed) - Number(a === assumed))[0] ?? assumed;
  const current = game.hypothesis;
  const standing = current ? getHypothesisStanding(game).level : "none";
  // Keep a reading it already moved to while the record still supports it.
  if (current && current !== assumed && standing !== "unsupported" && standing !== "weakening" && viable(current)) return current;
  return viable(assumed) ? assumed : best;
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
  let scope: ProcedurePlan["scope"] = game.turns.length >= 3 && (game.revealed.length <= 1 || game.objectiveProgress >= 58) ? "enterprise" : "focused";
  // Once the sector margin is low, the scope that costs it less.
  if (game.sectorHealth <= SECTOR_ALERT_AT) {
    const sector = sectorSystems[game.scenario];
    scope = sector.enterpriseBias < sector.focusedBias ? "enterprise" : sector.focusedBias < sector.enterpriseBias ? "focused" : scope;
  }
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

  // With the margin named on screen, monitoring that restores it is worth a map
  // action whatever the opening budget said.
  if (getSectorAlert(game) && game.mapActionsRemaining > 0) {
    const topology = infrastructureTopologies[game.scenario];
    const node = topology.nodes.find(item => game.nodePosture[item.id] === "normal" && getMapActionEffect(game, item.id, "monitor").sector > 0);
    if (node) return { type: "map", nodeId: node.id, action: "monitor", reason: `Monitoring ${node.label.toLowerCase()} to restore the sector margin before it runs out.` };
  }

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
