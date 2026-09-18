export type GameMode = "campaign" | "daily" | "ironman" | "escalation" | "expert";
export type SpecialistId = "hunter" | "forensics" | "identity" | "ot" | "continuity" | "communications";
export type ProcedureScope = "focused" | "enterprise";
export type ProcedureIntensity = "rapid" | "balanced" | "exhaustive";
export type ProcedurePlan = { scope: ProcedureScope; intensity: ProcedureIntensity };
export type AdversaryObjectiveId = "exfiltration" | "disruption" | "fraud" | "espionage" | "preposition";

export const gameModes: Record<GameMode, { title: string; description: string; reward: number }> = {
  campaign: { title: "Campaign", description: "Persistent readiness, trust and team fatigue carry between incidents.", reward: 1 },
  daily: { title: "Daily operation", description: "A fixed incident seed gives every commander the same case today.", reward: 1.15 },
  ironman: { title: "Ironman", description: "No mid-incident save and one fewer turn. Decisions are final.", reward: 1.35 },
  escalation: { title: "Escalation", description: "Begin under pressure against an actor already moving.", reward: 1.4 },
  expert: { title: "Expert", description: "No coaching or suggested evidence. Thresholds are one point higher.", reward: 1.5 },
};

export const specialists = {
  hunter: { title: "Threat hunter", role: "Cross-source behaviour", procedures: ["hunt", "network", "intel"], ability: "+1 when using hunting, network or intelligence evidence." },
  forensics: { title: "Forensics lead", role: "Host and artefact reconstruction", procedures: ["forensic", "endpoint", "server"], ability: "+1 when using endpoint, server or forensic evidence." },
  identity: { title: "Identity specialist", role: "Accounts, tokens and trust", procedures: ["identity", "cloud", "email"], ability: "+1 when using identity, cloud or email evidence." },
  ot: { title: "OT security engineer", role: "Operational technology boundaries", procedures: ["network", "firewall", "server"], ability: "+1 on boundary evidence and reduces sector degradation." },
  continuity: { title: "Continuity lead", role: "Service consequence management", procedures: ["server", "cloud", "network"], ability: "Reduces continuity and sector-health losses from investigative delay." },
  communications: { title: "Communications lead", role: "Leadership and stakeholder confidence", procedures: ["intel", "email", "identity"], ability: "Reduces business pressure and improves leadership decisions." },
} as const;

export const procedureScopes = {
  focused: { title: "Focused", description: "Test the working hypothesis against the most relevant system.", modifier: 0, impact: 0, objective: -2 },
  enterprise: { title: "Enterprise", description: "Search connected environments for broader scope at a time cost.", modifier: -1, impact: 4, objective: -5 },
} as const;

export const procedureIntensities = {
  rapid: { title: "Rapid", description: "Move quickly with lower analytical confidence.", modifier: -1, impact: -2, cooldown: 0 },
  balanced: { title: "Balanced", description: "Balance confidence, time and operational pressure.", modifier: 0, impact: 0, cooldown: 0 },
  exhaustive: { title: "Exhaustive", description: "Increase confidence, but consume time and specialist capacity.", modifier: 2, impact: 5, cooldown: 1 },
} as const;

export const adversaryObjectives = {
  exfiltration: { title: "Strategic data theft", tell: "The actor is staging and moving high-value information.", pressure: "DATA EXPOSURE" },
  disruption: { title: "Service disruption", tell: "The actor is positioning to interrupt an essential service.", pressure: "DISRUPTION READINESS" },
  fraud: { title: "Financial manipulation", tell: "The actor is seeking trusted transactions and approval paths.", pressure: "FRAUD POSITION" },
  espionage: { title: "Long-term collection", tell: "The actor values durable access and low-noise collection.", pressure: "COLLECTION POSITION" },
  preposition: { title: "Strategic pre-positioning", tell: "The actor is mapping dependencies for later operational effect.", pressure: "PRE-POSITIONING" },
} as const;

