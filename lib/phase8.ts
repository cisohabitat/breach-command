import type { Difficulty } from "./game";
import type { GameMode, SpecialistId } from "./command-systems";

export type InfrastructureNode = { id: string; label: string; type: string; procedures: string[] };
export type InfrastructureEdge = { from: string; to: string; label: string };
export type InfrastructureTopology = { title: string; critical: string; nodes: InfrastructureNode[]; edges: InfrastructureEdge[] };

const common = {
  user: { id: "user", label: "User access", type: "IDENTITY", procedures: ["identity", "email"] },
  boundary: { id: "boundary", label: "Access boundary", type: "EDGE", procedures: ["firewall", "network", "dns"] },
  service: { id: "service", label: "Service platform", type: "APPLICATION", procedures: ["server", "cloud", "forensic"] },
  admin: { id: "admin", label: "Admin plane", type: "CONTROL", procedures: ["identity", "cloud", "hunt"] },
  data: { id: "data", label: "Protected data", type: "ASSET", procedures: ["network", "cloud", "intel"] },
};

function topology(title: string, labels: Partial<Record<keyof typeof common, string>>, critical: keyof typeof common): InfrastructureTopology {
  const nodes = (Object.keys(common) as (keyof typeof common)[]).map(key => ({ ...common[key], label: labels[key] ?? common[key].label }));
  return { title, critical, nodes, edges: [
    { from: "user", to: "boundary", label: "AUTHENTICATES" }, { from: "boundary", to: "service", label: "CONNECTS" },
    { from: "service", to: "admin", label: "TRUSTS" }, { from: "admin", to: "data", label: "CONTROLS" },
    { from: "service", to: "data", label: "READS" },
  ] };
}

export const infrastructureTopologies: InfrastructureTopology[] = [
  topology("Enterprise trust map", { user: "Staff identity", boundary: "Remote access", service: "Business apps", admin: "Privileged services", data: "Corporate records" }, "service"),
  topology("Clinical support map", { user: "Clinical user", boundary: "Support gateway", service: "Clinical apps", admin: "Hospital admin", data: "Patient records" }, "service"),
  topology("Generation support map", { user: "Supplier identity", boundary: "Maintenance gateway", service: "Support server", admin: "Engineering zone", data: "Plant configuration" }, "admin"),
  topology("Terminal dependency map", { user: "Partner identity", boundary: "Booking portal", service: "Terminal platform", admin: "Vessel planning", data: "Cargo schedules" }, "service"),
  topology("Cloud trust map", { user: "Workload identity", boundary: "Cloud API", service: "Tenant workload", admin: "Control plane", data: "Object storage" }, "admin"),
  topology("Shared-service map", { user: "Support identity", boundary: "Shared gateway", service: "Common platform", admin: "Trust service", data: "Partner records" }, "service"),
  topology("Public-service map", { user: "Citizen identity", boundary: "Digital gateway", service: "Public service", admin: "Agency control", data: "Transaction records" }, "service"),
  topology("Core network map", { user: "Operator identity", boundary: "Management edge", service: "Network core", admin: "Routing control", data: "Subscriber services" }, "service"),
  topology("Water support map", { user: "Engineer identity", boundary: "Remote support", service: "Operations server", admin: "Process supervision", data: "Control configuration" }, "admin"),
  topology("Clearing trust map", { user: "Approver identity", boundary: "Payment gateway", service: "Clearing service", admin: "Approval plane", data: "Settlement records" }, "service"),
];

export const namedSpecialists: Record<SpecialistId, { name: string; callsign: string; voice: string }> = {
  hunter: { name: "Maya Chen", callsign: "TRACE", voice: "I will test behaviour across the evidence boundary." },
  forensics: { name: "Elias Ward", callsign: "ARCHIVE", voice: "Preserve the sequence before the system changes again." },
  identity: { name: "Noor Rahman", callsign: "TRUST", voice: "A valid credential is not the same as a valid action." },
  ot: { name: "Daniel Koh", callsign: "RELAY", voice: "Keep cyber action inside the safe operating envelope." },
  continuity: { name: "Sofia Reyes", callsign: "ANCHOR", voice: "Protect the service while the team reduces uncertainty." },
  communications: { name: "Marcus Bell", callsign: "SIGNAL", voice: "I will keep decisions clear, factual and timely." },
};

