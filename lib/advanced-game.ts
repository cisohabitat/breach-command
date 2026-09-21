import { attacks, procedures, scenarios, stages, difficulties, hypotheses, scenarioDynamics, attackVector, randomInt, type Difficulty, type HypothesisId } from "./game.ts";
import { adversaryObjectives, gameModes, objectiveForScenario, procedureIntensities, procedureScopes, sectorSystems, specialists, type AdversaryObjectiveId, type GameMode, type ProcedureIntensity, type ProcedurePlan, type ProcedureScope, type SpecialistId } from "./command-systems.ts";
import { infrastructureTopologies, sectorSetPieces, seededRoll, type SetPieceId } from "./phase8.ts";
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
  // What the working hypothesis was actually tested against on this turn. The
  // planning bonus, the score and the after-action ledger all read these, so the
  // number the player is given and the reason they are given it cannot drift.
  hypothesisTarget: string | null;
  hypothesisMatched: boolean;
  discriminating: boolean;
};
// Five decision verbs replace the single observe/act binary. Each verb moves the
// operational picture differently: evidence and tempo, service continuity, sector
// condition and adversary objective all respond to the choice.
export type DecisionChoice = "observe" | "act" | "attribute" | "contain" | "notify";
export type DecisionRecord = {
  stage: string;
  choice: DecisionChoice;
  title: string;
  effect: string;
  counterfactual: string;
  adaptedFrom: string | null;
  adaptedTo: string | null;
  adaptationReason: string | null;
  quality: number;
  rationale: string;
  impactChange: number;
  continuityChange: number;
  tempoChange: number;
  sectorChange: number;
  objectiveChange: number;
};
export type DecisionOption = {
  id: DecisionChoice;
  title: string;
  description: string;
  service: string;
  evidence: string;
  risk: string;
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
  // Rapid coordination: a seasoned command absorbs one unlucky action per
  // operation without handing the adversary tempo for it.
  graceRemaining: number;
  // Set for operations that promise reproducibility (Daily Operation and any
  // challenge code). Null leaves procedure rolls on the unseeded generator, so
  // ordinary campaign play stays unpredictable.
  seed: number | null;
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
  seed?: number | null;
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

export type ResponsePhase = "containment" | "assurance" | "recovery";
export type ResponseOption = { id: string; title: string; description: string; disruption: string; confidence: string; residual: string; impact: number; continuity: number; score: number };
export type ResponseProfile = { constraint: string; containment: ResponseOption[]; assurance: ResponseOption[]; recovery: ResponseOption[] };

// The response set is authored per incident. Containment, assurance and recovery
// each carry the sector's own constraint, so the same three-stage sequence is not
// a single fixed list: the disruption, service cost and residual risk differ with
// the sector under investigation. Ids are stable so scoring and objective
// alignment stay internally consistent across every sector.
export const responseProfiles: ResponseProfile[] = [
  {
    constraint: "Business service confidence: isolating the shared application tier interrupts payroll and dependent workflows first.",
    containment: [
      { id: "isolate", title: "Isolate the business application tier", description: "Severs the trust path to shared applications and stops dependent workflows.", disruption: "High", confidence: "Strong", residual: "Low", impact: -24, continuity: -16, score: 12 },
      { id: "credential", title: "Revoke business identities and sessions", description: "Constrains identity-led movement across payroll and shared services.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -17, continuity: -6, score: 11 },
      { id: "monitor", title: "Monitor the shared service path", description: "Preserves payroll availability while the actor retains opportunity.", disruption: "Low", confidence: "Developing", residual: "High", impact: 5, continuity: 6, score: 9 },
    ],
    assurance: [
      { id: "verify", title: "Validate the trusted service boundary", description: "Test identities, integrations and dependencies before restoration.", disruption: "Moderate", confidence: "Strong", residual: "Low", impact: -8, continuity: -4, score: 13 },
      { id: "preserve", title: "Preserve business service evidence", description: "Retain approval, identity and application artefacts before change.", disruption: "Moderate", confidence: "Strong", residual: "Moderate", impact: -5, continuity: -5, score: 12 },
      { id: "accelerate", title: "Accept operational assurance", description: "Use existing service checks to shorten the administrative freeze.", disruption: "Low", confidence: "Developing", residual: "High", impact: 2, continuity: 5, score: 8 },
    ],
    recovery: [
      { id: "rebuild", title: "Rebuild the application tier from baseline", description: "Highest assurance for shared services, with the longest payroll interruption.", disruption: "High", confidence: "Strong", residual: "Low", impact: -18, continuity: -13, score: 14 },
      { id: "restore", title: "Restore validated service backups", description: "Returns payroll and shared applications faster if integrity is understood.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -12, continuity: 2, score: 11 },
      { id: "patch", title: "Patch in place and monitor", description: "Minimises payroll disruption and retains more uncertainty.", disruption: "Low", confidence: "Limited", residual: "High", impact: -6, continuity: 8, score: 7 },
    ],
  },
  {
    constraint: "Clinical service margin: containment cuts deepest here, and every isolation must be justified against care delivery.",
    containment: [
      { id: "isolate", title: "Isolate the support path serving clinical work", description: "Stops support access and suspends scheduling and records for care teams.", disruption: "High", confidence: "Strong", residual: "Low", impact: -22, continuity: -19, score: 12 },
      { id: "credential", title: "Revoke clinical support identities", description: "Constrains support access with limited interruption to care delivery.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -15, continuity: -6, score: 12 },
      { id: "monitor", title: "Monitor the clinical support path", description: "Preserves clinical continuity while the actor retains opportunity.", disruption: "Low", confidence: "Developing", residual: "High", impact: 6, continuity: 7, score: 10 },
    ],
    assurance: [
      { id: "verify", title: "Validate the clinical boundary", description: "Prove identities, routes and dependent workflows before restoration.", disruption: "Moderate", confidence: "Strong", residual: "Low", impact: -8, continuity: -5, score: 13 },
      { id: "preserve", title: "Preserve clinical support evidence", description: "Retain volatile artefacts before the support path changes again.", disruption: "Moderate", confidence: "Strong", residual: "Moderate", impact: -5, continuity: -6, score: 12 },
      { id: "accelerate", title: "Accept operational assurance", description: "Shorten the interruption using current clinical checks.", disruption: "Low", confidence: "Developing", residual: "High", impact: 3, continuity: 6, score: 8 },
    ],
    recovery: [
      { id: "rebuild", title: "Rebuild the support estate from baseline", description: "Highest assurance, with the longest period of manual clinical work.", disruption: "High", confidence: "Strong", residual: "Low", impact: -17, continuity: -16, score: 14 },
      { id: "restore", title: "Restore validated clinical backups", description: "Returns scheduling and records faster if integrity is sound.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -11, continuity: 3, score: 12 },
      { id: "patch", title: "Patch in place and monitor", description: "Minimises clinical disruption and retains more uncertainty.", disruption: "Low", confidence: "Limited", residual: "High", impact: -5, continuity: 8, score: 7 },
    ],
  },
  {
    constraint: "Operational support integrity: successful boundary analysis protects support, but isolation erodes engineering capacity.",
    containment: [
      { id: "isolate", title: "Isolate the maintenance jump host", description: "Removes remote support and leaves local engineers covering operations.", disruption: "High", confidence: "Strong", residual: "Low", impact: -21, continuity: -14, score: 12 },
      { id: "credential", title: "Revoke supplier and support identities", description: "Constrains the support trust path while local administration continues.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -16, continuity: -8, score: 12 },
      { id: "monitor", title: "Monitor the support boundary", description: "Preserves engineering support while accepting continued actor access.", disruption: "Low", confidence: "Developing", residual: "High", impact: 5, continuity: 6, score: 9 },
    ],
    assurance: [
      { id: "verify", title: "Validate the engineering boundary", description: "Test supplier routes and support dependencies before restoration.", disruption: "Moderate", confidence: "Strong", residual: "Low", impact: -9, continuity: -4, score: 14 },
      { id: "preserve", title: "Preserve support artefacts", description: "Retain jump-host and configuration evidence before change.", disruption: "Moderate", confidence: "Strong", residual: "Moderate", impact: -6, continuity: -5, score: 12 },
      { id: "accelerate", title: "Accept operational assurance", description: "Use plant checks to shorten the maintenance interruption.", disruption: "Low", confidence: "Developing", residual: "High", impact: 2, continuity: 5, score: 8 },
    ],
    recovery: [
      { id: "rebuild", title: "Rebuild the support estate from baseline", description: "Strongest assurance, with the longest engineering-capacity gap.", disruption: "High", confidence: "Strong", residual: "Low", impact: -18, continuity: -12, score: 14 },
      { id: "restore", title: "Restore validated support backups", description: "Returns maintenance capability faster if integrity is understood.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -12, continuity: 2, score: 11 },
      { id: "patch", title: "Patch in place and monitor", description: "Protects engineering capacity and retains uncertainty.", disruption: "Low", confidence: "Limited", residual: "High", impact: -6, continuity: 7, score: 8 },
    ],
  },
  {
    constraint: "Terminal operating window: capacity falls fastest late in the incident, and isolation severs partner transactions first.",
    containment: [
      { id: "isolate", title: "Isolate the booking portal", description: "Cuts external partner access and shifts bookings to manual handling.", disruption: "High", confidence: "Strong", residual: "Low", impact: -25, continuity: -18, score: 13 },
      { id: "credential", title: "Revoke partner and planning identities", description: "Constrains the portal trust path with limited terminal disruption.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -16, continuity: -6, score: 11 },
      { id: "monitor", title: "Monitor the portal while mapping scope", description: "Preserves terminal throughput while partner risk persists.", disruption: "Low", confidence: "Developing", residual: "High", impact: 7, continuity: 6, score: 9 },
    ],
    assurance: [
      { id: "verify", title: "Validate the partner boundary", description: "Test portal identities and planning dependencies before restoration.", disruption: "Moderate", confidence: "Strong", residual: "Low", impact: -8, continuity: -4, score: 13 },
      { id: "preserve", title: "Preserve booking evidence", description: "Retain portal and scheduling artefacts before the platform changes.", disruption: "Moderate", confidence: "Strong", residual: "Moderate", impact: -5, continuity: -5, score: 12 },
      { id: "accelerate", title: "Accept operational assurance", description: "Shorten the manual window using current terminal checks.", disruption: "Low", confidence: "Developing", residual: "High", impact: 3, continuity: 6, score: 8 },
    ],
    recovery: [
      { id: "rebuild", title: "Rebuild the booking platform from baseline", description: "Highest assurance, with the longest planning interruption.", disruption: "High", confidence: "Strong", residual: "Low", impact: -18, continuity: -14, score: 14 },
      { id: "restore", title: "Restore validated scheduling backups", description: "Returns automated planning faster if integrity is sound.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -12, continuity: 3, score: 12 },
      { id: "patch", title: "Patch in place and monitor", description: "Protects terminal capacity and retains uncertainty.", disruption: "Low", confidence: "Limited", residual: "High", impact: -6, continuity: 8, score: 7 },
    ],
  },
  {
    constraint: "Tenant trust boundary: control-plane exposure widens tenant risk, and unapproved scope advances the actor's objective.",
    containment: [
      { id: "isolate", title: "Isolate the affected tenant boundary", description: "Stops the privilege path to tenant resources and disrupts shared workloads.", disruption: "High", confidence: "Strong", residual: "Low", impact: -23, continuity: -15, score: 12 },
      { id: "credential", title: "Revoke workload identities and keys", description: "Constrains control-plane access while dependent automation keeps running.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -18, continuity: -5, score: 12 },
      { id: "monitor", title: "Monitor the control plane", description: "Preserves workload availability while the privilege path stays open.", disruption: "Low", confidence: "Developing", residual: "High", impact: 5, continuity: 6, score: 9 },
    ],
    assurance: [
      { id: "verify", title: "Validate the tenant boundary", description: "Test roles, trust policies and derived keys before restoration.", disruption: "Moderate", confidence: "Strong", residual: "Low", impact: -8, continuity: -4, score: 13 },
      { id: "preserve", title: "Preserve control-plane evidence", description: "Retain audit history and key material before roles change.", disruption: "Moderate", confidence: "Strong", residual: "Moderate", impact: -5, continuity: -5, score: 12 },
      { id: "accelerate", title: "Accept operational assurance", description: "Use provider checks to shorten the automation interruption.", disruption: "Low", confidence: "Developing", residual: "High", impact: 2, continuity: 5, score: 8 },
    ],
    recovery: [
      { id: "rebuild", title: "Rebuild the workload from a trusted image", description: "Highest assurance, with the longest automation gap.", disruption: "High", confidence: "Strong", residual: "Low", impact: -18, continuity: -13, score: 14 },
      { id: "restore", title: "Restore validated workload snapshots", description: "Returns automation faster if snapshot integrity is understood.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -12, continuity: 2, score: 11 },
      { id: "patch", title: "Patch roles in place and monitor", description: "Protects workload availability and retains more uncertainty.", disruption: "Low", confidence: "Limited", residual: "High", impact: -6, continuity: 8, score: 7 },
    ],
  },
  {
    constraint: "Shared-service confidence: unverified trust propagates to dependent organisations, so scope and notification shape the outcome.",
    containment: [
      { id: "isolate", title: "Isolate the shared gateway", description: "Severs the single trust entry point and affects every connected organisation.", disruption: "High", confidence: "Strong", residual: "Low", impact: -22, continuity: -17, score: 12 },
      { id: "credential", title: "Revoke shared support identities", description: "Constrains the shared trust path while connected services keep operating.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -17, continuity: -5, score: 12 },
      { id: "monitor", title: "Monitor the shared path", description: "Preserves dependent services while the shared trust stays unverified.", disruption: "Low", confidence: "Developing", residual: "High", impact: 6, continuity: 5, score: 9 },
    ],
    assurance: [
      { id: "verify", title: "Validate the shared boundary", description: "Prove the trust service and federation routes before restoration.", disruption: "Moderate", confidence: "Strong", residual: "Low", impact: -9, continuity: -4, score: 14 },
      { id: "preserve", title: "Preserve shared-service evidence", description: "Retain federation and identity artefacts before change.", disruption: "Moderate", confidence: "Strong", residual: "Moderate", impact: -5, continuity: -5, score: 12 },
      { id: "accelerate", title: "Accept operational assurance", description: "Shorten the coordination pause using partner-visible checks.", disruption: "Low", confidence: "Developing", residual: "High", impact: 2, continuity: 5, score: 8 },
    ],
    recovery: [
      { id: "rebuild", title: "Rebuild the shared platform from baseline", description: "Strongest assurance, with the longest coordination pause for partners.", disruption: "High", confidence: "Strong", residual: "Low", impact: -18, continuity: -12, score: 14 },
      { id: "restore", title: "Restore validated shared backups", description: "Returns dependent organisations faster if integrity is understood.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -12, continuity: 2, score: 11 },
      { id: "patch", title: "Patch in place and monitor", description: "Protects partner service and retains uncertainty.", disruption: "Low", confidence: "Limited", residual: "High", impact: -6, continuity: 8, score: 7 },
    ],
  },
  {
    constraint: "Public transaction capacity: public demand constrains disruptive containment, and a communications lead protects capacity.",
    containment: [
      { id: "isolate", title: "Isolate the administrative trust path", description: "Cuts privileged access and interrupts in-flight citizen transactions.", disruption: "High", confidence: "Strong", residual: "Low", impact: -23, continuity: -18, score: 12 },
      { id: "credential", title: "Revoke administrative identities", description: "Constrains the privileged path while public transactions continue.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -17, continuity: -6, score: 12 },
      { id: "monitor", title: "Monitor the public service", description: "Preserves the transaction window while administrative risk persists.", disruption: "Low", confidence: "Developing", residual: "High", impact: 6, continuity: 7, score: 10 },
    ],
    assurance: [
      { id: "verify", title: "Validate the public-service boundary", description: "Prove administrative routes and agency dependencies before restoration.", disruption: "Moderate", confidence: "Strong", residual: "Low", impact: -8, continuity: -4, score: 13 },
      { id: "preserve", title: "Preserve administrative evidence", description: "Retain identity and application artefacts before change.", disruption: "Moderate", confidence: "Strong", residual: "Moderate", impact: -5, continuity: -5, score: 12 },
      { id: "accelerate", title: "Accept operational assurance", description: "Shorten the administrative freeze using current service checks.", disruption: "Low", confidence: "Developing", residual: "High", impact: 3, continuity: 6, score: 8 },
    ],
    recovery: [
      { id: "rebuild", title: "Rebuild the public service from baseline", description: "Highest assurance, with the longest administrative pause.", disruption: "High", confidence: "Strong", residual: "Low", impact: -18, continuity: -14, score: 14 },
      { id: "restore", title: "Restore validated service backups", description: "Returns citizen transactions faster if integrity is sound.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -12, continuity: 3, score: 12 },
      { id: "patch", title: "Patch in place and monitor", description: "Protects public capacity and retains more uncertainty.", disruption: "Low", confidence: "Limited", residual: "High", impact: -6, continuity: 8, score: 7 },
    ],
  },
  {
    constraint: "Core network stability: the core decays fastest of all sectors, and containment must avoid unnecessary loss of connectivity.",
    containment: [
      { id: "isolate", title: "Isolate the management core", description: "Removes the management path and risks national connectivity.", disruption: "High", confidence: "Strong", residual: "Low", impact: -24, continuity: -19, score: 12 },
      { id: "credential", title: "Revoke management identities", description: "Constrains the management plane while subscriber traffic continues.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -17, continuity: -5, score: 12 },
      { id: "monitor", title: "Monitor the management plane", description: "Preserves connectivity while the actor keeps management access.", disruption: "Low", confidence: "Developing", residual: "High", impact: 6, continuity: 7, score: 10 },
    ],
    assurance: [
      { id: "verify", title: "Validate the core boundary", description: "Test routing control and management routes before restoration.", disruption: "Moderate", confidence: "Strong", residual: "Low", impact: -9, continuity: -3, score: 14 },
      { id: "preserve", title: "Preserve core evidence", description: "Retain routing and management artefacts before change.", disruption: "Moderate", confidence: "Strong", residual: "Moderate", impact: -6, continuity: -4, score: 12 },
      { id: "accelerate", title: "Accept operational assurance", description: "Shorten the change freeze using network health checks.", disruption: "Low", confidence: "Developing", residual: "High", impact: 3, continuity: 6, score: 8 },
    ],
    recovery: [
      { id: "rebuild", title: "Rebuild the management core from baseline", description: "Strongest assurance, with the longest restriction of management change.", disruption: "High", confidence: "Strong", residual: "Low", impact: -20, continuity: -14, score: 14 },
      { id: "restore", title: "Restore validated core configuration", description: "Returns routing control faster if integrity is understood.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -13, continuity: 2, score: 11 },
      { id: "patch", title: "Patch in place and monitor", description: "Protects connectivity and retains uncertainty.", disruption: "Low", confidence: "Limited", residual: "High", impact: -6, continuity: 8, score: 8 },
    ],
  },
  {
    constraint: "Process safety margin: the margin resists delay, but unapproved scope and any isolation erode it sharply.",
    containment: [
      { id: "isolate", title: "Isolate the engineering support zone", description: "Removes support access and moves one process area to manual supervision.", disruption: "High", confidence: "Strong", residual: "Low", impact: -21, continuity: -15, score: 12 },
      { id: "credential", title: "Revoke engineering and vendor identities", description: "Constrains support access while operations continue under normal control.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -16, continuity: -6, score: 12 },
      { id: "monitor", title: "Monitor the support environment", description: "Preserves the operating envelope while engineering trust stays uncertain.", disruption: "Low", confidence: "Developing", residual: "High", impact: 4, continuity: 6, score: 9 },
    ],
    assurance: [
      { id: "verify", title: "Validate the support boundary", description: "Test vendor routes and engineering dependencies before restoration.", disruption: "Moderate", confidence: "Strong", residual: "Low", impact: -8, continuity: -4, score: 13 },
      { id: "preserve", title: "Preserve historian evidence", description: "Retain historian and configuration artefacts before change.", disruption: "Moderate", confidence: "Strong", residual: "Moderate", impact: -5, continuity: -5, score: 12 },
      { id: "accelerate", title: "Accept operational assurance", description: "Shorten the manual period using current process checks.", disruption: "Low", confidence: "Developing", residual: "High", impact: 2, continuity: 5, score: 8 },
    ],
    recovery: [
      { id: "rebuild", title: "Rebuild the support environment from baseline", description: "Strongest assurance, with the longest manual-supervision period.", disruption: "High", confidence: "Strong", residual: "Low", impact: -17, continuity: -13, score: 14 },
      { id: "restore", title: "Restore validated support backups", description: "Returns engineering support faster if integrity is understood.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -11, continuity: 2, score: 11 },
      { id: "patch", title: "Patch in place and monitor", description: "Protects the process safety margin and retains uncertainty.", disruption: "Low", confidence: "Limited", residual: "High", impact: -5, continuity: 7, score: 8 },
    ],
  },
  {
    constraint: "Clearing-window integrity: integrity erodes with delay and failure, and every decision must be defensible before settlement.",
    containment: [
      { id: "isolate", title: "Isolate the clearing service", description: "Cuts the approval path and suspends in-flight settlement.", disruption: "High", confidence: "Strong", residual: "Low", impact: -24, continuity: -16, score: 13 },
      { id: "credential", title: "Revoke approval and settlement identities", description: "Constrains the approval plane while settlement continues under review.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -18, continuity: -5, score: 12 },
      { id: "monitor", title: "Monitor the approval plane", description: "Preserves the settlement window while approval integrity is unverified.", disruption: "Low", confidence: "Developing", residual: "High", impact: 6, continuity: 6, score: 9 },
    ],
    assurance: [
      { id: "verify", title: "Validate the clearing boundary", description: "Test approvals, roles and settlement dependencies before restoration.", disruption: "Moderate", confidence: "Strong", residual: "Low", impact: -9, continuity: -4, score: 14 },
      { id: "preserve", title: "Preserve settlement evidence", description: "Retain transaction and approval artefacts before change.", disruption: "Moderate", confidence: "Strong", residual: "Moderate", impact: -5, continuity: -5, score: 12 },
      { id: "accelerate", title: "Accept operational assurance", description: "Shorten the review using current clearing checks.", disruption: "Low", confidence: "Developing", residual: "High", impact: 3, continuity: 5, score: 8 },
    ],
    recovery: [
      { id: "rebuild", title: "Rebuild the clearing service from baseline", description: "Highest assurance, with the longest settlement delay.", disruption: "High", confidence: "Strong", residual: "Low", impact: -19, continuity: -14, score: 14 },
      { id: "restore", title: "Restore validated settlement backups", description: "Returns clearing faster if backup integrity is understood.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -12, continuity: 2, score: 11 },
      { id: "patch", title: "Patch in place and monitor", description: "Meets the deadline and retains more uncertainty.", disruption: "Low", confidence: "Limited", residual: "High", impact: -5, continuity: 8, score: 8 },
    ],
  },
];

// Kept for compatibility: the first incident's authored set. Prefer responseOptionsFor.
export const responseOptions: Record<ResponsePhase, ResponseOption[]> = { containment: responseProfiles[0].containment, assurance: responseProfiles[0].assurance, recovery: responseProfiles[0].recovery };

export function responseOptionsFor(game: Game): ResponseProfile {
  return responseProfiles[game.scenario] ?? responseProfiles[0];
}

type DecisionLanguage = {
  observeTitle: string; observe: string;
  actTitle: string; act: string;
  attributeTitle: string; attribute: string;
  containTitle: string; contain: string;
  notifyTitle: string; notify: string;
  observeCost: number; actRelief: number; continuityCost: number; containRelief: number; containCost: number;
};

const decisionLanguage: DecisionLanguage[] = [
  {
    observeTitle: "Trace the access path", observe: "Keep the suspected route active long enough to correlate its origin.",
    actTitle: "Revoke the access path", act: "Terminate the observed access and invalidate related sessions.",
    attributeTitle: "Attribute the access pattern", attribute: "Correlate the access with prior behaviour and artefacts before changing anything.",
    containTitle: "Contain the access path", contain: "Restrict the observed path to a bounded trust scope and hold it there.",
    notifyTitle: "Notify command and service owners", notify: "Brief leadership and service owners on confirmed facts before the next action.",
    observeCost: 7, actRelief: -13, continuityCost: -4, containRelief: -10, containCost: -3,
  },
  {
    observeTitle: "Map lateral access", observe: "Watch the movement briefly to identify reached systems and identities.",
    actTitle: "Segment the movement path", act: "Block the observed administrative route before scope is complete.",
    attributeTitle: "Attribute the movement", attribute: "Map the identities and systems touched, and compare them with the actor's established behaviour.",
    containTitle: "Contain the movement path", contain: "Segment the observed route at the nearest trust boundary while the estate stays live.",
    notifyTitle: "Notify the reached service owners", notify: "Tell the owners of the reached systems what is confirmed and what remains uncertain.",
    observeCost: 9, actRelief: -15, continuityCost: -7, containRelief: -11, containCost: -5,
  },
  {
    observeTitle: "Capture the persistence mechanism", observe: "Preserve volatile and configuration evidence before removal.",
    actTitle: "Remove the foothold", act: "Disable the confirmed mechanism and accept reduced visibility.",
    attributeTitle: "Attribute the persistence mechanism", attribute: "Identify the mechanism, its authoring pattern and any related access before removal.",
    containTitle: "Contain the foothold", contain: "Disable the observed mechanism on a bounded system set while service continues.",
    notifyTitle: "Notify platform owners", notify: "Brief platform owners on the confirmed mechanism and the change window it needs.",
    observeCost: 8, actRelief: -14, continuityCost: -5, containRelief: -10, containCost: -4,
  },
  {
    observeTitle: "Trace the outbound channel", observe: "Collect destination and transfer evidence before blocking it.",
    actTitle: "Block the channel now", act: "Stop the confirmed connection before attribution and scope are complete.",
    attributeTitle: "Attribute the outbound channel", attribute: "Correlate destination, timing and volume to characterise the channel before blocking it.",
    containTitle: "Contain the channel", contain: "Throttle and restrict the observed channel at the boundary rather than severing all egress.",
    notifyTitle: "Notify data and compliance owners", notify: "Inform data owners and compliance of the confirmed export path and its uncertainty.",
    observeCost: 10, actRelief: -18, continuityCost: -3, containRelief: -12, containCost: -3,
  },
];

export const decisionChoices: DecisionChoice[] = ["observe", "act", "attribute", "contain", "notify"];

const decisionTitles: Record<DecisionChoice, keyof DecisionLanguage> = { observe: "observeTitle", act: "actTitle", attribute: "attributeTitle", contain: "containTitle", notify: "notifyTitle" };
const decisionText: Record<DecisionChoice, keyof DecisionLanguage> = { observe: "observe", act: "act", attribute: "attribute", contain: "contain", notify: "notify" };

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

export type GuidanceLevel = "off" | "reflection" | "training";

// Guidance is deliberately scoped. Expert mode never receives it, guided
// reflection offers strategic prompts without the answer, and only the training
// path exposes the next evidence source. Normal play is unguided, so the engine
// no longer pre-solves the puzzle for the player.
export function guidanceLevel(game: Game, guided: boolean): GuidanceLevel {
  if (game.mode === "expert" || !guided) return "off";
  return game.difficulty === "training" ? "training" : "reflection";
}

export function getCoachPrompt(game: Game, guided = false) {
  if (guidanceLevel(game, guided) === "off") return "Compare evidence value, attacker opportunity and service consequence before deciding.";
  if (!game.hypothesis) return "Record a working hypothesis before acting. It can be changed when the evidence no longer fits.";
  if (game.pendingDecision) return "Compare evidence value, attacker opportunity and service consequence before intervening.";
  if (game.impact >= 70) return "Pressure is critical. Test the hypothesis whose failure would create the greatest consequence.";
  if (game.turns.some(turn => turn.success && !turn.revealed)) return "A successful check did not support the chain. Revise the hypothesis or select a source that can distinguish alternatives.";
  return "Use confirmed facts to predict the attacker’s next requirement, not merely the next available tool.";
}

/**
 * The solver behind the balance simulations. It resolves the next hidden stage and
 * returns the evidence source that would expose it. It is not a player-facing
 * helper; call getSuggestion for anything that reaches the player.
 */
export function nextEvidenceSource(game: Game) {
  const hidden = game.chain.filter(id => !game.revealed.includes(id)).map(id => attacks.find(attack => attack.id === id)!);
  for (const attack of hidden) {
    const candidates = attack.detect.filter(id => !availableIn(game, id));
    candidates.sort((a, b) => Number(game.established.includes(b)) - Number(game.established.includes(a)));
    if (candidates.length) return procedures.find(procedure => procedure.id === candidates[0]);
  }
  return procedures.find(procedure => !availableIn(game, procedure.id));
}

// The interface uses the field's own vocabulary, which is right for the subject
// and wrong for a first-time player reading it cold. Every term here is one a
// playtest reported needing translated.
export const plainLanguage: Record<string, string> = {
  "privileged tier": "Accounts with powerful administrative access — the ones that can change anything.",
  "trust boundary": "The line between two systems that are allowed to rely on each other. Crossing it is how an intruder spreads.",
  "actor tempo": "How quickly the intruder is moving. It rises when you give them time and falls when you press them.",
  "bounded containment": "Shutting down one specific path rather than the whole service, so less of the business stops.",
  "assurance gate": "The step between stopping the attack and restoring service, where you check the environment is actually clean.",
  "residual risk": "What is still uncertain after you act — the part of the problem the chosen option does not settle.",
  "causal sequence": "One finding plausibly caused or enabled the other, rather than the two merely happening around the same time.",
  "exfiltration": "Data being taken out of the organisation.",
  "persistence": "A foothold the intruder can return through after a reboot or a password change.",
  "lateral movement": "Moving from the first system compromised to other systems inside the network.",
  "attribution": "Working out who is behind the activity, from how they behave rather than from a name.",
  "continuity": "Whether the essential service is still running for the people who depend on it.",
};

export type BeginnerReview = { strength: string; gap: string; concept: string; next: string };

// The full review is written for someone who already knows the trade. A first
// operation needs four sentences before any of it: one thing that went well, one
// that did not, the idea behind it, and one concrete change to try.
export function getBeginnerReview(game: Game): BeginnerReview {
  const breakdown = getScoreBreakdown(game);
  const tested = game.turns.filter(turn => turn.hypothesis && turn.hypothesisTarget);
  const aligned = tested.filter(turn => turn.hypothesisMatched).length;
  const emptySuccesses = game.turns.filter(turn => turn.success && !turn.revealed).length;
  const revisions = game.hypothesisHistory.reduce((count, item, index, history) => count + (index > 0 && history[index - 1].id !== item.id ? 1 : 0), 0);

  const strength = game.revealed.length === 4
    ? `You confirmed the whole attack chain — all four stages — in ${game.turns.length} turns.`
    : game.impact <= 40
      ? `You kept business impact down to ${game.impact} while the picture was still forming, which buys the team room to work.`
      : `You confirmed ${game.revealed.length} of 4 stages under real pressure, and the record you built is where the next shift starts.`;

  if (!game.correlations.length && game.evidence.length >= 2) return {
    strength,
    gap: `You collected ${game.evidence.length} findings but never tested how any two of them relate.`,
    concept: "Two things happening close together is not the same as one causing the other. Saying which it is — and being willing to be wrong — is the core of the work.",
    next: "Next operation, once you hold two findings, select them in the evidence workspace and decide whether one plausibly enabled the other before you run another procedure.",
  };
  if (tested.length && aligned * 2 < tested.length) return {
    strength,
    gap: `Your working hypothesis matched the route actually under test on ${aligned} of ${tested.length} turns${revisions === 0 ? ", and you never revised it" : ""}.`,
    concept: "A hypothesis is a prediction you are trying to break, not a label to keep. When the evidence sources it predicts come back empty, that is the evidence telling you to change it.",
    next: "Next operation, watch the reading's standing on the hypothesis board. When it says weakening, change the reading before you spend another turn.",
  };
  if (emptySuccesses >= 3) return {
    strength,
    gap: `${emptySuccesses} of your successful checks produced no new stage.`,
    concept: "A check that succeeds but finds nothing has still cost a turn. Choosing where to look matters more than how hard you look.",
    next: "Next operation, prefer a source your current reading actually predicts — the card says so before you commit — over whichever tool is available.",
  };
  if (breakdown.response < 12) return {
    strength,
    gap: "The response cost more service than it needed to for the assurance it bought.",
    concept: "Containment, assurance and recovery each trade disruption against certainty. The most thorough option is not automatically the right one.",
    next: "Next operation, read what each response option leaves as residual risk, and pick the cheapest one that closes the risk you actually confirmed.",
  };
  return {
    strength,
    gap: "Nothing stands out as a misunderstanding in this operation.",
    concept: "The habit to keep is the one you just used: predict, test with a source that can settle it, then revise when it cannot.",
    next: "Next operation, try a harder difficulty or a sector you have not commanded, and see whether the same reasoning holds when the pressure is different.",
  };
}

export type TrainingPrompt = {
  step: "declare" | "revise" | "correlate" | "test" | "decide";
  title: string;
  detail: string;
  sources: { id: string; title: string }[];
  clue: string | null;
};

/**
 * The player-facing training aid. It used to hand back nextEvidenceSource — the
 * solver's answer — which walked the player to every stage while the rest of the
 * interface told them the same action tested nothing. Following it produced a
 * complete attack chain and a hypothesis score of three out of ten.
 *
 * It now prompts the next step in the reasoning instead: declare a reading, test
 * it with one of its own sources, revise it when its own sources come back empty,
 * and correlate the findings once there are two to compare. Every branch reads
 * only what the player has declared or observed, so the aid can no longer
 * contradict the discriminating read, and no player-facing helper returns the
 * solver's answer at any difficulty.
 */
export function getTrainingPrompt(game: Game, guided = false): TrainingPrompt | null {
  if (guidanceLevel(game, guided) !== "training") return null;
  const hypothesis = hypotheses.find(item => item.id === game.hypothesis);
  // The one thing Training discloses that the player could not derive: the
  // observable pointing at the next unconfirmed stage. Every technique carries a
  // clue describing what was noticed, and without it the opening hypothesis is a
  // coin flip between four routes, which teaches nothing. It names what was seen,
  // never the technique behind it and never the source that would expose it.
  const hidden = game.chain.find(id => !game.revealed.includes(id));
  const clue = hidden ? attacks.find(item => item.id === hidden)!.clue : null;
  if (!hypothesis) return {
    step: "declare",
    title: "Start with an explanation",
    detail: "Record the intrusion route you think is in play. You can change it whenever the evidence stops fitting.",
    sources: [],
    clue,
  };
  if (game.pendingDecision) return {
    step: "decide",
    title: "Weigh the decision, not the tool",
    detail: "Compare what each response buys you against what it costs the service and the evidence. There is no option here that is right in every incident.",
    sources: [],
    clue: null,
  };
  const open = hypothesis.procedures.filter(id => !availableIn(game, id)).map(id => ({ id, title: procedures.find(procedure => procedure.id === id)!.title }));
  const standing = getHypothesisStanding(game);
  if (standing.level === "weakening" || standing.level === "unsupported") return {
    step: "revise",
    title: "Your reading is running out of support",
    detail: `${standing.detail} Read the current observation again and pick the explanation that accounts for it, then test that one.`,
    sources: [],
    clue,
  };
  if (game.evidence.length >= 2 && !game.correlations.length) return {
    step: "correlate",
    title: "Two findings can be compared",
    detail: "Select two findings in the evidence workspace and decide whether one plausibly enabled the other, or whether they only overlap in time. Testing that judgement is part of the work.",
    sources: [],
    clue: null,
  };
  return {
    step: "test",
    title: `Test ${hypothesis.title.toLowerCase()}`,
    detail: open.length
      ? "These are the evidence sources this reading predicts. A result in one of them moves the question; a source it does not predict only collects."
      : "Every source this reading predicts is cooling down. Collect elsewhere this turn, or record a different reading and test that.",
    sources: open,
    clue: standing.level === "untested" ? clue : null,
  };
}

export function getDecisionOptions(game: Game) {
  if (!game.pendingDecision) return null;
  const attack = attacks.find(item => item.id === game.pendingDecision)!;
  const language = decisionLanguage[attack.stage];
  const service: Record<DecisionChoice, string> = {
    observe: "No immediate disruption",
    act: language.continuityCost <= -7 ? "Significant service risk" : "Limited service risk",
    attribute: "Analyst time only",
    contain: "Bounded service impact",
    notify: "Service owners prepared",
  };
  const evidence: Record<DecisionChoice, string> = {
    observe: "Evidence confidence improves",
    act: "Some telemetry will be lost",
    attribute: "Attribution depth improves",
    contain: "Local telemetry preserved",
    notify: "No new evidence",
  };
  const risk: Record<DecisionChoice, string> = {
    observe: "Attacker opportunity increases",
    act: "Immediate exposure falls",
    attribute: "The actor keeps moving",
    contain: "Parallel access paths remain",
    notify: "Your read is disclosed",
  };
  const options: DecisionOption[] = decisionChoices.map(id => ({
    id,
    title: language[decisionTitles[id]] as string,
    description: language[decisionText[id]] as string,
    service: service[id],
    evidence: evidence[id],
    risk: risk[id],
  }));
  const find = (id: DecisionChoice) => options.find(option => option.id === id)!;
  return { attack, options, observe: find("observe"), act: find("act") };
}

export type ModifierPart = { label: string; value: number; detail: string; suppressed?: boolean };

// A bare signed number leaves a new player guessing which way is good: impact
// rising is bad, continuity and sector confidence rising are good. Every meter
// delta the interface shows says which.
const meterDirection: Record<string, { label: string; risesIsGood: boolean }> = {
  impact: { label: "Impact", risesIsGood: false },
  continuity: { label: "Continuity", risesIsGood: true },
  sector: { label: "Sector confidence", risesIsGood: true },
  objective: { label: "Actor progress", risesIsGood: false },
  tempo: { label: "Actor tempo", risesIsGood: false },
};

export function describeChange(meter: keyof typeof meterDirection | string, value: number) {
  const direction = meterDirection[meter];
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const amount = `${sign}${Math.abs(value)}`;
  if (!direction) return `${meter} ${amount}`;
  if (value === 0) return `${direction.label} unchanged`;
  const good = value > 0 ? direction.risesIsGood : !direction.risesIsGood;
  return `${direction.label} ${amount} ${good ? "better" : "worse"}`;
}

// Every part of the roll the player is entitled to know before committing. The
// planning bonus is deliberately absent: it depends on whether the hypothesis
// matches the next hidden stage, so showing it here would let a player read the
// answer off the interface by cycling hypotheses. playTurn adds it on resolution
// and the after-action ledger explains it afterwards.
export function getModifierBreakdown(game: Game, procedure: string, plan: ProcedurePlan = { scope: "focused", intensity: "balanced" }) {
  const specialist = specialists[game.specialist];
  const focusNode = infrastructureTopologies[game.scenario].nodes.find(node => node.id === game.focusedNode);
  const parts: ModifierPart[] = [
    { label: "Established", value: game.established.includes(procedure) ? 2 : 0, detail: "This evidence source is already established for the team." },
    { label: "Carried", value: game.nextModifier, detail: "Carried from the previous turn's event or decision." },
    specialist.procedures.includes(procedure as never) && game.specialistFatigue >= 5
      ? { label: "Specialist", value: 0, suppressed: true, detail: `${specialist.title} works this source, but at fatigue ${game.specialistFatigue} of 6 the bonus no longer applies. Rest comes from finishing the operation.` }
      : { label: "Specialist", value: specialist.procedures.includes(procedure as never) ? 1 : 0, detail: `${specialist.title} works this source directly and is not fatigued.` },
    { label: "Focus", value: focusNode?.procedures.includes(procedure) ? 1 : 0, detail: `The focused node covers this source${focusNode ? `: ${focusNode.label}.` : "."}` },
    { label: procedureScopes[plan.scope].title, value: procedureScopes[plan.scope].modifier, detail: procedureScopes[plan.scope].description },
    { label: procedureIntensities[plan.intensity].title, value: procedureIntensities[plan.intensity].modifier, detail: procedureIntensities[plan.intensity].description },
    { label: "Expert mode", value: game.mode === "expert" ? -1 : 0, detail: "Expert operations resolve every procedure one harder." },
  ];
  return { parts, total: parts.reduce((sum, part) => sum + part.value, 0) };
}

export type HypothesisStanding = {
  level: "none" | "untested" | "holding" | "weakening" | "unsupported";
  label: string;
  detail: string;
  spent: number;
  sources: number;
  inconclusive: number;
  turnsSinceConfirmation: number;
};

// Repeated negative results against the same explanation are themselves
// evidence. This reads only the player's own record — which of the declared
// hypothesis's evidence sources have been spent since the last confirmation,
// and what came back — so it never consults the hidden chain. It says the
// current reading is weakening; it never says which reading is right.
export function getHypothesisStanding(game: Game): HypothesisStanding {
  const hypothesis = hypotheses.find(item => item.id === game.hypothesis);
  if (!hypothesis) return { level: "none", label: "No working hypothesis", detail: "Record the explanation you are testing. Until you do, a procedure collects but settles nothing.", spent: 0, sources: 0, inconclusive: 0, turnsSinceConfirmation: 0 };
  const lastConfirmation = game.turns.reduce((last, turn) => turn.revealed || turn.injectReveal ? turn.number : last, 0);
  const since = game.turns.filter(turn => turn.number > lastConfirmation);
  const own = since.filter(turn => turn.hypothesis === hypothesis.id && hypothesis.procedures.includes(turn.procedure));
  const checked = new Set(own.filter(turn => turn.success && !turn.revealed).map(turn => turn.procedure));
  const inconclusive = new Set(own.filter(turn => !turn.success).map(turn => turn.procedure).filter(id => !checked.has(id))).size;
  const spent = checked.size;
  const sources = hypothesis.procedures.length;
  const common = { spent, sources, inconclusive, turnsSinceConfirmation: since.length };
  const unresolved = inconclusive ? ` ${inconclusive} further attempt${inconclusive === 1 ? "" : "s"} failed outright, which settles nothing either way.` : "";
  const ledger = `${spent} of this reading's ${sources} evidence source${sources === 1 ? "" : "s"} ${spent === 1 ? "has" : "have"} been checked since the last confirmation and came back empty`;
  if (spent === 0) return { level: "untested", label: "Untested", detail: `${hypothesis.title} has not yet been confirmed or ruled out by one of its own evidence sources since the last confirmation.${unresolved}`, ...common };
  if (spent * 2 < sources) return { level: "holding", label: "Holding", detail: `${ledger}. Too early to abandon the reading.${unresolved}`, ...common };
  if (spent < sources) return { level: "weakening", label: "Weakening", detail: `${ledger}. Absence across its own sources is evidence against this reading, not just bad luck.${unresolved}`, ...common };
  return { level: "unsupported", label: "Poorly supported", detail: `Every one of this reading's evidence sources has now been checked since the last confirmation and none produced a stage. On the evidence you hold, another explanation fits better.${unresolved}`, ...common };
}

export type DiscriminatingRead = { level: "high" | "moderate" | "broad"; label: string; detail: string; spent: number; inconclusive: number };

// A read built only from what the player can already see: their own declared
// hypothesis, that hypothesis's own evidence sources, and how often they have
// already spent this source without it producing a stage. It never consults the
// hidden chain, so it narrows the search without answering it.
export function getDiscriminatingRead(game: Game, procedure: string): DiscriminatingRead {
  const hypothesis = hypotheses.find(item => item.id === game.hypothesis);
  // A completed check that found nothing is a result. A failed roll is not: it
  // tells the player nothing about the source, and must not read as though it did.
  const attempts = game.turns.filter(turn => turn.procedure === procedure);
  const spent = attempts.filter(turn => turn.success && !turn.revealed).length;
  const inconclusive = attempts.filter(turn => !turn.success).length;
  const spentNote = [
    spent ? ` Checked ${spent} time${spent === 1 ? "" : "s"} here with no stage found.` : "",
    inconclusive ? ` ${inconclusive} earlier attempt${inconclusive === 1 ? "" : "s"} failed before producing a result, which settles nothing.` : "",
  ].join("");
  if (!hypothesis) return { level: "broad", label: "Broad collection", detail: `No working hypothesis is recorded, so this action collects without testing an explanation.${spentNote}`, spent, inconclusive };
  if (hypothesis.procedures.includes(procedure)) return { level: "high", label: "Tests your hypothesis", detail: `${hypothesis.title} predicts evidence in this source. A result here supports or weakens that reading directly.${spentNote}`, spent, inconclusive };
  return { level: "moderate", label: "Collects, does not test", detail: `${hypothesis.title} does not predict evidence in this source. It may still find something, but it will not settle the current question.${spentNote}`, spent, inconclusive };
}

const terminal = (status: GameStatus) => status === "won" || status === "lost" || status === "exercise";

// A terminated operation holds no blocking state. Every end-state check routes
// through here, so the interface can never be left asking for a decision the
// engine would refuse.
function settle(g: Game, status: GameStatus): Game {
  g.status = status;
  if (terminal(status)) {
    g.pendingDecision = null;
    g.pendingCommand = null;
    g.pendingSetPiece = null;
  }
  return g;
}

// Why the operation ended, in its own terms. The investigation window is only
// one of five ways to lose and was previously named for all of them.
export function getLossReason(game: Game): { title: string; detail: string } {
  if (game.objectiveProgress >= 100) return { title: "The adversary completed its objective", detail: `${adversaryObjectives[game.objective].title} reached 100 before the response closed the route.` };
  if (game.impact >= 100) return { title: "Business impact reached its limit", detail: "Exposure grew faster than the investigation could reduce it." };
  if (game.continuity <= 0) return { title: "The essential service stopped", detail: `${scenarioDynamics[game.scenario].label} fell to zero and the operation was taken out of the response team's hands.` };
  if (game.sectorHealth <= 0) return { title: "Sector confidence collapsed", detail: `${sectorSystems[game.scenario].title} fell to zero while the chain was still open.` };
  return { title: "The investigation window closed", detail: `${game.revealed.length} of 4 stages were confirmed in ${game.turns.length} turn${game.turns.length === 1 ? "" : "s"}.` };
}

export function playTurn(game: Game, procedure: string, forcedRoll?: number, plan: ProcedurePlan = { scope: "focused", intensity: "balanced" }): Game {
  if (game.status !== "playing") throw new Error("This investigation has ended.");
  if (game.pendingDecision) throw new Error("Resolve the evidence decision first.");
  if (game.pendingCommand) throw new Error("Resolve the command event first.");
  if (game.pendingSetPiece) throw new Error("Resolve the sector decision first.");
  if (!procedures.some(item => item.id === procedure)) throw new Error("Unknown procedure.");
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
  const hypothesis = hypotheses.find(item => item.id === g.hypothesis);
  const hypothesisTarget = nextHidden ?? null;
  const hypothesisMatched = !!nextHidden && !!g.hypothesis && g.hypothesis === attackVector(nextHidden);
  // Whether this procedure was one of the sources that could have exposed the
  // stage under test, regardless of how the roll landed.
  const discriminating = !!nextHidden && attacks.find(item => item.id === nextHidden)!.detect.includes(procedure);
  const planningBonus = hypothesisMatched && hypothesis?.procedures.includes(procedure) ? 2 : 0;
  const specialist = specialists[g.specialist];
  const specialistBonus = specialist.procedures.includes(procedure as never) && g.specialistFatigue < 5 ? 1 : 0;
  const scope = procedureScopes[plan.scope];
  const intensity = procedureIntensities[plan.intensity];
  const focusNode = infrastructureTopologies[g.scenario].nodes.find(node => node.id === g.focusedNode)!;
  const modifier = getModifierBreakdown(g, procedure, plan).total + planningBonus;
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
    narrative = `${procedures.find(item => item.id === procedure)!.title} at ${focusNode.label} — ${attacks.find(attack => attack.id === match)!.evidence}`;
    g.adversaryTempo = Math.min(3, g.adversaryTempo + 1);
  } else if (success) {
    narrative = "The procedure completed, but the evidence does not support an undiscovered stage. The working hypothesis remains unconfirmed.";
    g.adversaryTempo = Math.min(3, g.adversaryTempo + 1);
  } else if (g.graceRemaining > 0) {
    // Rapid coordination absorbs the first unlucky action of the operation. The
    // team reorients on its own time rather than the adversary's.
    g.graceRemaining -= 1;
    narrative = "The action did not produce evidence, but the team reorients on its own time: coordination absorbed the setback before the actor could use it.";
  } else if (planningBonus > 0) {
    // A sound action that the dice refused. The route under test was the one
    // predicted and the source was one that hypothesis relies on, so the team
    // keeps its footing: the actor takes no tempo it did not earn, and its
    // objective barely moves. Reasoning is protected; certainty is not.
    narrative = "The action did not produce evidence this time, but the reasoning held: the route under test was the right one to ask about, and the team keeps its footing.";
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
    if (inject.effect === "end") {
      // Standing an operation down as an authorised exercise is a conclusion the
      // investigation reaches, not one it is handed. Below two confirmed stages
      // there is not enough attributed behaviour to support that call, so the
      // controller clears only part of the activity and the operation continues.
      if (g.revealed.length >= 2) exerciseEnd = true;
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
      const openStage = g.chain.findIndex(id => !g.revealed.includes(id));
      const adaptation = openStage >= 0 ? selectAdaptation(g, openStage, g.chain[openStage]) : null;
      if (adaptation) {
        g.chain[openStage] = adaptation.id;
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
  const sectorChange = Math.min(5, Math.max(-14, -(sector.baseLoss + g.adversaryTempo * sector.tempoWeight + (success ? 0 : sector.failureCost) + (identityLed ? sector.exposureBias : 0) + (number >= 4 ? sector.lateBias : 0)) + (revealed ? sector.revealRelief : 0) + (boundarySuccess ? sector.boundaryRelief : 0) + protection + scopeSector + sectorSpecific + (g.specialist === "communications" ? sector.commsRecovery : 0)));
  const objectiveChange = Math.max(1, 6 + g.adversaryTempo * 3 + (success ? 0 : planningBonus > 0 ? 1 : 4) - (revealed ? 6 : 0) + scope.objective + objectiveSpecific + (g.difficulty === "crisis" ? 2 : g.difficulty === "training" ? -2 : 0) + (plan.scope === "enterprise" ? sector.enterpriseObjective : 0));
  g.sectorHealth = clamp(g.sectorHealth + sectorChange);
  g.sectorHistory.push(g.sectorHealth);
  g.objectiveProgress = clamp(g.objectiveProgress + objectiveChange);
  if (g.specialist === "communications") impactChange -= 2;
  g.impact = clamp(g.impact + impactChange);
  g.continuity = clamp(g.continuity + continuityChange);
  g.turns.push({ number, procedure, raw, modifier, planningBonus, total, success, revealed, narrative, inject, injectReveal, impactChange, continuityChange, adversaryEvent, hypothesis: g.hypothesis, plan, specialistBonus, sectorChange, objectiveChange, hypothesisTarget, hypothesisMatched, discriminating });
  if (g.impact >= 100 || g.continuity <= 0 || g.sectorHealth <= 0 || g.objectiveProgress >= 100) settle(g, "lost");
  else if (exerciseEnd && g.revealed.length >= 2 && g.revealed.length < 4) settle(g, "exercise");
  else if (number >= g.turnLimit && g.revealed.length < 4) settle(g, "lost");
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

// Decision verbs trade off along five axes. Only act pressures the actor hard
// enough to force a route adaptation, while contain protects the sector that act
// would erode, notify protects continuity at the cost of tempo and disclosure,
// and attribute buys analytical depth without reducing exposure at all.
const decisionEffects: Record<DecisionChoice, string> = {
  observe: "Evidence improved while attacker opportunity increased.",
  act: "Immediate exposure reduced; service and telemetry were affected.",
  attribute: "Attribution depth improved before any change to the environment.",
  contain: "The observed path was restricted without eroding the sector's own margin.",
  notify: "Stakeholders were aligned on confirmed facts; the actor gained tempo.",
};

function decisionRationale(choice: DecisionChoice, highPressure: boolean, bindingSector: boolean, bindingContinuity: boolean) {
  switch (choice) {
    case "observe": return highPressure ? "Additional observation improved evidence but accepted substantial operational risk." : "Observation was proportionate while impact and adversary tempo remained manageable.";
    case "act": return highPressure ? "Intervention matched the elevated impact and adversary tempo." : "Intervention reduced exposure, although evidence collection still had room to continue.";
    case "attribute": return highPressure ? "Deep attribution delayed containment while the actor remained free to act." : "Attribution deepened the analytical picture while the actor stayed covert.";
    case "contain": return bindingSector ? "Bounded containment protected a sector margin that a full intervention would have eroded." : highPressure ? "Containment absorbed pressure without removing the actor's parallel access." : "Containment was proportionate, although a broader intervention was still available.";
    case "notify": return bindingContinuity ? "Early notification protected service continuity while the picture stayed uncertain." : highPressure ? "Notification kept owners aligned, but it cost tempo and disclosed your read." : "Notification was low-cost, but it did not reduce exposure or preserve evidence.";
  }
}

function decisionQuality(game: Game, choice: DecisionChoice, highPressure: boolean) {
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
  g.pendingDecision = null;
  if (g.impact >= 100 || g.continuity <= 0 || g.sectorHealth <= 0 || g.objectiveProgress >= 100) settle(g, "lost");
  else if (g.revealed.length === 4) g.status = "response";
  else if (g.turns.length === 2 && !g.setPieceHistory.length) g.pendingSetPiece = sectorSetPieces[g.scenario].id;
  return g;
}

function decisionCounterfactual(choice: DecisionChoice, language: DecisionLanguage) {
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
  if (g.impact >= 100 || g.continuity <= 0 || g.sectorHealth <= 0 || g.objectiveProgress >= 100) settle(g, "lost");
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
  if (g.impact >= 100 || g.continuity <= 0 || g.sectorHealth <= 0 || g.objectiveProgress >= 100) settle(g, "lost");
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
  const tested = game.turns.filter(turn => turn.hypothesis && turn.hypothesisTarget);
  const aligned = tested.filter(turn => turn.hypothesisMatched).length;
  const hypothesis = tested.length ? Math.round(aligned / tested.length * 10) : 0;
  return { investigation, impact, continuity, decisions, response, hypothesis, total: investigation + impact + continuity + decisions + response + hypothesis };
}

export function getOutcome(game: Game) {
  const breakdown = getScoreBreakdown(game);
  if (breakdown.total >= 82) return { grade: "A", title: "Controlled recovery", detail: "You balanced evidence, disruption and service continuity with strong operational judgement.", breakdown };
  if (breakdown.total >= 68) return { grade: "B", title: "Stable, with residual risk", detail: "The incident is contained, but the review identifies avoidable exposure or disruption.", breakdown };
  if (breakdown.total >= 52) return { grade: "C", title: "Costly stabilisation", detail: "Services are recovering, but uncertainty and operational cost remain high.", breakdown };
  return { grade: "D", title: "Fragile recovery", detail: "The immediate crisis passed, but the response left significant residual risk.", breakdown };
}

export type HypothesisLedgerRow = {
  turn: number;
  procedure: string;
  predicted: string | null;
  testedAgainst: string;
  discriminating: boolean;
  matched: boolean;
  bonus: number;
  verdict: string;
};

export function getHypothesisLedger(game: Game): HypothesisLedgerRow[] {
  return game.turns.map(turn => {
    const target = turn.hypothesisTarget;
    const stage = target ? stages[attacks.find(item => item.id === target)!.stage].name : "Every stage was already confirmed";
    const predicted = turn.hypothesis ? hypotheses.find(item => item.id === turn.hypothesis)!.title : null;
    const verdict = !target ? "No stage left to predict, so this turn could not score."
      : !turn.hypothesis ? "No working hypothesis was recorded, so this turn could not score."
      : turn.hypothesisMatched
        ? (turn.planningBonus > 0 ? "Correct, and the procedure was one of its evidence sources: full credit and the planning bonus."
          : "Correct about the route, but the procedure was not one of the hypothesis's evidence sources: credit without the planning bonus.")
        : "The route under test was not the one predicted, so this turn scored nothing.";
    return {
      turn: turn.number,
      procedure: procedures.find(item => item.id === turn.procedure)!.title,
      predicted,
      testedAgainst: stage,
      discriminating: turn.discriminating,
      matched: turn.hypothesisMatched,
      bonus: turn.planningBonus,
      verdict,
    };
  });
}

export function getCounterfactuals(game: Game) {
  const items = game.decisions.slice(-3).map(decision => `${decision.title}: ${decision.counterfactual} ${decision.rationale}`);
  const dynamics = scenarioDynamics[game.scenario];
  const responseProfile = responseOptionsFor(game);
  if (game.responseChoices.length) {
    const containment = responseProfile.containment.find(option => option.id === game.responseChoices[0]);
    items.push(`Containment: ${containment?.title} prioritised ${containment?.disruption.toLowerCase()} disruption and left ${containment?.residual.toLowerCase()} residual risk. ${dynamics.countermeasure}`);
  }
  if (game.responseChoices.length > 1) {
    const assurance = responseProfile.assurance.find(option => option.id === game.responseChoices[1]);
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
