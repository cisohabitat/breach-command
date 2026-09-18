// @ts-expect-error Native Node TypeScript execution requires the source extension.
import { attacks, procedures, scenarios, stages, difficulties, hypotheses, scenarioDynamics, attackVector, randomInt, type Difficulty, type HypothesisId } from "./game.ts";

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
    title: "Evasive operator",
    description: "Avoids recently examined evidence sources and favours identity or cloud trust.",
    preferredVectors: ["identity", "cloud", "application", "endpoint"] as HypothesisId[],
    cadence: 3,
    pressure: 2,
    unverifiedSignal: "A low-confidence identity alert may be operational noise or deliberate distraction.",
  },
  raider: {
    title: "Rapid exploiter",
    description: "Pushes execution and movement quickly when the response hesitates.",
    preferredVectors: ["endpoint", "application", "identity", "cloud"] as HypothesisId[],
    cadence: 2,
    pressure: 3,
    unverifiedSignal: "A burst of endpoint alerts is credible, but its relationship to the original access remains unproven.",
  },
  broker: {
    title: "Trust-path operator",
    description: "Blends into supplier, application and shared-service relationships.",
    preferredVectors: ["application", "identity", "cloud", "endpoint"] as HypothesisId[],
    cadence: 3,
    pressure: 1,
    unverifiedSignal: "A partner-originated event overlaps the timeline but has not been causally linked.",
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
  ["ghost", "broker"],
  ["ghost", "raider"],
  ["broker", "ghost"],
  ["raider", "broker"],
  ["ghost", "raider"],
  ["broker", "ghost"],
  ["ghost", "broker"],
  ["raider", "broker"],
  ["broker", "raider"],
  ["ghost", "raider"],
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

export function getOperationalLabel(game: Game) {
  return scenarioDynamics[game.scenario].label;
}

export function newGame(scenario: number, difficulty: Difficulty = "operational", random = (max: number) => randomInt(max)): Game {
  if (!Number.isInteger(scenario) || !scenarios[scenario]) throw new Error("Unknown incident");
  if (!difficulties[difficulty]) throw new Error("Unknown difficulty");
  const profiles = scenarioProfiles[scenario];
  return {
    scenario,
    difficulty,
    chain: scenarios[scenario].choices.map(options => options[random(options.length)]),
    revealed: [],
    established: shuffle(procedures.map(p => p.id), random).slice(0, 4),
    lastUsed: {},
    turns: [],
    failures: 0,
    nextModifier: 0,
    injectDeck: shuffle(injects.map((_, i) => i), random),
    status: "playing",
    impact: difficulties[difficulty].startImpact,
    continuity: 100,
    pendingDecision: null,
    decisions: [],
    responseChoices: [],
    responseScore: 0,
    hypothesis: null,
    hypothesisHistory: [],
    adversaryTempo: difficulty === "crisis" ? 1 : 0,
    adversaryEvent: null,
    adversaryProfile: profiles[random(profiles.length)],
    adversaryMemory: { procedureCounts: {}, observeChoices: 0, actChoices: 0, hypothesisChanges: 0 },
    pendingCommand: null,
    commandHistory: [],
  };
}

export function setHypothesis(game: Game, id: HypothesisId): Game {
  if (game.status !== "playing" || game.pendingDecision) throw new Error("The hypothesis cannot be changed now.");
  if (game.pendingCommand) throw new Error("Resolve the command event first.");
  if (!hypotheses.some(h => h.id === id)) throw new Error("Unknown hypothesis.");
  if (game.hypothesis === id) return game;
  const turn = game.turns.length + 1;
  const hypothesisHistory = game.hypothesisHistory.filter(entry => entry.turn !== turn);
  hypothesisHistory.push({ turn, id });
  return { ...game, hypothesis: id, hypothesisHistory, adversaryMemory: { ...game.adversaryMemory, hypothesisChanges: game.adversaryMemory.hypothesisChanges + (game.hypothesis ? 1 : 0) } };
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

export function playTurn(game: Game, procedure: string, forcedRoll?: number): Game {
  if (game.status !== "playing") throw new Error("This investigation has ended.");
  if (game.pendingDecision) throw new Error("Resolve the evidence decision first.");
  if (game.pendingCommand) throw new Error("Resolve the command event first.");
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
  };
  const config = difficulties[g.difficulty];
  const number = g.turns.length + 1;
  g.adversaryMemory.procedureCounts[procedure] = (g.adversaryMemory.procedureCounts[procedure] ?? 0) + 1;
  const nextHidden = g.chain.find(id => !g.revealed.includes(id));
  const hypothesis = hypotheses.find(item => item.id === g.hypothesis);
  const planningBonus = nextHidden && g.hypothesis === attackVector(nextHidden) && hypothesis?.procedures.includes(procedure) ? 1 : 0;
  const modifier = (g.established.includes(procedure) ? 3 : 0) + g.nextModifier + planningBonus;
  const total = raw + modifier;
  const success = total >= config.threshold;
  g.nextModifier = 0;

  const match = success ? g.chain.find(id => !g.revealed.includes(id) && attacks.find(attack => attack.id === id)!.detect.includes(procedure)) : undefined;
  let revealed: string | null = null;
  let narrative = "";
  let impactChange = success ? 3 : 10;
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

  g.lastUsed[procedure] = number;
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
  g.impact = clamp(g.impact + impactChange);
  g.continuity = clamp(g.continuity + continuityChange);
  g.turns.push({ number, procedure, raw, modifier, planningBonus, total, success, revealed, narrative, inject, injectReveal, impactChange, continuityChange, adversaryEvent, hypothesis: g.hypothesis });
  if (g.impact >= 100 || g.continuity <= 0) g.status = "lost";
  else if (exerciseEnd && g.revealed.length < 4) g.status = "exercise";
  else if (number >= config.maxTurns && g.revealed.length < 4) g.status = "lost";
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
  } else {
    g.nextModifier = Math.min(g.nextModifier, -1);
    g.impact = clamp(g.impact + language.actRelief);
    g.continuity = clamp(g.continuity + language.continuityCost);
    g.adversaryTempo = Math.max(0, g.adversaryTempo - 1);
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
  if (g.impact >= 100 || g.continuity <= 0) g.status = "lost";
  else if (g.revealed.length === 4) g.status = "response";
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
  g.commandHistory.push({ event: eventId, choice, title: option.title, quality: option.quality, effect: option.signal });
  g.pendingCommand = null;
  if (g.impact >= 100 || g.continuity <= 0) g.status = "lost";
  return g;
}

export function getAdversaryRead(game: Game) {
  const memory = game.adversaryMemory;
  const favourite = Object.entries(memory.procedureCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const source = favourite ? procedures.find(item => item.id === favourite)?.title : null;
  const posture = memory.actChoices > memory.observeChoices ? "expects rapid intervention" : memory.observeChoices > memory.actChoices ? "expects evidence preservation" : "is still learning your command posture";
  const hypothesis = memory.hypothesisChanges >= 3 ? "Your frequent hypothesis changes are creating exploitable uncertainty." : memory.hypothesisChanges ? "The actor has observed changes in your investigative theory." : "Your investigative theory remains difficult to infer.";
  return `${getAdversaryProfile(game).title} ${posture}${source ? ` and has seen repeated use of ${source}.` : "."} ${hypothesis}`;
}

export function resolveResponse(game: Game, choice: string): Game {
  if (game.status !== "response") throw new Error("The response phase is not active.");
  const phase = game.responseChoices.length === 0 ? "containment" : "recovery";
  const option = responseOptions[phase].find(item => item.id === choice);
  if (!option) throw new Error("Unknown response choice.");
  const g: Game = { ...game, responseChoices: [...game.responseChoices, choice] };
  const preferred = scenarios[g.scenario].preferred[g.responseChoices.length - 1] === choice;
  g.impact = clamp(g.impact + option.impact);
  g.continuity = clamp(g.continuity + option.continuity);
  g.responseScore += option.score + (preferred ? 6 : 0);
  if (g.responseChoices.length === 2) g.status = "won";
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
  const continuity = Math.round(game.continuity * 0.15);
  const decisionItems = [...game.decisions.map(item => item.quality), ...game.commandHistory.map(item => item.quality)];
  const decisionQuality = decisionItems.length ? decisionItems.reduce((sum, quality) => sum + quality, 0) / (decisionItems.length * 5) : 0;
  const decisions = Math.round(decisionQuality * 15);
  const response = Math.round(clamp(game.responseScore, 0, 38) / 38 * 20);
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
  const actualChanges = game.hypothesisHistory.reduce((count, entry, index, history) => count + (index > 0 && history[index - 1].id !== entry.id ? 1 : 0), 0);
  if (actualChanges > 2) items.push("The working hypothesis changed several times across turns. Earlier disconfirming evidence could have reduced investigative delay.");
  else if (!game.hypothesisHistory.length) items.push("No working hypothesis was recorded, so the team could not compare its assumptions with the final chain.");
  return items;
}
