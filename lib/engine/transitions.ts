// Every change to an operation. Each takes a Game and returns a new one.
import { attacks, procedures, scenarios, stages, difficulties, hypotheses, scenarioDynamics, attackVector, randomInt, type Difficulty, type HypothesisId } from "../game.ts";
import { objectiveForScenario, procedureIntensities, procedureScopes, sectorSystems, specialists, type AdversaryObjectiveId, type ProcedurePlan } from "../command-systems.ts";
import { infrastructureTopologies, sectorSetPieces, seededRoll } from "../phase8.ts";
import { objectiveTheory } from "../phase9.ts";
import { type DecisionLanguage, commandEvents, decisionChoices, decisionEffects, decisionLanguage, decisionTitles, injects, scenarioProfiles } from "./content.ts";
import { type CommandEventId, type DecisionChoice, type EvidenceItem, type Game, type GameSetup, type Inject, type MapAction, type NodePosture, type ResponsePhase, type SetPieceChoice } from "./types.ts";
import { FAILED_CHECK, availableIn, breached, clamp, cooldownWindow, crisisRerouteTarget, getAdversaryProfile, getMapActionEffect, getModifierBreakdown, ownSourceBonus, procedureById, proceduresFor, responseOptionsFor, settle, shuffle, stageOf, SPECIALIST_EXHAUSTED_AT } from "./rules.ts";

export function newGame(scenario: number, difficulty: Difficulty = "operational", random = (max: number) => randomInt(max), setup: GameSetup = {}): Game {
  if (!Number.isInteger(scenario) || !scenarios[scenario]) throw new Error("Unknown incident");
  if (!difficulties[difficulty]) throw new Error("Unknown difficulty");
  const profiles = scenarioProfiles[scenario];
  const mode = setup.mode ?? "campaign";
  const specialist = setup.specialist ?? "hunter";
  const campaignTier = Math.max(0, Math.min(3, setup.campaignTier ?? 0));
  const campaignReadiness = mode === "campaign" ? setup.readiness ?? 50 : 50;
  const campaignTrust = mode === "campaign" ? setup.leadershipTrust ?? 50 : 50;
  // Unresolved access is the campaign's memory: the actor did not start from
  // nothing this time. It costs pressure, objective progress and, past three
  // threads, opening tempo.
  const threads = mode === "campaign" ? Math.min(5, Math.max(0, setup.unresolvedThreads ?? 0)) : 0;
  const turnLimit = Math.max(5, difficulties[difficulty].maxTurns - (mode === "ironman" ? 1 : 0) + (campaignReadiness >= 75 ? 1 : 0) - (mode === "campaign" && campaignReadiness < 30 ? 1 : 0));
  const variant = setup.variant ?? { id: `${scenario}-0`, title: "Standard operating picture", briefing: "The incident opens without an additional campaign complication.", modifier: "No starting modifier.", impact: 0, continuity: 0, objective: 0 };
  const campaignRoute = setup.campaignRoute ?? "common-ground";
  const routeImpact = mode === "campaign" && campaignRoute === "breakwater" ? -4 : 0;
  const routeContinuity = mode !== "campaign" ? 0 : campaignRoute === "breakwater" ? -4 : campaignRoute === "common-ground" ? 3 : 0;
  const routeObjective = mode === "campaign" && campaignRoute === "watchtower" ? 5 : 0;
  const startingImpact = difficulties[difficulty].startImpact + (mode === "escalation" ? 12 : 0) - (campaignTier >= 2 ? 5 : 0) + threads * 2 + (campaignTrust < 35 ? 5 : campaignTrust >= 75 ? -3 : 0) + variant.impact + routeImpact;
  const startingContinuity = 100 + (campaignTier >= 3 ? 5 : 0) + (campaignReadiness >= 60 ? 3 : campaignReadiness < 30 ? -5 : 0) + variant.continuity + routeContinuity;
  return {
    scenario,
    difficulty,
    chain: scenarios[scenario].choices.map(options => options[random(options.length)]),
    revealed: [],
    established: shuffle(procedures.map(p => p.id), random).slice(0, campaignTier >= 3 ? 6 : campaignTier >= 1 ? 5 : 4),
    lastUsed: {},
    turns: [],
    failures: 0,
    nextModifier: 0,
    injectDeck: shuffle(injects.map((_, i) => i), random),
    status: "playing",
    impact: clamp(startingImpact),
    continuity: clamp(startingContinuity),
    pendingDecision: null,
    decisions: [],
    responseChoices: [],
    responseScore: 0,
    hypothesis: null,
    hypothesisHistory: [],
    adversaryTempo: Math.min(3, (difficulty === "crisis" || mode === "escalation" ? 1 : 0) + (threads >= 3 ? 1 : 0)),
    adversaryEvent: null,
    adversaryProfile: profiles[random(profiles.length)],
    adversaryMemory: { procedureCounts: {}, observeChoices: 0, actChoices: 0, hypothesisChanges: 0 },
    pendingCommand: null,
    commandHistory: [],
    mode,
    turnLimit,
    specialist,
    specialistFatigue: Math.max(0, setup.inheritedFatigue ?? 0),
    sectorHealth: mode === "escalation" ? 88 : 100,
    sectorHistory: [],
    objective: objectiveForScenario(scenario, random(2)),
    objectiveProgress: clamp((mode === "escalation" ? 18 : 5) + (difficulty === "crisis" ? 8 : 0) + threads * 3 + variant.objective + routeObjective),
    campaignTier,
    focusedNode: infrastructureTopologies[scenario].nodes[1].id,
    evidence: [],
    correlations: [],
    pendingSetPiece: null,
    setPieceHistory: [],
    campaignDoctrine: setup.doctrine ?? "balanced",
    campaignRoute,
    variant,
    caseTheory: null,
    caseTheoryHistory: [],
    nodePosture: Object.fromEntries(infrastructureTopologies[scenario].nodes.map(node => [node.id, "normal" as NodePosture])),
    mapActionsRemaining: Math.max(1, 3 - (mode === "expert" ? 1 : 0) - (difficulty === "crisis" ? 1 : 0) + (campaignTier >= 2 ? 1 : 0) - (mode === "campaign" && campaignTrust < 35 ? 1 : 0)),
    graceRemaining: campaignTier >= 2 ? 1 : 0,
    mapHistory: [],
    seed: typeof setup.seed === "number" && Number.isFinite(setup.seed) ? setup.seed : null,
  };
}

