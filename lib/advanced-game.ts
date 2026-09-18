// @ts-expect-error Native Node TypeScript execution requires the source extension.
import { attacks, procedures, scenarios, stages, difficulties, hypotheses, scenarioDynamics, attackVector, randomInt, type Difficulty, type HypothesisId } from "./game.ts";
// @ts-expect-error Native Node TypeScript execution requires the source extension.
import { adversaryObjectives, gameModes, objectiveForScenario, procedureIntensities, procedureScopes, sectorSystems, specialists, type AdversaryObjectiveId, type GameMode, type ProcedureIntensity, type ProcedurePlan, type ProcedureScope, type SpecialistId } from "./command-systems.ts";
// @ts-expect-error Native Node TypeScript execution requires the source extension.
import { infrastructureTopologies, sectorSetPieces, type SetPieceId } from "./phase8.ts";
// @ts-expect-error Native Node TypeScript execution requires the source extension.
import { objectiveTheory, type CampaignRouteId, type IncidentVariant } from "./phase9.ts";

export {
  attacks,
  procedures,
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

const injects = [
  { id: "expert", title: "A specialist joins", text: "A responder helps focus the next investigative plan.", effect: "bonus", effectLabel: "Analytical advantage on the next procedure." },
  { id: "delay", title: "Access approval delayed", text: "Coordination friction slows the next action while business impact grows.", effect: "penalty", effectLabel: "The next action is harder and pressure rises." },
  { id: "restored", title: "Collection pipeline restored", text: "A repaired pipeline lets you revisit a used procedure early.", effect: "restore", effectLabel: "One cooling-down procedure becomes available." },
  { id: "partner", title: "Partner shares evidence", text: "A trusted partner supplies a validated finding.", effect: "reveal", effectLabel: "One hidden stage is revealed, if any remain." },
  { id: "press", title: "Leadership wants an update", text: "Leaders ask whether the essential service is safe. Uncertainty carries a cost.", effect: "pressure", effectLabel: "Business pressure rises." },
  { id: "backup", title: "A useful evidence copy", text: "Retained telemetry improves the next investigation.", effect: "bonus", effectLabel: "Analytical advantage on the next procedure." },
  { id: "noise", title: "An alert flood", text: "Unrelated alerts reduce analyst attention and delay decisions.", effect: "penalty", effectLabel: "The next action is harder and pressure rises." },
  { id: "operations", title: "Operations stabilises service", text: "A workaround buys the investigation team time.", effect: "relief", effectLabel: "Business pressure falls." },
  { id: "exercise", title: "Authorised exercise confirmed", text: "The controller confirms that the activity belongs to an authorised test.", effect: "end", effectLabel: "Exercise ends." },
];

export const adversaryProfiles = {
  ghost: {
    title: "Glass Viper",
    description: "Avoids recently examined evidence sources and favours identity or cloud trust.",
    preferredVectors: ["identity", "cloud", "application", "endpoint"] as HypothesisId[],
    cadence: 3,
    pressure: 2,
    unverifiedSignal: "A low-confidence identity alert may be operational noise or deliberate distraction.",
    signature: "Evasion protocol", counterplay: "Rotate evidence sources and avoid repeating the same collection pattern.",
  },
  raider: {
    title: "Red Quarry",
    description: "Pushes execution and movement quickly when the response hesitates.",
    preferredVectors: ["endpoint", "application", "identity", "cloud"] as HypothesisId[],
    cadence: 2,
    pressure: 3,
    unverifiedSignal: "A burst of endpoint alerts is credible, but its relationship to the original access remains unproven.",
    signature: "Momentum strike", counterplay: "Reveal a stage or intervene before each second action.",
  },
  broker: {
    title: "Black Relay",
    description: "Blends into supplier, application and shared-service relationships.",
    preferredVectors: ["application", "identity", "cloud", "endpoint"] as HypothesisId[],
    cadence: 3,
    pressure: 1,
    unverifiedSignal: "A partner-originated event overlaps the timeline but has not been causally linked.",
    signature: "Trust camouflage", counterplay: "Use focused checks on supplier and shared-service boundaries.",
  },
  ledger: {
    title: "Cipher Ledger",
    description: "Targets approval paths, privileged identities and transaction systems for financial effect.",
    preferredVectors: ["identity", "application", "cloud", "endpoint"] as HypothesisId[],
    cadence: 2,
    pressure: 2,
    unverifiedSignal: "A suspicious approval pattern may be fraud, process error or deliberate misdirection.",
    signature: "Approval capture", counterplay: "Maintain a working theory and avoid rapid analysis on approval paths.",
  },
  sentinel: {
    title: "Silent Meridian",
    description: "Maps operational dependencies and preserves access for a future strategic objective.",
    preferredVectors: ["application", "endpoint", "identity", "cloud"] as HypothesisId[],
    cadence: 3,
    pressure: 2,
    unverifiedSignal: "Low-volume discovery activity suggests mapping, but its intended use remains unclear.",
    signature: "Dependency mapping", counterplay: "Protect sector health while testing operational dependencies.",
  },
} as const;

export type AdversaryProfileId = keyof typeof adversaryProfiles;
export type CommandEventId = keyof typeof commandEvents;
export type AdversaryMemory = {
  procedureCounts: Record<string, number>;
  observeChoices: number;
  actChoices: number;
  hypothesisChanges: number;
};
export type CommandRecord = { event: CommandEventId; choice: "a" | "b"; title: string; quality: number; effect: string };
export type EvidenceItem = { id: string; turn: number; title: string; source: string; system: string; confidence: "LOW" | "MODERATE" | "HIGH"; supports: string | null; detail: string };
export type CorrelationRecord = { evidence: [string, string]; valid: boolean; assessment: "causal" | "coincidental"; correct: boolean; finding: string };
export type SetPieceRecord = { event: SetPieceId; choice: "a" | "b"; title: string; quality: number; effect: string };
export type MapAction = "monitor" | "isolate";
export type NodePosture = "normal" | "monitored" | "isolated" | "restored";
export type MapActionRecord = { node: string; action: MapAction; turn: number; effect: string };
type Inject = typeof injects[number] & { reason: string };
export type Turn = {
  number: number;
  procedure: string;
  raw: number;
  modifier: number;
  planningBonus: number;
  total: number;
  success: boolean;
  revealed: string | null;
  narrative: string;
  inject: Inject | null;
  injectReveal: string | null;
  impactChange: number;
  continuityChange: number;
  adversaryEvent: string | null;
  hypothesis: HypothesisId | null;
  plan: ProcedurePlan;
  specialistBonus: number;
  sectorChange: number;
  objectiveChange: number;
};
export type DecisionRecord = {
  stage: string;
  choice: "observe" | "act";
  title: string;
  effect: string;
  counterfactual: string;
  adaptedFrom: string | null;
  adaptedTo: string | null;
  adaptationReason: string | null;
  quality: number;
  rationale: string;
};
export type GameStatus = "playing" | "response" | "won" | "lost" | "exercise";
export type Game = {
  scenario: number;
  difficulty: Difficulty;
  chain: string[];
  revealed: string[];
  established: string[];
  lastUsed: Record<string, number>;
  turns: Turn[];
  failures: number;
  nextModifier: number;
  injectDeck: number[];
  status: GameStatus;
  impact: number;
  continuity: number;
  pendingDecision: string | null;
  decisions: DecisionRecord[];
  responseChoices: string[];
  responseScore: number;
  hypothesis: HypothesisId | null;
  hypothesisHistory: { turn: number; id: HypothesisId }[];
  adversaryTempo: number;
  adversaryEvent: string | null;
  adversaryProfile: AdversaryProfileId;
  adversaryMemory: AdversaryMemory;
  pendingCommand: CommandEventId | null;
  commandHistory: CommandRecord[];
  mode: GameMode;
  turnLimit: number;
  specialist: SpecialistId;
  specialistFatigue: number;
  sectorHealth: number;
  sectorHistory: number[];
  objective: AdversaryObjectiveId;
  objectiveProgress: number;
  campaignTier: number;
  focusedNode: string;
  evidence: EvidenceItem[];
  correlations: CorrelationRecord[];
  pendingSetPiece: SetPieceId | null;
  setPieceHistory: SetPieceRecord[];
  campaignDoctrine: "observe" | "act" | "balanced";
  campaignRoute: CampaignRouteId;
  variant: IncidentVariant;
  caseTheory: AdversaryObjectiveId | null;
  caseTheoryHistory: { turn: number; objective: AdversaryObjectiveId }[];
  nodePosture: Record<string, NodePosture>;
  mapActionsRemaining: number;
  mapHistory: MapActionRecord[];
};

export type GameSetup = {
  mode?: GameMode;
  specialist?: SpecialistId;
  campaignTier?: number;
  inheritedFatigue?: number;
  readiness?: number;
  leadershipTrust?: number;
  unresolvedThreads?: number;
  doctrine?: "observe" | "act" | "balanced";
  campaignRoute?: CampaignRouteId;
  variant?: IncidentVariant;
};

export const commandEvents = {
  scope: {
    title: "Scope is expanding",
    prompt: "A connected service reports related activity. Decide how broadly the team should investigate.",
    a: { title: "Expand the evidence boundary", description: "Bring the connected service into the investigation now.", signal: "Higher confidence · Slower next action", modifier: -1, impact: 2, continuity: 0, tempo: 0, quality: 4 },
    b: { title: "Hold the current boundary", description: "Keep the team focused until the link is confirmed.", signal: "Faster action · Greater blind-spot risk", modifier: 1, impact: 5, continuity: 0, tempo: 1, quality: 3 },
  },
  leadership: {
    title: "Leadership needs a recommendation",
    prompt: "Executives need a clear position before the next operational decision.",
    a: { title: "Brief confirmed facts and uncertainty", description: "State what is known, what is assumed and what decision is approaching.", signal: "Pressure falls · No analytical shortcut", modifier: 0, impact: -5, continuity: 0, tempo: 0, quality: 5 },
    b: { title: "Delay until the picture is complete", description: "Preserve analyst time and wait for stronger attribution.", signal: "No interruption · Pressure rises", modifier: 1, impact: 7, continuity: 0, tempo: 1, quality: 2 },
  },
  capacity: {
    title: "Specialist capacity is limited",
    prompt: "One specialist team can be surged into the incident, but routine operations will lose support.",
    a: { title: "Surge specialist support", description: "Accelerate the next evidence action and accept operational strain.", signal: "Analytical advantage · Service cost", modifier: 2, impact: 0, continuity: -5, tempo: 0, quality: 4 },
    b: { title: "Preserve operational coverage", description: "Keep routine services supported and continue with the current team.", signal: "Continuity protected · Actor retains tempo", modifier: 0, impact: 3, continuity: 2, tempo: 1, quality: 3 },
  },
} as const;

export const responseOptions = {
  containment: [
    { id: "isolate", title: "Isolate affected systems", description: "Cuts attacker access quickly, but may interrupt dependent services.", disruption: "High", confidence: "Strong", residual: "Low", impact: -24, continuity: -14, score: 12 },
    { id: "credential", title: "Revoke identities and sessions", description: "Constrains identity-led movement while preserving most service paths.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -17, continuity: -5, score: 11 },
    { id: "monitor", title: "Monitor while mapping scope", description: "Preserves visibility and continuity while accepting further attacker opportunity.", disruption: "Low", confidence: "Developing", residual: "High", impact: 5, continuity: 5, score: 9 },
  ],
  assurance: [
    { id: "verify", title: "Validate the clean boundary", description: "Test identities, routes and dependencies before restoration begins.", disruption: "Moderate", confidence: "Strong", residual: "Low", impact: -8, continuity: -4, score: 13 },
    { id: "preserve", title: "Preserve forensic state", description: "Retain volatile evidence and trusted copies before systems are changed.", disruption: "Moderate", confidence: "Strong", residual: "Moderate", impact: -5, continuity: -5, score: 12 },
    { id: "accelerate", title: "Accept operational assurance", description: "Use current operational checks to shorten the interruption.", disruption: "Low", confidence: "Developing", residual: "High", impact: 2, continuity: 5, score: 8 },
  ],
  recovery: [
    { id: "rebuild", title: "Rebuild from trusted baseline", description: "Provides the highest assurance at the cost of a longer interruption.", disruption: "High", confidence: "Strong", residual: "Low", impact: -18, continuity: -13, score: 14 },
    { id: "restore", title: "Restore validated backups", description: "Returns service faster if backup integrity and dependencies are understood.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -12, continuity: 2, score: 11 },
    { id: "patch", title: "Patch in place and monitor", description: "Minimises immediate disruption but retains more uncertainty.", disruption: "Low", confidence: "Limited", residual: "High", impact: -6, continuity: 8, score: 7 },
  ],
};

const decisionLanguage = [
  { observeTitle: "Trace the access path", observe: "Keep the suspected route active long enough to correlate its origin.", actTitle: "Revoke the access path", act: "Terminate the observed access and invalidate related sessions.", observeCost: 7, actRelief: -13, continuityCost: -4 },
  { observeTitle: "Map lateral access", observe: "Watch the movement briefly to identify reached systems and identities.", actTitle: "Segment the movement path", act: "Block the observed administrative route before scope is complete.", observeCost: 9, actRelief: -15, continuityCost: -7 },
  { observeTitle: "Capture the persistence mechanism", observe: "Preserve volatile and configuration evidence before removal.", actTitle: "Remove the foothold", act: "Disable the confirmed mechanism and accept reduced visibility.", observeCost: 8, actRelief: -14, continuityCost: -5 },
  { observeTitle: "Trace the outbound channel", observe: "Collect destination and transfer evidence before blocking it.", actTitle: "Block the channel now", act: "Stop the confirmed connection before attribution and scope are complete.", observeCost: 10, actRelief: -18, continuityCost: -3 },
];

const scenarioProfiles: AdversaryProfileId[][] = [
  ["ghost", "broker", "sentinel"],
  ["ghost", "raider", "sentinel"],
  ["broker", "ghost", "sentinel"],
  ["raider", "broker", "ledger"],
  ["ghost", "raider", "broker"],
  ["broker", "ghost", "sentinel"],
  ["ghost", "broker", "ledger"],
  ["raider", "broker", "sentinel"],
  ["broker", "raider", "sentinel"],
  ["ledger", "ghost", "broker"],
];

function shuffle<T>(array: T[], random = (max: number) => randomInt(max)) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));
const state = (tempo: number) => tempo <= 0 ? "Covert" : tempo === 1 ? "Maneuvering" : tempo === 2 ? "Accelerating" : "Executing objective";

export function getAdversaryState(game: Game) {
  return state(game.adversaryTempo);
}

export function getAdversaryProfile(game: Game) {
  return adversaryProfiles[game.adversaryProfile];
}

export function getAttributionRead(game: Game) {
  const profile = getAdversaryProfile(game);
  const evidence = game.revealed.length;
  if (evidence === 0) return { title: "Unknown operator", confidence: "LOW", detail: "No reliable attribution. Infer behaviour before assigning an identity." };
  if (evidence === 1) return { title: "Behavioural pattern emerging", confidence: "DEVELOPING", detail: `${profile.signature}. Treat this as a hypothesis, not attribution.` };
  if (evidence === 2) return { title: `Suspected: ${profile.title}`, confidence: "MODERATE", detail: profile.description };
  if (evidence === 3) return { title: `Probable: ${profile.title}`, confidence: "HIGH", detail: `${profile.description} One stage remains unresolved.` };
  return { title: profile.title, confidence: "ATTRIBUTED", detail: profile.description };
}

export function getOperationalLabel(game: Game) {
  return scenarioDynamics[game.scenario].label;
}

export function newGame(scenario: number, difficulty: Difficulty = "operational", random = (max: number) => randomInt(max), setup: GameSetup = {}): Game {
  if (!Number.isInteger(scenario) || !scenarios[scenario]) throw new Error("Unknown incident");
  if (!difficulties[difficulty]) throw new Error("Unknown difficulty");
  const profiles = scenarioProfiles[scenario];
  const mode = setup.mode ?? "campaign";
  const specialist = setup.specialist ?? "hunter";
  const campaignTier = Math.max(0, Math.min(3, setup.campaignTier ?? 0));
  const campaignReadiness = mode === "campaign" ? setup.readiness ?? 50 : 50;
  const campaignTrust = mode === "campaign" ? setup.leadershipTrust ?? 50 : 50;
  const turnLimit = Math.max(5, difficulties[difficulty].maxTurns - (mode === "ironman" ? 1 : 0) + (campaignReadiness >= 75 ? 1 : 0));
  const variant = setup.variant ?? { id: `${scenario}-0`, title: "Standard operating picture", briefing: "The incident opens without an additional campaign complication.", modifier: "No starting modifier.", impact: 0, continuity: 0, objective: 0 };
  const campaignRoute = setup.campaignRoute ?? "common-ground";
  const routeImpact = mode === "campaign" && campaignRoute === "breakwater" ? -4 : 0;
  const routeContinuity = mode === "campaign" && campaignRoute === "breakwater" ? -4 : campaignRoute === "common-ground" ? 3 : 0;
  const routeObjective = mode === "campaign" && campaignRoute === "watchtower" ? 5 : 0;
  const startingImpact = difficulties[difficulty].startImpact + (mode === "escalation" ? 12 : 0) - (campaignTier >= 2 ? 5 : 0) + (campaignTrust < 35 ? 5 : campaignTrust >= 75 ? -3 : 0) + variant.impact + routeImpact;
  const startingContinuity = 100 + (campaignTier >= 3 ? 5 : 0) + (campaignReadiness >= 60 ? 3 : campaignReadiness < 30 ? -5 : 0) + variant.continuity + routeContinuity;
  return {
    scenario,
    difficulty,
    chain: scenarios[scenario].choices.map(options => options[random(options.length)]),
    revealed: [],
    established: shuffle(procedures.map(p => p.id), random).slice(0, campaignTier >= 1 ? 5 : 4),
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
    adversaryTempo: difficulty === "crisis" || mode === "escalation" ? 1 : 0,
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
    objectiveProgress: clamp((mode === "escalation" ? 18 : 5) + (mode === "campaign" ? (setup.unresolvedThreads ?? 0) * 3 : 0) + variant.objective + routeObjective),
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
    mapActionsRemaining: mode === "expert" ? 2 : 3,
    mapHistory: [],
  };
}

export function getTurnLimit(game: Game) {
  return game.turnLimit;
}

export function getObjectiveRead(game: Game) {
  if (game.revealed.length < 2 && game.turns.length < 4) return { title: "Objective unconfirmed", detail: "Collect evidence across at least two stages to assess intent.", confidence: "LOW" };
  const objective = adversaryObjectives[game.objective];
  return { title: objective.title, detail: objective.tell, confidence: game.revealed.length >= 3 ? "HIGH" : "MODERATE" };
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
  const critical = nodeId === topology.critical;
  const sector = sectorSystems[game.scenario];
  const effect = action === "monitor"
    ? `Telemetry priority established on ${node.label}. The next aligned procedure gains analytical support.`
    : `${node.label} isolated. ${topology.criticalRule}`;
  return {
    ...game,
    focusedNode: nodeId,
    nodePosture: { ...game.nodePosture, [nodeId]: action === "monitor" ? "monitored" : "isolated" },
    mapActionsRemaining: game.mapActionsRemaining - 1,
    mapHistory: [...game.mapHistory, { node: nodeId, action, turn: game.turns.length, effect }],
    nextModifier: action === "monitor" ? Math.max(game.nextModifier, 2) : game.nextModifier,
    impact: clamp(game.impact + (action === "monitor" ? -2 : critical ? -8 : -5)),
    continuity: clamp(game.continuity + (action === "monitor" ? 0 : critical ? -10 : -5)),
    sectorHealth: clamp(game.sectorHealth + (action === "monitor" ? sector.monitoringRecovery : -(critical ? 7 : 3) - sector.containmentCost)),
    objectiveProgress: clamp(game.objectiveProgress + (action === "monitor" ? -4 : critical ? -12 : -8)),
  };
}

export function setCaseTheory(game: Game, objective: AdversaryObjectiveId): Game {
  if (game.status !== "playing" || game.pendingDecision || game.pendingCommand || game.pendingSetPiece) throw new Error("The case theory cannot be changed now.");
  if (!objectiveTheory[objective]) throw new Error("Unknown case theory.");
  if (game.caseTheory === objective) return game;
  return { ...game, caseTheory: objective, caseTheoryHistory: [...game.caseTheoryHistory, { turn: game.turns.length + 1, objective }] };
}

export function availableIn(game: Game, id: string) {
  return game.lastUsed[id] === undefined ? 0 : Math.max(0, game.lastUsed[id] + 4 - (game.turns.length + 1));
}

export function getLead(game: Game) {
  const scenario = scenarios[game.scenario];
  const index = Math.min(scenario.leads.length - 1, Math.floor(game.turns.length / 3));
  const reaction = game.adversaryEvent ? ` Latest development: ${game.adversaryEvent}` : "";
  const decoy = game.turns.length >= 2 ? ` Unverified signal: ${getAdversaryProfile(game).unverifiedSignal}` : "";
  return scenario.leads[index] + reaction + decoy;
}

export function getCoachPrompt(game: Game) {
  if (!game.hypothesis) return "Record a working hypothesis before acting. It can be changed when the evidence no longer fits.";
  if (game.pendingDecision) return "Compare evidence value, attacker opportunity and service consequence before intervening.";
  if (game.impact >= 70) return "Pressure is critical. Test the hypothesis whose failure would create the greatest consequence.";
  if (game.turns.some(turn => turn.success && !turn.revealed)) return "A successful check did not support the chain. Revise the hypothesis or select a source that can distinguish alternatives.";
  return "Use confirmed facts to predict the attacker’s next requirement, not merely the next available tool.";
}

export function getSuggestion(game: Game) {
  const hidden = game.chain.filter(id => !game.revealed.includes(id)).map(id => attacks.find(attack => attack.id === id)!);
  for (const attack of hidden) {
    const candidates = attack.detect.filter(id => !availableIn(game, id));
    candidates.sort((a, b) => Number(game.established.includes(b)) - Number(game.established.includes(a)));
    if (candidates.length) return procedures.find(procedure => procedure.id === candidates[0]);
  }
  return procedures.find(procedure => !availableIn(game, procedure.id));
}

export function getDecisionOptions(game: Game) {
  if (!game.pendingDecision) return null;
  const attack = attacks.find(item => item.id === game.pendingDecision)!;
  const language = decisionLanguage[attack.stage];
  return {
    attack,
    observe: { id: "observe" as const, title: language.observeTitle, description: language.observe, service: "No immediate disruption", evidence: "Evidence confidence improves", risk: "Attacker opportunity increases" },
    act: { id: "act" as const, title: language.actTitle, description: language.act, service: language.continuityCost <= -7 ? "Significant service risk" : "Limited service risk", evidence: "Some telemetry will be lost", risk: "Immediate exposure falls" },
  };
}

export function playTurn(game: Game, procedure: string, forcedRoll?: number, plan: ProcedurePlan = { scope: "focused", intensity: "balanced" }): Game {
  if (game.status !== "playing") throw new Error("This investigation has ended.");
  if (game.pendingDecision) throw new Error("Resolve the evidence decision first.");
  if (game.pendingCommand) throw new Error("Resolve the command event first.");
  if (game.pendingSetPiece) throw new Error("Resolve the sector decision first.");
  if (!procedures.some(item => item.id === procedure)) throw new Error("Unknown procedure.");
  if (availableIn(game, procedure) > 0) throw new Error("This procedure is cooling down.");

  const raw = forcedRoll ?? randomInt(20) + 1;
  if (!Number.isInteger(raw) || raw < 1 || raw > 20) throw new Error("Invalid d20 roll.");
  const g: Game = {
    ...game,
    chain: [...game.chain],
    revealed: [...game.revealed],
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
  };
  const config = difficulties[g.difficulty];
  const number = g.turns.length + 1;
  g.adversaryMemory.procedureCounts[procedure] = (g.adversaryMemory.procedureCounts[procedure] ?? 0) + 1;
  const nextHidden = g.chain.find(id => !g.revealed.includes(id));
  const hypothesis = hypotheses.find(item => item.id === g.hypothesis);
  const planningBonus = nextHidden && g.hypothesis === attackVector(nextHidden) && hypothesis?.procedures.includes(procedure) ? 2 : 0;
  const specialist = specialists[g.specialist];
  const specialistBonus = specialist.procedures.includes(procedure as never) && g.specialistFatigue < 5 ? 1 : 0;
  const scope = procedureScopes[plan.scope];
  const intensity = procedureIntensities[plan.intensity];
  const focusNode = infrastructureTopologies[g.scenario].nodes.find(node => node.id === g.focusedNode)!;
  const infrastructureBonus = focusNode.procedures.includes(procedure) ? 1 : 0;
  const modeModifier = g.mode === "expert" ? -1 : 0;
  const modifier = (g.established.includes(procedure) ? 2 : 0) + g.nextModifier + planningBonus + specialistBonus + infrastructureBonus + scope.modifier + intensity.modifier + modeModifier;
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
    narrative = attacks.find(attack => attack.id === match)!.evidence;
    g.adversaryTempo = Math.min(3, g.adversaryTempo + 1);
  } else if (success) {
    narrative = "The procedure completed, but the evidence does not support an undiscovered stage. The working hypothesis remains unconfirmed.";
    g.adversaryTempo = Math.min(3, g.adversaryTempo + 1);
  } else {
    narrative = "The action did not produce reliable evidence. The actor gains freedom while the team reorients.";
    g.adversaryTempo = Math.min(3, g.adversaryTempo + 1);
  }
  if (success) {
    const source = procedures.find(item => item.id === procedure)!;
    const evidenceTitle = revealed ? `${attacks.find(item => item.id === revealed)!.title} evidence` : `${source.title} exception`;
    g.evidence.push({
      id: `E${number}-${procedure}`,
      turn: number,
      title: evidenceTitle,
      source: source.title,
      system: focusNode.label,
      confidence: revealed || plan.intensity === "exhaustive" ? "HIGH" : "MODERATE",
      supports: revealed,
      detail: revealed ? narrative : `The finding at ${focusNode.label} is credible but does not yet establish a hidden attack stage.`,
    });
  }

  g.lastUsed[procedure] = number + intensity.cooldown;
  if (specialistBonus) g.specialistFatigue = Math.min(6, g.specialistFatigue + (plan.intensity === "exhaustive" ? 2 : 1));
  g.failures = success ? 0 : g.failures + 1;
  let inject: Inject | null = null;
  let injectReveal: string | null = null;
  let exerciseEnd = false;
  const reason = raw === 1 ? "Natural 1" : raw === 20 ? "Natural 20" : g.failures >= 3 ? "Three failed rolls" : null;
  if (reason && g.injectDeck.length) {
    const index = g.injectDeck.shift()!;
    inject = { ...injects[index], reason };
    if (g.failures >= 3) g.failures = 0;
    if (inject.effect === "bonus") g.nextModifier = 2;
    if (inject.effect === "penalty") { g.nextModifier = -2; impactChange += 6; }
    if (inject.effect === "pressure") impactChange += 8;
    if (inject.effect === "relief") impactChange -= 8;
    if (inject.effect === "restore") {
      const cooling = Object.keys(g.lastUsed).filter(id => g.lastUsed[id] + 4 > number + 1).sort((a, b) => g.lastUsed[a] - g.lastUsed[b]);
      if (cooling.length) {
        delete g.lastUsed[cooling[0]];
        inject.effectLabel = `${procedures.find(item => item.id === cooling[0])!.title} is available again.`;
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
    if (inject.effect === "end") exerciseEnd = true;
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
  const sectorChange = Math.min(5, Math.max(-14, -(sector.baseLoss + g.adversaryTempo * sector.tempoWeight + (success ? 0 : sector.failureCost) + (identityLed ? sector.exposureBias : 0) + (number >= 4 ? sector.lateBias : 0)) + (revealed ? sector.revealRelief : 0) + (boundarySuccess ? sector.boundaryRelief : 0) + protection + scopeSector + sectorSpecific + (g.specialist === "communications" ? sector.commsRecovery : 0)));
  const objectiveChange = Math.max(1, 6 + g.adversaryTempo * 3 + (success ? 0 : 4) - (revealed ? 6 : 0) + scope.objective + objectiveSpecific + (plan.scope === "enterprise" ? sector.enterpriseObjective : 0));
  g.sectorHealth = clamp(g.sectorHealth + sectorChange);
  g.sectorHistory.push(g.sectorHealth);
  g.objectiveProgress = clamp(g.objectiveProgress + objectiveChange);
  if (g.specialist === "communications") impactChange -= 2;
  g.impact = clamp(g.impact + impactChange);
  g.continuity = clamp(g.continuity + continuityChange);
  g.turns.push({ number, procedure, raw, modifier, planningBonus, total, success, revealed, narrative, inject, injectReveal, impactChange, continuityChange, adversaryEvent, hypothesis: g.hypothesis, plan, specialistBonus, sectorChange, objectiveChange });
  if (g.impact >= 100 || g.continuity <= 0 || g.sectorHealth <= 0 || g.objectiveProgress >= 100) g.status = "lost";
  else if (exerciseEnd && g.revealed.length < 4) g.status = "exercise";
  else if (number >= g.turnLimit && g.revealed.length < 4) g.status = "lost";
  else if (!g.pendingDecision && number === 2 && g.revealed.length < 4) g.pendingSetPiece = sectorSetPieces[g.scenario].id;
  else if (!g.pendingDecision && number % 3 === 0 && g.revealed.length < 4) {
    const ids = Object.keys(commandEvents) as CommandEventId[];
    g.pendingCommand = ids[(g.scenario + number + g.adversaryTempo) % ids.length];
  }
  return g;
}

function selectAdaptation(game: Game, stage: number, current: string) {
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

export function resolveDecision(game: Game, choice: "observe" | "act"): Game {
  if (game.status !== "playing" || !game.pendingDecision) throw new Error("No evidence decision is pending.");
  const g: Game = { ...game, chain: [...game.chain], decisions: [...game.decisions], adversaryMemory: { ...game.adversaryMemory } };
  if (choice === "observe") g.adversaryMemory.observeChoices += 1;
  else g.adversaryMemory.actChoices += 1;
  const stageId = g.pendingDecision!;
  const attack = attacks.find(item => item.id === stageId)!;
  const language = decisionLanguage[attack.stage];
  const highPressure = g.impact >= 55 || g.adversaryTempo >= 2;
  const quality = choice === "act" ? (highPressure ? 5 : 3) : (highPressure ? 2 : 5);
  const rationale = choice === "act"
    ? highPressure ? "Intervention matched the elevated impact and adversary tempo." : "Intervention reduced exposure, although evidence collection still had room to continue."
    : highPressure ? "Additional observation improved evidence but accepted substantial operational risk." : "Observation was proportionate while impact and adversary tempo remained manageable.";
  let adaptedFrom: string | null = null;
  let adaptedTo: string | null = null;
  let adaptationReason: string | null = null;

  if (choice === "observe") {
    g.nextModifier = Math.max(g.nextModifier, 2);
    g.impact = clamp(g.impact + language.observeCost);
    g.adversaryTempo = Math.min(3, g.adversaryTempo + 1);
    g.objectiveProgress = clamp(g.objectiveProgress + 6);
  } else {
    g.nextModifier = Math.min(g.nextModifier, -1);
    g.impact = clamp(g.impact + language.actRelief);
    g.continuity = clamp(g.continuity + language.continuityCost);
    g.adversaryTempo = Math.max(0, g.adversaryTempo - 1);
    g.objectiveProgress = clamp(g.objectiveProgress - 8);
    g.sectorHealth = clamp(g.sectorHealth - 2);
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
    title: choice === "observe" ? language.observeTitle : language.actTitle,
    effect: choice === "observe" ? "Evidence improved while attacker opportunity increased." : "Immediate exposure reduced; service and telemetry were affected.",
    counterfactual: choice === "observe" ? `${language.actTitle} would have reduced immediate exposure but sacrificed telemetry.` : `${language.observeTitle} would have improved confidence but given the actor more time.`,
    adaptedFrom,
    adaptedTo,
    adaptationReason,
    quality,
    rationale,
  });
  g.pendingDecision = null;
  if (g.impact >= 100 || g.continuity <= 0 || g.sectorHealth <= 0 || g.objectiveProgress >= 100) g.status = "lost";
  else if (g.revealed.length === 4) g.status = "response";
  else if (g.turns.length === 2 && !g.setPieceHistory.length) g.pendingSetPiece = sectorSetPieces[g.scenario].id;
  return g;
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
  if (g.impact >= 100 || g.continuity <= 0 || g.sectorHealth <= 0 || g.objectiveProgress >= 100) g.status = "lost";
  return g;
}

export function resolveSetPiece(game: Game, choice: "a" | "b"): Game {
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
  if (g.impact >= 100 || g.continuity <= 0 || g.sectorHealth <= 0 || g.objectiveProgress >= 100) g.status = "lost";
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
  const finding = correct
    ? valid
      ? `${first.title} and ${second.title} form a credible causal sequence across ${first.system} and ${second.system}.`
      : `${first.title} and ${second.title} overlap in time, but the available evidence does not establish causation.`
    : valid
      ? "The findings were assessed as coincidental, but their sequence and shared attack path support causation."
      : "The findings were treated as causal, but timing alone does not establish a dependable relationship.";
  return {
    ...game,
    nextModifier: correct ? Math.max(game.nextModifier, theoryAligned ? 3 : 2) : game.nextModifier,
    impact: clamp(game.impact + (correct ? (theoryAligned ? -5 : -3) : 4)),
    objectiveProgress: clamp(game.objectiveProgress + (correct ? (theoryAligned ? -10 : -6) : 3)),
    correlations: [...game.correlations, { evidence: evidenceIds, valid, assessment, correct, finding }],
  };
}

export function getAdversaryRead(game: Game) {
  const memory = game.adversaryMemory;
  const favourite = Object.entries(memory.procedureCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const source = favourite ? procedures.find(item => item.id === favourite)?.title : null;
  const posture = memory.actChoices > memory.observeChoices ? "expects rapid intervention" : memory.observeChoices > memory.actChoices ? "expects evidence preservation" : "is still learning your command posture";
  const hypothesis = memory.hypothesisChanges >= 3 ? "Your frequent hypothesis changes are creating exploitable uncertainty." : memory.hypothesisChanges ? "The actor has observed changes in your investigative theory." : "Your investigative theory remains difficult to infer.";
  const campaignRead = game.campaignDoctrine === "balanced" ? "No dominant campaign doctrine is yet visible." : `Across operations, the group expects a predominantly ${game.campaignDoctrine === "act" ? "intervention-led" : "observation-led"} response.`;
  const attribution = getAttributionRead(game);
  return `${attribution.title} ${posture}${source ? ` and has seen repeated use of ${source}.` : "."} ${hypothesis} ${campaignRead}`;
}

export function resolveResponse(game: Game, choice: string): Game {
  if (game.status !== "response") throw new Error("The response phase is not active.");
  const phase = game.responseChoices.length === 0 ? "containment" : game.responseChoices.length === 1 ? "assurance" : "recovery";
  const option = responseOptions[phase].find(item => item.id === choice);
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
  if (g.responseChoices.length === 3) {
    g.status = "won";
    g.nodePosture = Object.fromEntries(Object.keys(g.nodePosture).map(node => [node, g.nodePosture[node] === "isolated" ? "restored" : g.nodePosture[node]]));
  }
  return g;
}

export type ScoreBreakdown = {
  investigation: number;
  impact: number;
  continuity: number;
  decisions: number;
  response: number;
  hypothesis: number;
  total: number;
};

export function getScoreBreakdown(game: Game): ScoreBreakdown {
  const investigation = clamp(25 - Math.max(0, game.turns.length - 4) * 3, 0, 25);
  const impact = Math.round((100 - game.impact) * 0.15);
  const continuity = Math.round(((game.continuity + game.sectorHealth) / 2) * 0.15);
  const decisionItems = [...game.decisions.map(item => item.quality), ...game.commandHistory.map(item => item.quality), ...game.setPieceHistory.map(item => item.quality)];
  const decisionQuality = decisionItems.length ? decisionItems.reduce((sum, quality) => sum + quality, 0) / (decisionItems.length * 5) : 0;
  const decisions = Math.round(decisionQuality * 15);
  const response = Math.round(clamp(game.responseScore, 0, 55) / 55 * 20);
  const aligned = game.turns.filter(turn => turn.revealed && turn.hypothesis === attackVector(turn.revealed)).length;
  const hypothesis = game.revealed.length ? Math.round(aligned / game.revealed.length * 10) : 0;
  return { investigation, impact, continuity, decisions, response, hypothesis, total: investigation + impact + continuity + decisions + response + hypothesis };
}

export function getOutcome(game: Game) {
  const breakdown = getScoreBreakdown(game);
  if (breakdown.total >= 82) return { grade: "A", title: "Controlled recovery", detail: "You balanced evidence, disruption and service continuity with strong operational judgement.", breakdown };
  if (breakdown.total >= 68) return { grade: "B", title: "Stable, with residual risk", detail: "The incident is contained, but the review identifies avoidable exposure or disruption.", breakdown };
  if (breakdown.total >= 52) return { grade: "C", title: "Costly stabilisation", detail: "Services are recovering, but uncertainty and operational cost remain high.", breakdown };
  return { grade: "D", title: "Fragile recovery", detail: "The immediate crisis passed, but the response left significant residual risk.", breakdown };
}

export function getCounterfactuals(game: Game) {
  const items = game.decisions.slice(-3).map(decision => `${decision.title}: ${decision.counterfactual} ${decision.rationale}`);
  const dynamics = scenarioDynamics[game.scenario];
  if (game.responseChoices.length) {
    const containment = responseOptions.containment.find(option => option.id === game.responseChoices[0]);
    items.push(`Containment: ${containment?.title} prioritised ${containment?.disruption.toLowerCase()} disruption and left ${containment?.residual.toLowerCase()} residual risk. ${dynamics.countermeasure}`);
  }
  if (game.responseChoices.length > 1) {
    const assurance = responseOptions.assurance.find(option => option.id === game.responseChoices[1]);
    items.push(`Assurance: ${assurance?.title} established ${assurance?.confidence.toLowerCase()} confidence before restoration.`);
  }
  if (game.mapHistory.some(record => record.action === "isolate")) items.push("Infrastructure isolation reduced actor opportunity, but every isolated dependency had to be justified and restored deliberately.");
  const actualChanges = game.hypothesisHistory.reduce((count, entry, index, history) => count + (index > 0 && history[index - 1].id !== entry.id ? 1 : 0), 0);
  if (actualChanges > 2) items.push("The working hypothesis changed several times across turns. Earlier disconfirming evidence could have reduced investigative delay.");
  else if (!game.hypothesisHistory.length) items.push("No working hypothesis was recorded, so the team could not compare its assumptions with the final chain.");
  const weakCorrelations = game.correlations.filter(record => !record.valid).length;
  if (weakCorrelations) items.push(`${weakCorrelations} tested evidence relationship${weakCorrelations === 1 ? " was" : "s were"} temporal rather than causal. A stronger system-to-identity link would have reduced analytical noise.`);
  if (!game.correlations.length && game.evidence.length >= 2) items.push("Multiple findings were preserved but never correlated. The team left potential causal relationships untested.");
  if (game.setPieceHistory.some(record => record.quality <= 2)) items.push("The sector crisis decision protected short-term convenience but increased strategic exposure.");
  return items;
}
