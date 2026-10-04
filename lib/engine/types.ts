// The shape of an operation and everything recorded about it.
import { type Difficulty, type HypothesisId } from "../game.ts";
import { type AdversaryObjectiveId, type GameMode, type ProcedurePlan, type SpecialistId } from "../command-systems.ts";
import { type SetPieceId } from "../phase8.ts";
import { type CampaignRouteId, type IncidentVariant } from "../phase9.ts";
import type { adversaryProfiles, commandEvents, injects } from "./content.ts";

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

export type SetPieceChoice = "a" | "b" | "c";

export type SetPieceRecord = { event: SetPieceId; choice: SetPieceChoice; title: string; quality: number; effect: string };

export type MapAction = "monitor" | "isolate";

export type NodePosture = "normal" | "monitored" | "isolated" | "restored";

export type MapActionRecord = { node: string; action: MapAction; turn: number; effect: string };

export type Inject = typeof injects[number] & { reason: string };

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
  // Every part of the roll's modifier, named as the action sheet named it, so the
  // report can explain its total instead of lumping "other parts".
  parts: { label: string; value: number }[];
  sectorChange: number;
  objectiveChange: number;
  // What the working hypothesis was actually tested against on this turn. The
  // planning bonus, the score and the after-action ledger all read these, so the
  // number the player is given and the reason they are given it cannot drift.
  hypothesisTarget: string | null;
  hypothesisMatched: boolean;
  discriminating: boolean;
  // True when the turn exposed a stage other than the one it was testing: the
  // source is shared between routes and surfaced something further along. It is
  // a find, but not a prediction, and the score keys to the prediction.
  windfall: boolean;
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
  // What set nextModifier, named for the roll's breakdown; null when nothing waits.
  nextModifierSource: string | null;
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

export type ResponsePhase = "containment" | "assurance" | "recovery";

export type ResponseOption = { id: string; title: string; description: string; disruption: string; confidence: string; residual: string; impact: number; continuity: number; score: number };

export type ResponseProfile = { constraint: string; containment: ResponseOption[]; assurance: ResponseOption[]; recovery: ResponseOption[] };

export type KnownFacts = { timeline: string; observations: string[]; confirmed: string[]; unverified: string | null };

export type SectorRead = { headline: string; detail: string; diverged: boolean };

export type GuidanceLevel = "off" | "reflection" | "training";

export type BeginnerReview = { strength: string; gap: string; concept: string; next: string };

export type TrainingPrompt = {
  step: "declare" | "revise" | "theory" | "correlate" | "test" | "decide";
  title: string;
  detail: string;
  sources: { id: string; title: string }[];
  clue: string | null;
};

// `shown` keeps a named part on screen at zero: two carried sources that cancel
// still explain the total.
export type ModifierPart = { label: string; value: number; detail: string; suppressed?: boolean; shown?: boolean };

export type HypothesisStanding = {
  level: "none" | "untested" | "holding" | "weakening" | "unsupported";
  label: string;
  detail: string;
  // Of the techniques the declared route could be using at the stage under
  // test, how many completed checks have ruled out, and how many there are.
  spent: number;
  sources: number;
  inconclusive: number;
  turnsSinceConfirmation: number;
};

export type ReadingOdds = {
  stage: number | null;
  ruledOutBy: string[];
  candidates: Record<HypothesisId, { total: number; open: number }>;
  share: Record<HypothesisId, number>;
  prior: Record<HypothesisId, number>;
};

export type DiscriminatingRead = { level: "high" | "moderate" | "broad"; label: string; detail: string; spent: number; inconclusive: number };

// Why the operation ended, in its own terms. The investigation window is only
// one of five ways to lose and was previously named for all of them.
export type LossCause = "objective" | "impact" | "continuity" | "sector" | "window";

export type ScoreBreakdown = {
  investigation: number;
  impact: number;
  continuity: number;
  decisions: number;
  response: number;
  hypothesis: number;
  total: number;
};

export type HypothesisLedgerRow = {
  turn: number;
  procedure: string;
  predicted: string | null;
  testedAgainst: string;
  actualRoute: string | null;
  found: string | null;
  windfall: boolean;
  discriminating: boolean;
  matched: boolean;
  bonus: number;
  // 1 for the right route, 0.5 for a wrong one ruled out by its own source, else 0.
  credit: number;
  verdict: string;
};