export function setHypothesis(game: Game, id: HypothesisId): Game {
  if (game.status !== "playing" || game.pendingDecision) throw new Error("The hypothesis cannot be changed now.");
  if (game.pendingCommand) throw new Error("Resolve the command event first.");
  if (game.pendingSetPiece) throw new Error("Resolve the sector decision first.");
  if (!hypotheses.some(h => h.id === id)) throw new Error("Unknown hypothesis.");
  if (game.hypothesis === id) return game;
  const turn = game.turns.length + 1;
  const hypothesisHistory = game.hypothesisHistory.filter(entry => entry.turn !== turn);
  hypothesisHistory.push({ turn, id });
  return { ...game, hypothesis: id, hypothesisHistory, adversaryMemory: { ...game.adversaryMemory, hypothesisChanges: game.adversaryMemory.hypothesisChanges + (game.hypothesis ? 1 : 0) } };
}

export function setInfrastructureFocus(game: Game, nodeId: string): Game {
  if (game.status !== "playing" || game.pendingDecision || game.pendingCommand || game.pendingSetPiece) throw new Error("Infrastructure focus cannot be changed now.");
  if (!infrastructureTopologies[game.scenario].nodes.some(node => node.id === nodeId)) throw new Error("Unknown infrastructure node.");
  return { ...game, focusedNode: nodeId };
}

export function resolveMapAction(game: Game, nodeId: string, action: MapAction): Game {
  if (game.status !== "playing") throw new Error("Infrastructure action is not available now.");
  if (game.pendingDecision || game.pendingCommand || game.pendingSetPiece) throw new Error("Resolve the current decision first.");
  const topology = infrastructureTopologies[game.scenario];
  const node = topology.nodes.find(item => item.id === nodeId);
  if (!node) throw new Error("Unknown infrastructure node.");
  if (game.mapActionsRemaining <= 0) throw new Error("No infrastructure actions remain.");
  if (game.nodePosture[nodeId] === "isolated") throw new Error("This node is already isolated.");
  if (action === "monitor" && game.nodePosture[nodeId] === "monitored") throw new Error("This node is already monitored.");
  const change = getMapActionEffect(game, nodeId, action);
  const effect = action === "monitor"
    ? `Telemetry priority established on ${node.label}. The next aligned procedure gains analytical support.`
    : `${node.label} isolated. ${topology.criticalRule}`;
  const g: Game = {
    ...game,
    focusedNode: nodeId,
    nodePosture: { ...game.nodePosture, [nodeId]: action === "monitor" ? "monitored" : "isolated" },
    mapActionsRemaining: game.mapActionsRemaining - 1,
    mapHistory: [...game.mapHistory, { node: nodeId, action, turn: game.turns.length, effect }],
    nextModifier: change.modifier ? Math.max(game.nextModifier, change.modifier) : game.nextModifier,
    impact: clamp(game.impact + change.impact),
    continuity: clamp(game.continuity + change.continuity),
    sectorHealth: clamp(game.sectorHealth + change.sector),
    objectiveProgress: clamp(game.objectiveProgress + change.objective),
  };
  return breached(g) ? settle(g, "lost") : g;
}

export function setCaseTheory(game: Game, objective: AdversaryObjectiveId): Game {
  if (game.status !== "playing" || game.pendingDecision || game.pendingCommand || game.pendingSetPiece) throw new Error("The case theory cannot be changed now.");
  if (!objectiveTheory[objective]) throw new Error("Unknown case theory.");
  if (game.caseTheory === objective) return game;
  return { ...game, caseTheory: objective, caseTheoryHistory: [...game.caseTheoryHistory, { turn: game.turns.length + 1, objective }] };
}