export type SetPieceId = `sector-${number}`;
export type SetPieceOption = { title: string; detail: string; impact: number; continuity: number; sector: number; objective: number; quality: number };
export type SectorSetPiece = { id: SetPieceId; title: string; prompt: string; a: SetPieceOption; b: SetPieceOption };

export const sectorSetPieces: SectorSetPiece[] = [
  { id: "sector-0", title: "Privileged reset window", prompt: "Business owners can support one coordinated identity reset before payroll processing begins.", a: { title: "Reset the privileged tier", detail: "Reduce identity risk while accepting a short administrative freeze.", impact: -7, continuity: -3, sector: 5, objective: -6, quality: 5 }, b: { title: "Protect payroll availability", detail: "Delay the reset and monitor privileged sessions through processing.", impact: 4, continuity: 4, sector: -4, objective: 7, quality: 3 } },
  { id: "sector-1", title: "Clinical access decision", prompt: "The affected support path also serves a time-sensitive clinical workflow.", a: { title: "Move clinical work to downtime procedures", detail: "Create a safe isolation window at an immediate service cost.", impact: -6, continuity: -7, sector: 4, objective: -7, quality: 5 }, b: { title: "Keep the support path live", detail: "Preserve clinical access while accepting continued actor opportunity.", impact: 5, continuity: 3, sector: -6, objective: 8, quality: 2 } },
  { id: "sector-2", title: "Supplier support boundary", prompt: "Plant operations can suspend remote maintenance or preserve vendor support through the shift.", a: { title: "Suspend supplier access", detail: "Protect the boundary while local engineers assume support duties.", impact: -5, continuity: -4, sector: 6, objective: -8, quality: 5 }, b: { title: "Maintain supervised access", detail: "Retain support capacity while monitoring the supplier session.", impact: 3, continuity: 4, sector: -3, objective: 5, quality: 3 } },
  { id: "sector-3", title: "Vessel-planning cut-off", prompt: "The next operating plan must be issued before the terminal can fully validate the booking platform.", a: { title: "Issue a manual validated plan", detail: "Slow terminal flow to avoid propagating untrusted data.", impact: -4, continuity: -6, sector: 5, objective: -5, quality: 5 }, b: { title: "Continue automated planning", detail: "Protect capacity but rely on a platform under investigation.", impact: 5, continuity: 4, sector: -7, objective: 6, quality: 2 } },
  { id: "sector-4", title: "Tenant isolation boundary", prompt: "A potentially affected tenant can be isolated, but shared control-plane evidence is incomplete.", a: { title: "Isolate the affected tenant", detail: "Constrain exposure while accepting customer disruption.", impact: -7, continuity: -5, sector: 5, objective: -8, quality: 4 }, b: { title: "Constrain privileges only", detail: "Preserve workload access with more residual uncertainty.", impact: -3, continuity: 2, sector: -2, objective: -3, quality: 4 } },
  { id: "sector-5", title: "Partner warning threshold", prompt: "Dependent organisations need to know whether the trusted support identity remains safe.", a: { title: "Issue a qualified warning", detail: "Share confirmed facts and uncertainty so partners can protect themselves.", impact: -4, continuity: 0, sector: 6, objective: -4, quality: 5 }, b: { title: "Wait for attribution", detail: "Avoid unnecessary alarm but delay partner action.", impact: 5, continuity: 1, sector: -6, objective: 5, quality: 2 } },
  { id: "sector-6", title: "Public transaction surge", prompt: "A demand peak has begun while the administrative trust boundary remains uncertain.", a: { title: "Restrict administration", detail: "Freeze privileged change while keeping public transactions available.", impact: -5, continuity: -2, sector: 5, objective: -6, quality: 5 }, b: { title: "Maintain normal administration", detail: "Preserve operational flexibility while the trust path remains exposed.", impact: 4, continuity: 3, sector: -4, objective: 6, quality: 2 } },
  { id: "sector-7", title: "Core routing instability", prompt: "A neighbouring network domain is unstable and may be connected to the intrusion.", a: { title: "Quarantine the management route", detail: "Constrain movement with a controlled subscriber impact.", impact: -6, continuity: -5, sector: 6, objective: -7, quality: 5 }, b: { title: "Observe routing behaviour", detail: "Preserve visibility while accepting cascading network risk.", impact: 5, continuity: 2, sector: -7, objective: 8, quality: 2 } },
  { id: "sector-8", title: "Manual process operation", prompt: "Operators can move one process area to manual supervision before support access is constrained.", a: { title: "Enter manual supervision", detail: "Create a safer cyber-response window at an operating cost.", impact: -5, continuity: -6, sector: 7, objective: -7, quality: 5 }, b: { title: "Remain in normal control", detail: "Preserve efficiency but narrow the margin for cyber intervention.", impact: 3, continuity: 3, sector: -6, objective: 6, quality: 2 } },
  { id: "sector-9", title: "Clearing cut-off", prompt: "Several unusual approvals must be accepted, delayed or rejected before settlement.", a: { title: "Hold high-risk transactions", detail: "Protect clearing integrity while legitimate settlement is reviewed.", impact: -7, continuity: -4, sector: 7, objective: -9, quality: 5 }, b: { title: "Clear and investigate later", detail: "Meet the deadline while accepting possible fraudulent settlement.", impact: 7, continuity: 4, sector: -8, objective: 10, quality: 1 } },
];