// Each sector now combines a distinct base loss with its own mechanical terms,
// so the rule text describes real behaviour: how fast the sector decays, what
// relieves it, and how containment and scope affect it.
export type SectorSystem = {
  title: string; unit: string; rule: string; baseLoss: number; transmissions: string[];
  tempoWeight: number; revealRelief: number; failureCost: number; exposureBias: number;
  boundaryRelief: number; lateBias: number; enterpriseBias: number; focusedBias: number;
  enterpriseObjective: number; commsRecovery: number; exhaustiveContinuity: number;
  containmentCost: number; monitoringRecovery: number;
};

export const sectorSystems: SectorSystem[] = [
  { title: "Business service confidence", unit: "SERVICE CONFIDENCE", rule: "Identity and cloud exposure erodes shared service confidence fastest; monitoring restores a little, while isolating a control path adds administrative cost.", baseLoss: 4, tempoWeight: 1, revealRelief: 5, failureCost: 2, exposureBias: 2, boundaryRelief: 0, lateBias: 0, enterpriseBias: 0, focusedBias: 0, enterpriseObjective: 0, commsRecovery: 0, exhaustiveContinuity: 0, containmentCost: 2, monitoringRecovery: 2, transmissions: ["Payroll owners request a confidence assessment.", "Privileged access owners begin an emergency review."] },
  { title: "Clinical service margin", unit: "PATIENT SERVICE MARGIN", rule: "Containment cuts deepest here: every isolation costs clinical margin, failed analysis costs more, and exhaustive analysis taxes continuity.", baseLoss: 5, tempoWeight: 1, revealRelief: 4, failureCost: 3, exposureBias: 0, boundaryRelief: 0, lateBias: 0, enterpriseBias: 0, focusedBias: 0, enterpriseObjective: 0, commsRecovery: 0, exhaustiveContinuity: 3, containmentCost: 4, monitoringRecovery: 1, transmissions: ["Clinical operations asks whether scheduling can remain online.", "The duty manager reports growing workstation delays."] },
  { title: "Operational support integrity", unit: "OT SUPPORT INTEGRITY", rule: "Successful boundary investigation protects support integrity and monitoring recovers it fastest, but any isolation erodes engineering support.", baseLoss: 4, tempoWeight: 1, revealRelief: 4, failureCost: 2, exposureBias: 0, boundaryRelief: 2, lateBias: 0, enterpriseBias: 0, focusedBias: 0, enterpriseObjective: 0, commsRecovery: 0, exhaustiveContinuity: 0, containmentCost: 3, monitoringRecovery: 3, transmissions: ["Plant operations confirms generation remains stable.", "The supplier cannot validate the remote session."] },
  { title: "Terminal operating window", unit: "TERMINAL CAPACITY", rule: "The operating window closes quickly: adversary tempo counts double and capacity falls faster from the fourth turn onward.", baseLoss: 6, tempoWeight: 2, revealRelief: 3, failureCost: 2, exposureBias: 0, boundaryRelief: 0, lateBias: 2, enterpriseBias: 0, focusedBias: 0, enterpriseObjective: 0, commsRecovery: 0, exhaustiveContinuity: 0, containmentCost: 3, monitoringRecovery: 2, transmissions: ["Vessel planners ask whether partner bookings remain trusted.", "The terminal approaches its next operating cut-off."] },
  { title: "Tenant trust boundary", unit: "TENANT TRUST", rule: "Control-plane and identity exposure widens tenant risk fastest; enterprise-scope hunting advances the attacker objective and monitoring reassures little.", baseLoss: 5, tempoWeight: 1, revealRelief: 5, failureCost: 2, exposureBias: 3, boundaryRelief: 0, lateBias: 0, enterpriseBias: 0, focusedBias: 0, enterpriseObjective: 3, commsRecovery: 0, exhaustiveContinuity: 0, containmentCost: 2, monitoringRecovery: 1, transmissions: ["A second tenant reports an unusual control-plane event.", "Transfer volume continues to rise without a deployment record."] },
  { title: "Shared-service confidence", unit: "DEPENDENCY CONFIDENCE", rule: "Unverified trust propagates to dependent organisations: failed analysis costs the most confidence, and a focus too narrow for the shared path loses more.", baseLoss: 5, tempoWeight: 1, revealRelief: 4, failureCost: 3, exposureBias: 0, boundaryRelief: 1, lateBias: 0, enterpriseBias: 0, focusedBias: 2, enterpriseObjective: 0, commsRecovery: 0, exhaustiveContinuity: 0, containmentCost: 2, monitoringRecovery: 2, transmissions: ["A dependent organisation requests confirmed indicators.", "Shared support teams report conflicting identity records."] },
  { title: "Public transaction capacity", unit: "PUBLIC SERVICE CAPACITY", rule: "Public demand constrains disruptive containment: a communications lead protects capacity, while isolation is more disruptive than usual.", baseLoss: 4, tempoWeight: 1, revealRelief: 5, failureCost: 2, exposureBias: 0, boundaryRelief: 0, lateBias: 0, enterpriseBias: 0, focusedBias: 0, enterpriseObjective: 0, commsRecovery: 2, exhaustiveContinuity: 0, containmentCost: 3, monitoringRecovery: 2, transmissions: ["The public transaction peak begins in forty minutes.", "Two agencies request a common operating picture."] },
  { title: "Core network stability", unit: "NETWORK STABILITY", rule: "Core stability decays fastest of all sectors, but successful network, firewall or DNS analysis restores it quickly.", baseLoss: 7, tempoWeight: 1, revealRelief: 4, failureCost: 2, exposureBias: 0, boundaryRelief: 3, lateBias: 0, enterpriseBias: 0, focusedBias: 0, enterpriseObjective: 0, commsRecovery: 0, exhaustiveContinuity: 0, containmentCost: 3, monitoringRecovery: 2, transmissions: ["Network operations sees instability in a neighbouring domain.", "Customer-impact indicators begin to rise."] },
  { title: "Process safety margin", unit: "PROCESS SAFETY MARGIN", rule: "The safety margin is the most resilient to delay, but enterprise-scope actions and any isolation erode it sharply.", baseLoss: 3, tempoWeight: 1, revealRelief: 5, failureCost: 2, exposureBias: 0, boundaryRelief: 1, lateBias: 0, enterpriseBias: 3, focusedBias: 0, enterpriseObjective: 0, commsRecovery: 0, exhaustiveContinuity: 0, containmentCost: 4, monitoringRecovery: 3, transmissions: ["Operators move one process area to manual supervision.", "Engineering requests confirmation that safety logic is unaffected."] },
  { title: "Clearing-window integrity", unit: "CLEARING INTEGRITY", rule: "Integrity erodes with delay and failure: adversary tempo counts double and every failed procedure costs more close to settlement.", baseLoss: 6, tempoWeight: 2, revealRelief: 3, failureCost: 3, exposureBias: 0, boundaryRelief: 0, lateBias: 0, enterpriseBias: 0, focusedBias: 0, enterpriseObjective: 0, commsRecovery: 0, exhaustiveContinuity: 0, containmentCost: 2, monitoringRecovery: 1, transmissions: ["Fraud operations identifies several unusual approvals.", "The clearing cut-off is approaching."] },
];

const objectiveRotation: AdversaryObjectiveId[][] = [
  ["espionage", "exfiltration"], ["disruption", "espionage"], ["preposition", "disruption"], ["exfiltration", "disruption"], ["exfiltration", "espionage"],
  ["preposition", "espionage"], ["disruption", "espionage"], ["disruption", "preposition"], ["preposition", "disruption"], ["fraud", "exfiltration"],
];

export function objectiveForScenario(scenario: number, pick: number): AdversaryObjectiveId {
  const choices = objectiveRotation[scenario] ?? objectiveRotation[0];
  return choices[pick % choices.length];
}

export function modeRandom(mode: GameMode, scenario: number, now = new Date()) {
  if (mode !== "daily") return undefined;
  const stamp = Number(`${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`) + scenario * 997;
  let state = stamp >>> 0;
  return (max: number) => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state % max;
  };
}