export function playTurn(game: Game, procedure: string, forcedRoll?: number, plan: ProcedurePlan = { scope: "focused", intensity: "balanced" }): Game {
  if (game.status !== "playing") throw new Error("This investigation has ended.");
  if (game.pendingDecision) throw new Error("Resolve the evidence decision first.");
  if (game.pendingCommand) throw new Error("Resolve the command event first.");
  if (game.pendingSetPiece) throw new Error("Resolve the sector decision first.");
  if (!proceduresFor(game).some(item => item.id === procedure)) throw new Error("Unknown procedure.");
  if (availableIn(game, procedure) > 0) throw new Error("This procedure is cooling down.");

  const raw = forcedRoll ?? (game.seed === null ? randomInt(20) + 1 : seededRoll(game.seed, game.turns.length));
  if (!Number.isInteger(raw) || raw < 1 || raw > 20) throw new Error("Invalid d20 roll.");
  const g: Game = {
    ...game,
    chain: [...game.chain],
    revealed: [...game.revealed],
    established: [...game.established],
    lastUsed: { ...game.lastUsed },
    turns: [...game.turns],
    injectDeck: [...game.injectDeck],
    decisions: [...game.decisions],
    responseChoices: [...game.responseChoices],
    hypothesisHistory: [...game.hypothesisHistory],
    adversaryMemory: { ...game.adversaryMemory, procedureCounts: { ...game.adversaryMemory.procedureCounts } },
    commandHistory: [...game.commandHistory],
    evidence: [...game.evidence],
    correlations: [...game.correlations],
    setPieceHistory: [...game.setPieceHistory],
    caseTheoryHistory: [...game.caseTheoryHistory],
    sectorHistory: [...game.sectorHistory],
    nodePosture: { ...game.nodePosture },
    mapHistory: [...game.mapHistory],
  };
  const config = difficulties[g.difficulty];
  const number = g.turns.length + 1;
  g.adversaryMemory.procedureCounts[procedure] = (g.adversaryMemory.procedureCounts[procedure] ?? 0) + 1;
  const nextHidden = g.chain.find(id => !g.revealed.includes(id));
  const hypothesisTarget = nextHidden ?? null;
  const hypothesisMatched = !!nextHidden && !!g.hypothesis && g.hypothesis === attackVector(nextHidden);
  // Whether this procedure was one of the sources that could have exposed the
  // stage under test, regardless of how the roll landed.
  const discriminating = !!nextHidden && attacks.find(item => item.id === nextHidden)!.detect.includes(procedure);
  const planningBonus = ownSourceBonus(game, procedure);
  const specialist = specialists[g.specialist];
  const specialistBonus = specialist.procedures.includes(procedure as never) && g.specialistFatigue < SPECIALIST_EXHAUSTED_AT ? 1 : 0;
  const scope = procedureScopes[plan.scope];
  const intensity = procedureIntensities[plan.intensity];
  const focusNode = infrastructureTopologies[g.scenario].nodes.find(node => node.id === g.focusedNode)!;
  // One computation: the modifier the roll resolves with is the one previewed.
  const modifier = getModifierBreakdown(g, procedure, plan).total;
  const total = raw + modifier;
  const success = total >= config.threshold;
  g.nextModifier = 0;

  const match = success ? g.chain.find(id => !g.revealed.includes(id) && attacks.find(attack => attack.id === id)!.detect.includes(procedure)) : undefined;
  let revealed: string | null = null;
  let narrative = "";
  let impactChange = (success ? 3 : 10) + scope.impact + intensity.impact;
  let continuityChange = success ? 0 : -1;
  if (match) {
    revealed = match;
    g.revealed.push(match);
    g.pendingDecision = match;
    impactChange = 1;
    // The node is where collection was focused, not where the technique lives, and
    // saying "Identity audit at the payment gateway" for a mailbox relay reads as
    // the game asserting a location it has not established. Lead with the finding,
    // then attribute the source and the focus for what they are.
    narrative = `${attacks.find(attack => attack.id === match)!.evidence} Found by ${procedureById(g, procedure)!.title.toLowerCase()} with collection focused on ${focusNode.label}.`;
    g.adversaryTempo = Math.min(3, g.adversaryTempo + 1);
  } else if (success) {
    narrative = "The procedure completed, but the evidence does not support an undiscovered stage. The working hypothesis remains unconfirmed.";
    g.adversaryTempo = Math.min(3, g.adversaryTempo + 1);
  } else if (planningBonus > 0) {
    // A sound action that the dice refused. The route under test was the one
    // predicted and the source was one that hypothesis relies on, so the team
    // keeps its footing: the actor takes no tempo it did not earn, and its
    // objective moves no further than on a success. Reasoning is protected;
    // certainty is not. It is checked before the grace so a failure that was
    // already protected does not spend it.
    //
    // The protection is the player's to earn, not to be told about: whether it
    // applied depends on the hidden route, so this reads exactly as an ordinary
    // failure does. Saying "the route under test was the right one" handed over
    // the answer, and so would any wording that differed.
    narrative = FAILED_CHECK;
  } else if (g.graceRemaining > 0) {
    // Rapid coordination absorbs the first unlucky action of the operation. The
    // team reorients on its own time rather than the adversary's.
    g.graceRemaining -= 1;
    narrative = "The action did not produce evidence, but the team reorients on its own time: coordination absorbed the setback before the actor could use it.";
  } else {
    narrative = FAILED_CHECK;
    g.adversaryTempo = Math.min(3, g.adversaryTempo + 1);
  }
  if (success) {
    const source = procedureById(g, procedure)!;
    const evidenceTitle = revealed ? `${attacks.find(item => item.id === revealed)!.title} evidence` : `${source.title} exception`;
    g.evidence.push({
      id: `E${number}-${procedure}`,
      turn: number,
      title: evidenceTitle,
      source: source.title,
      system: focusNode.label,
      confidence: revealed || plan.intensity === "exhaustive" ? "HIGH" : "MODERATE",
      supports: revealed,
      detail: revealed ? attacks.find(attack => attack.id === revealed)!.evidence : `The finding at ${focusNode.label} is credible but does not yet establish a hidden attack stage.`,
    });
  }

  g.lastUsed[procedure] = number + intensity.cooldown;
  if (specialistBonus) g.specialistFatigue = Math.min(6, g.specialistFatigue + (plan.intensity === "exhaustive" ? 2 : 1));
  g.failures = success ? 0 : g.failures + 1;
  let inject: Inject | null = null;
  let injectReveal: string | null = null;
  let exerciseEnd = false;
  const reason = raw === 1 ? "Natural 1" : raw === 20 ? "Natural 20" : g.failures >= 3 ? "Three failed rolls" : null;
  // A natural 20 may also land the authorised stand-down, which is neutral: it
  // is a conclusion the investigation has earned, not a punishment. Excluding it
  // here is what dropped the exercise ending from six per cent of operations to
  // one when the valence rule first went in.
  const wanted = raw === 20 ? ["good", "neutral"] : raw === 1 ? ["bad"] : null;
  // The deck stays shuffled and each card is still drawn once; a critical roll
  // reaches past cards of the wrong valence rather than reshuffling. If none of
  // the wanted kind is left, a critical roll draws nothing rather than take the
  // next card, which would be a penalty on a 20 or a gift on a 1.
  const position = !reason || !g.injectDeck.length ? -1 : wanted ? g.injectDeck.findIndex(item => wanted.includes(injects[item].valence)) : 0;
  if (reason && position >= 0) {
    const index = g.injectDeck.splice(position, 1)[0];
    inject = { ...injects[index], reason };
    if (g.failures >= 3) g.failures = 0;
    if (inject.effect === "bonus") g.nextModifier = 2;
    if (inject.effect === "penalty") { g.nextModifier = -2; impactChange += 6; }
    if (inject.effect === "pressure") impactChange += 8;
    if (inject.effect === "relief") impactChange -= 8;
    if (inject.effect === "restore") {
      const cooling = Object.keys(g.lastUsed).filter(id => g.lastUsed[id] + cooldownWindow(g) > number + 1).sort((a, b) => g.lastUsed[a] - g.lastUsed[b]);
      if (cooling.length) {
        delete g.lastUsed[cooling[0]];
        inject.effectLabel = `${procedureById(g, cooling[0])!.title} is available again.`;
      } else inject.effectLabel = "No procedures are cooling down; no change.";
    }
    if (inject.effect === "reveal") {
      injectReveal = g.chain.find(id => !g.revealed.includes(id)) ?? null;
      if (injectReveal) {
        g.revealed.push(injectReveal);
        g.pendingDecision = g.pendingDecision ?? injectReveal;
        inject.effectLabel = `Additional discovery: ${attacks.find(item => item.id === injectReveal)!.title}.`;
      } else inject.effectLabel = "All stages are already revealed.";
    }
    if (injectReveal) {
      // A stage revealed by the partner used to leave nothing in the evidence
      // workspace, so a player could hold four confirmed stages and be unable to
      // correlate one of them. The finding is recorded like any other, attributed
      // to where it came from.
      g.evidence.push({
        id: `E${number}-partner`,
        turn: number,
        title: `${attacks.find(item => item.id === injectReveal)!.title} evidence`,
        source: "Partner disclosure",
        system: focusNode.label,
        confidence: "HIGH",
        supports: injectReveal,
        detail: attacks.find(item => item.id === injectReveal)!.evidence,
      });
    }
    if (inject.effect === "end") {
      // Standing an operation down as an authorised exercise is a conclusion the
      // investigation reaches, not one it is handed. Below two confirmed stages
      // there is not enough attributed behaviour to support that call, so the
      // controller clears only part of the activity and the operation continues.
      if (g.revealed.length >= 4) {
        // The chain was completed on this same turn, so there is nothing left to
        // stand down: the response goes ahead and the card only eases pressure.
        impactChange -= 8;
        inject.effectLabel = "Part of the activity is confirmed as authorised, but the full chain is already confirmed. Business pressure falls and the response goes ahead.";
      } else if (g.revealed.length >= 2) exerciseEnd = true;
      else {
        impactChange -= 8;
        inject.effectLabel = "Part of the activity is confirmed as authorised. Business pressure falls and the investigation continues.";
      }
    }
  }

  let adversaryEvent: string | null = null;
  const profile = getAdversaryProfile(g);
  const cadence = Math.max(2, profile.cadence - (g.difficulty === "crisis" ? 1 : 0));
  if (number % cadence === 0 && g.revealed.length < 4) {
    const dynamics = scenarioDynamics[g.scenario];
    const eventIndex = Math.min(dynamics.escalations.length - 1, Math.floor(number / cadence) - 1);
    adversaryEvent = dynamics.escalations[eventIndex];
    impactChange += profile.pressure + g.adversaryTempo * 2;
    continuityChange -= 2 + g.adversaryTempo;
    g.adversaryEvent = adversaryEvent;
    if (g.difficulty === "crisis" && g.revealed.length < 4) {
      // Crisis re-routes ahead of the investigation: the first unconfirmed stage
      // after the one under test. Re-routing the stage under test threw away
      // everything the player had ruled out about it every two or three turns,
      // which left sound reasoning worth two points at Crisis against eight
      // without the re-route; a player who never revised lost nothing either way.
      const target = crisisRerouteTarget(new Set(g.revealed.map(stageOf)));
      const adaptation = target !== null ? selectAdaptation(g, target, g.chain[target]) : null;
      if (adaptation && target !== null) {
        g.chain[target] = adaptation.id;
        adversaryEvent = `${adversaryEvent} ${scenarioDynamics[g.scenario].reaction}`;
        g.adversaryEvent = adversaryEvent;
      }
    }
  }
  const sector = sectorSystems[g.scenario];
  const protection = g.specialist === "continuity" ? 3 : g.specialist === "ot" && [2, 8].includes(g.scenario) ? 3 : 0;
  const identityLed = procedure === "identity" || procedure === "cloud";
  const boundarySuccess = success && ["network", "firewall", "dns"].includes(procedure);
  let sectorSpecific = 0;
  let objectiveSpecific = 0;
  if (g.adversaryProfile === "ghost" && (g.adversaryMemory.procedureCounts[procedure] ?? 0) > 1) impactChange += 3;
  if (g.adversaryProfile === "raider" && number % 2 === 0 && !revealed) objectiveSpecific += 4;
  if (g.adversaryProfile === "broker" && plan.scope === "enterprise") sectorSpecific -= 2;
  if (g.adversaryProfile === "ledger" && (!g.caseTheory || plan.intensity === "rapid")) objectiveSpecific += 3;
  if (g.adversaryProfile === "sentinel" && !revealed) sectorSpecific -= 2;
  if (plan.intensity === "exhaustive") continuityChange -= sector.exhaustiveContinuity;
  const scopeSector = plan.scope === "enterprise" ? -sector.enterpriseBias : -sector.focusedBias;
  // Training erodes the sector margin a point a turn more slowly. With the
  // longer window it ended more than a third of the Bot Commander's Training
  // losses, on a meter a beginner is the least likely to be watching.
  const trainingRelief = g.difficulty === "training" ? 1 : 0;
  const sectorChange = Math.min(5, Math.max(-14, -(sector.baseLoss - trainingRelief + g.adversaryTempo * sector.tempoWeight + (success ? 0 : sector.failureCost) + (identityLed ? sector.exposureBias : 0) + (number >= 4 ? sector.lateBias : 0)) + (revealed ? sector.revealRelief : 0) + (boundarySuccess ? sector.boundaryRelief : 0) + protection + scopeSector + sectorSpecific + (g.specialist === "communications" ? sector.commsRecovery : 0)));
  const objectiveChange = Math.max(1, 6 + g.adversaryTempo * 3 + (success || planningBonus > 0 ? 0 : 4) - (revealed ? 6 : 0) + scope.objective + objectiveSpecific + (g.difficulty === "crisis" ? 2 : g.difficulty === "training" ? -2 : 0) + (plan.scope === "enterprise" ? sector.enterpriseObjective : 0));
  g.sectorHealth = clamp(g.sectorHealth + sectorChange);
  g.sectorHistory.push(g.sectorHealth);
  g.objectiveProgress = clamp(g.objectiveProgress + objectiveChange);
  if (g.specialist === "communications") impactChange -= 2;
  g.impact = clamp(g.impact + impactChange);
  g.continuity = clamp(g.continuity + continuityChange);
  g.turns.push({ number, procedure, raw, modifier, planningBonus, total, success, revealed, narrative, inject, injectReveal, impactChange, continuityChange, adversaryEvent, hypothesis: g.hypothesis, plan, specialistBonus, sectorChange, objectiveChange, hypothesisTarget, hypothesisMatched, discriminating, windfall: !!revealed && revealed !== hypothesisTarget });
  if (breached(g)) settle(g, "lost");
  else if (exerciseEnd) settle(g, "exercise");
  else if (number >= g.turnLimit && g.revealed.length < 4) settle(g, "lost");
  else if (!g.pendingDecision && number === 2 && g.revealed.length < 4) g.pendingSetPiece = sectorSetPieces[g.scenario].id;
  else if (!g.pendingDecision && number % 3 === 0 && g.revealed.length < 4) {
    // Events fire every third turn, and with three of them the index stepped by
    // the deck's own length: most operations met the same event every time. An
    // event the operation has not met comes first, in the same fixed order.
    const ids = Object.keys(commandEvents) as CommandEventId[];
    const start = (g.scenario + number + g.adversaryTempo) % ids.length;
    const order = ids.map((_, index) => ids[(start + index) % ids.length]);
    const met = new Set(g.commandHistory.map(record => record.event));
    g.pendingCommand = order.find(id => !met.has(id)) ?? order[0];
  }
  return g;
}