export type ChallengeSetup = { scenario: number; difficulty: Difficulty; mode: GameMode; specialist: SpecialistId; seed: number };
const difficultyIds: Difficulty[] = ["training", "operational", "crisis"];
const modeIds: GameMode[] = ["campaign", "daily", "ironman", "escalation", "expert"];
const specialistIds: SpecialistId[] = ["hunter", "forensics", "identity", "ot", "continuity", "communications"];

export function encodeChallenge(setup: ChallengeSetup) {
  const body = [setup.scenario, difficultyIds.indexOf(setup.difficulty), modeIds.indexOf(setup.mode), specialistIds.indexOf(setup.specialist), setup.seed].join("-");
  const checksum = [...body].reduce((sum, char) => (sum + char.charCodeAt(0)) % 97, 0);
  return `BC-${body}-${checksum.toString().padStart(2, "0")}`;
}

export function decodeChallenge(code: string): ChallengeSetup | null {
  const match = /^BC-(\d+)-(\d+)-(\d+)-(\d+)-(\d+)-(\d{2})$/i.exec(code.trim());
  if (!match) return null;
  const [, scenarioRaw, difficultyRaw, modeRaw, specialistRaw, seedRaw, checksumRaw] = match;
  const body = [scenarioRaw, difficultyRaw, modeRaw, specialistRaw, seedRaw].join("-");
  const checksum = [...body].reduce((sum, char) => (sum + char.charCodeAt(0)) % 97, 0);
  const scenario = Number(scenarioRaw), difficulty = difficultyIds[Number(difficultyRaw)], mode = modeIds[Number(modeRaw)], specialist = specialistIds[Number(specialistRaw)], seed = Number(seedRaw);
  return checksum === Number(checksumRaw) && scenario >= 0 && scenario < 10 && difficulty && mode && specialist && Number.isSafeInteger(seed) ? { scenario, difficulty, mode, specialist, seed } : null;
}

export function seededChallengeRandom(seed: number) {
  let state = seed >>> 0;
  return (max: number) => { state = (state * 1664525 + 1013904223) >>> 0; return state % max; };
}