export function selectAdaptation(game: Game, stage: number, current: string) {
  const choices = scenarios[game.scenario].choices[stage].filter(id => id !== current);
  if (!choices.length) return null;
  const recentProcedures = game.turns.slice(-3).map(turn => turn.procedure);
  const profile = getAdversaryProfile(game);
  const ranked = choices.map(id => {
    const attack = attacks.find(item => item.id === id)!;
    const vectorRank = profile.preferredVectors.indexOf(attackVector(id));
    const exposure = attack.detect.reduce((sum, source) => sum + (recentProcedures.includes(source) ? 2 : 0) + (game.adversaryMemory.procedureCounts[source] ?? 0), 0);
    const choiceBias = game.adversaryMemory.actChoices > game.adversaryMemory.observeChoices ? 2 : 0;
    return { id, score: (4 - Math.max(0, vectorRank)) * 2 - exposure * 2 + choiceBias };
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const chosen = ranked[0].id;
  const title = attacks.find(item => item.id === chosen)!.title;
  return {
    id: chosen,
    reason: `${profile.title} selected ${title} because its evidence sources were less exposed by the last three procedures.`,
  };
}

export function decisionRationale(choice: DecisionChoice, highPressure: boolean, bindingSector: boolean, bindingContinuity: boolean) {
  switch (choice) {
    case "observe": return highPressure ? "Additional observation improved evidence but accepted substantial operational risk." : "Observation was proportionate while impact and adversary tempo remained manageable.";
    case "act": return highPressure ? "Intervention matched the elevated impact and adversary tempo." : "Intervention reduced exposure, although evidence collection still had room to continue.";
    case "attribute": return highPressure ? "Deep attribution delayed containment while the actor remained free to act." : "Attribution deepened the analytical picture while the actor stayed covert.";
    case "contain": return bindingSector ? "Bounded containment protected a sector margin that a full intervention would have eroded." : highPressure ? "Containment absorbed pressure without removing the actor's parallel access." : "Containment was proportionate, although a broader intervention was still available.";
    case "notify": return bindingContinuity ? "Early notification protected service continuity while the picture stayed uncertain." : highPressure ? "Notification kept owners aligned, but it cost tempo and disclosed your read." : "Notification was low-cost, but it did not reduce exposure or preserve evidence.";
  }
}

export function decisionQuality(game: Game, choice: DecisionChoice, highPressure: boolean) {
  const bindingSector = game.sectorHealth <= 70;
  const bindingContinuity = game.continuity <= 65;
  switch (choice) {
    case "observe": return highPressure ? 2 : 5;
    case "act": return highPressure ? 5 : 3;
    case "attribute": return !highPressure && game.adversaryTempo <= 1 ? 4 : 1;
    case "contain": return bindingSector || highPressure ? 4 : 2;
    case "notify": return bindingContinuity ? 4 : highPressure ? 3 : 2;
  }
}

export function resolveDecision(game: Game, choice: DecisionChoice): Game {
  if (game.status !== "playing" || !game.pendingDecision) throw new Error("No evidence decision is pending.");
  if (!decisionChoices.includes(choice)) throw new Error("Unknown decision.");
  const g: Game = { ...game, chain: [...game.chain], decisions: [...game.decisions], adversaryMemory: { ...game.adversaryMemory } };
  if (choice === "observe") g.adversaryMemory.observeChoices += 1;
  if (choice === "act") g.adversaryMemory.actChoices += 1;
  const stageId = g.pendingDecision!;
  const attack = attacks.find(item => item.id === stageId)!;
  const language = decisionLanguage[attack.stage];
  const highPressure = g.impact >= 55 || g.adversaryTempo >= 2;
  const bindingSector = g.sectorHealth <= 70;
  const bindingContinuity = g.continuity <= 65;
  const quality = decisionQuality(g, choice, highPressure);
  const rationale = decisionRationale(choice, highPressure, bindingSector, bindingContinuity);
  const before = { impact: g.impact, continuity: g.continuity, tempo: g.adversaryTempo, sector: g.sectorHealth, objective: g.objectiveProgress };
  let adaptedFrom: string | null = null;
  let adaptedTo: string | null = null;
  let adaptationReason: string | null = null;

  switch (choice) {
    case "observe":
      g.nextModifier = Math.max(g.nextModifier, 2);
      g.impact = clamp(g.impact + language.observeCost);
      g.adversaryTempo = Math.min(3, g.adversaryTempo + 1);
      g.objectiveProgress = clamp(g.objectiveProgress + 6);
      break;
    case "act":
      g.nextModifier = Math.min(g.nextModifier, -1);
      g.impact = clamp(g.impact + language.actRelief);
      g.continuity = clamp(g.continuity + language.continuityCost);
      g.adversaryTempo = Math.max(0, g.adversaryTempo - 1);
      g.objectiveProgress = clamp(g.objectiveProgress - 8);
      g.sectorHealth = clamp(g.sectorHealth - 2);
      break;
    case "attribute":
      g.nextModifier = Math.max(g.nextModifier, 3);
      g.impact = clamp(g.impact + 3);
      g.sectorHealth = clamp(g.sectorHealth - 1);
      g.objectiveProgress = clamp(g.objectiveProgress - 4);
      break;
    case "contain":
      g.impact = clamp(g.impact + language.containRelief);
      g.continuity = clamp(g.continuity + language.containCost);
      g.sectorHealth = clamp(g.sectorHealth + 3);
      g.objectiveProgress = clamp(g.objectiveProgress - 6);
      break;
    case "notify":
      g.nextModifier = Math.max(g.nextModifier, 1);
      g.impact = clamp(g.impact + 2);
      g.continuity = clamp(g.continuity + 3);
      g.sectorHealth = clamp(g.sectorHealth - 3);
      g.objectiveProgress = clamp(g.objectiveProgress + 5);
      g.adversaryTempo = Math.min(3, g.adversaryTempo + 1);
      break;
  }

  if (choice === "act") {
    const nextStage = Math.min(3, attack.stage + 1);
    const current = g.chain[nextStage];
    if (current && !g.revealed.includes(current)) {
      const adaptation = selectAdaptation(g, nextStage, current);
      if (adaptation) {
        adaptedFrom = current;
        adaptedTo = adaptation.id;
        adaptationReason = adaptation.reason;
        g.chain[nextStage] = adaptation.id;
        g.adversaryEvent = scenarioDynamics[g.scenario].reaction;
      }
    }
  }

  g.decisions.push({
    stage: stageId,
    choice,
    title: language[decisionTitles[choice]] as string,
    effect: decisionEffects[choice],
    counterfactual: decisionCounterfactual(choice, language),
    adaptedFrom,
    adaptedTo,
    adaptationReason,
    quality,
    rationale,
    impactChange: g.impact - before.impact,
    continuityChange: g.continuity - before.continuity,
    tempoChange: g.adversaryTempo - before.tempo,
    sectorChange: g.sectorHealth - before.sector,
    objectiveChange: g.objectiveProgress - before.objective,
  });
  // The partner card can disclose a stage on the same turn a procedure found
  // one. Each confirmed stage still gets its own decision, one after another.
  const last = g.turns.at(-1);
  g.pendingDecision = [last?.revealed, last?.injectReveal].find(id => !!id && !g.decisions.some(item => item.stage === id)) ?? null;
  if (breached(g)) settle(g, "lost");
  else if (g.pendingDecision) return g;
  else if (g.revealed.length === 4) g.status = "response";
  else if (g.turns.length === 2 && !g.setPieceHistory.length) g.pendingSetPiece = sectorSetPieces[g.scenario].id;
  return g;
}

export function decisionCounterfactual(choice: DecisionChoice, language: DecisionLanguage) {
  switch (choice) {
    case "observe": return `${language.actTitle} would have reduced immediate exposure but sacrificed telemetry.`;
    case "act": return `${language.observeTitle} would have improved confidence but given the actor more time.`;
    case "attribute": return `${language.observeTitle} would have gathered telemetry faster, but with less attribution depth.`;
    case "contain": return `${language.actTitle} would have removed access faster at greater service and sector cost.`;
    case "notify": return `${language.attributeTitle} would have deepened attribution instead of briefing stakeholders.`;
  }
}

export function resolveCommand(game: Game, choice: "a" | "b"): Game {
  if (game.status !== "playing" || !game.pendingCommand) throw new Error("No command event is pending.");
  const eventId = game.pendingCommand;
  const event = commandEvents[eventId];
  const option = event[choice];
  const g: Game = { ...game, commandHistory: [...game.commandHistory] };
  g.nextModifier = Math.max(-2, Math.min(3, g.nextModifier + option.modifier));
  g.impact = clamp(g.impact + option.impact);
  g.continuity = clamp(g.continuity + option.continuity);
  g.adversaryTempo = clamp(g.adversaryTempo + option.tempo, 0, 3);
  const communicationsBonus = g.specialist === "communications" && eventId === "leadership" ? 1 : 0;
  g.commandHistory.push({ event: eventId, choice, title: option.title, quality: Math.min(5, option.quality + communicationsBonus), effect: option.signal });
  g.pendingCommand = null;
  if (breached(g)) settle(g, "lost");
  return g;
}

export function resolveSetPiece(game: Game, choice: SetPieceChoice): Game {
  if (game.status !== "playing" || !game.pendingSetPiece) throw new Error("No sector decision is pending.");
  const event = sectorSetPieces[game.scenario];
  const option = event[choice];
  const g: Game = { ...game, setPieceHistory: [...game.setPieceHistory] };
  g.impact = clamp(g.impact + option.impact);
  g.continuity = clamp(g.continuity + option.continuity);
  g.sectorHealth = clamp(g.sectorHealth + option.sector);
  g.objectiveProgress = clamp(g.objectiveProgress + option.objective);
  g.setPieceHistory.push({ event: event.id, choice, title: option.title, quality: option.quality, effect: option.detail });
  g.pendingSetPiece = null;
  if (breached(g)) settle(g, "lost");
  return g;
}

export function correlateEvidence(game: Game, evidenceIds: [string, string], assessment: "causal" | "coincidental" = "causal"): Game {
  if (game.status !== "playing" || game.pendingDecision || game.pendingCommand || game.pendingSetPiece) throw new Error("Evidence cannot be correlated during a pending decision.");
  if (evidenceIds[0] === evidenceIds[1]) throw new Error("Choose two different findings.");
  if (game.correlations.some(record => record.evidence.every(id => evidenceIds.includes(id)))) throw new Error("These findings are already correlated.");
  const items = evidenceIds.map(id => game.evidence.find(item => item.id === id));
  if (items.some(item => !item)) throw new Error("Unknown evidence finding.");
  const [first, second] = items as [EvidenceItem, EvidenceItem];
  const firstAttack = first.supports ? attacks.find(item => item.id === first.supports) : null;
  const secondAttack = second.supports ? attacks.find(item => item.id === second.supports) : null;
  const valid = !!firstAttack && !!secondAttack && (Math.abs(firstAttack.stage - secondAttack.stage) <= 1 || attackVector(firstAttack.id) === attackVector(secondAttack.id));
  const correct = (assessment === "causal") === valid;
  const theoryAligned = correct && valid && game.caseTheory === game.objective;
  const basis = firstAttack && secondAttack
    ? Math.abs(firstAttack.stage - secondAttack.stage) <= 1
      ? `they sit in consecutive stages of the chain — ${stages[firstAttack.stage].name.toLowerCase()} then ${stages[secondAttack.stage].name.toLowerCase()} — so one is what the next one needed`
      : attackVector(firstAttack.id) === attackVector(secondAttack.id)
        ? `both sit on the ${hypotheses.find(item => item.id === attackVector(firstAttack.id))!.title.toLowerCase()} route, so they are steps in the same line of access`
        : ""
    : "";
  const finding = correct
    ? valid
      ? `${first.title} and ${second.title} form a credible causal sequence: ${basis}.`
      : `${first.title} and ${second.title} overlap in time, but nothing links them: they are neither consecutive stages nor steps on the same route, and appearing on ${first.system} and ${second.system} is not a relationship.`
    : valid
      ? `These were assessed as coincidental, but ${basis}, which is what a causal sequence looks like.`
      : `These were treated as causal on timing alone. Two findings close together, or on the same system, are not thereby related — a sequence needs consecutive stages or a shared route.`;
  const g: Game = {
    ...game,
    nextModifier: correct ? Math.max(game.nextModifier, theoryAligned ? 3 : 2) : game.nextModifier,
    impact: clamp(game.impact + (correct ? (theoryAligned ? -5 : -3) : 4)),
    objectiveProgress: clamp(game.objectiveProgress + (correct ? (theoryAligned ? -10 : -6) : 3)),
    correlations: [...game.correlations, { evidence: evidenceIds, valid, assessment, correct, finding }],
  };
  return breached(g) ? settle(g, "lost") : g;
}

export function resolveResponse(game: Game, choice: string): Game {
  if (game.status !== "response") throw new Error("The response phase is not active.");
  const phase: ResponsePhase = game.responseChoices.length === 0 ? "containment" : game.responseChoices.length === 1 ? "assurance" : "recovery";
  const option = responseOptionsFor(game)[phase].find(item => item.id === choice);
  if (!option) throw new Error("Unknown response choice.");
  const g: Game = { ...game, responseChoices: [...game.responseChoices, choice] };
  const preferred = g.responseChoices.length === 2 ? choice !== "accelerate" : scenarios[g.scenario].preferred[g.responseChoices.length === 1 ? 0 : 1] === choice;
  const objectiveResponses: Record<AdversaryObjectiveId, [string, string, string]> = {
    exfiltration: ["isolate", "preserve", "rebuild"], disruption: ["monitor", "verify", "restore"], fraud: ["credential", "verify", "rebuild"], espionage: ["credential", "preserve", "rebuild"], preposition: ["isolate", "verify", "rebuild"],
  };
  const objectiveAligned = objectiveResponses[g.objective][g.responseChoices.length - 1] === choice;
  g.impact = clamp(g.impact + option.impact);
  g.continuity = clamp(g.continuity + option.continuity);
  g.responseScore += option.score + (preferred ? 4 : 0) + (objectiveAligned ? 4 : 0);
  if (objectiveAligned) g.objectiveProgress = clamp(g.objectiveProgress - 10);
  // A response option that spends the last of the service or the impact margin
  // loses the operation like any other step; the response is not exempt.
  if (breached(g)) settle(g, "lost");
  else if (g.responseChoices.length === 3) {
    settle(g, "won");
    g.nodePosture = Object.fromEntries(Object.keys(g.nodePosture).map(node => [node, g.nodePosture[node] === "isolated" ? "restored" : g.nodePosture[node]]));
  }
  return g;
}
