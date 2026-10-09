import type { Difficulty } from "./game";
import type { GameMode, SpecialistId } from "./command-systems";

export type InfrastructureNode = { id: string; label: string; type: string; procedures: string[] };
export type InfrastructureEdge = { from: string; to: string; label: string };
export type InfrastructureTopology = { title: string; critical: string; criticalRule: string; nodes: InfrastructureNode[]; edges: InfrastructureEdge[] };

// Each scenario carries its own map: node count, trust edges and the rule that
// decides which node is critical all differ, so the spatial puzzle changes with
// the incident instead of repeating one five-node chain.
const staffIdentity: InfrastructureNode = { id: "user", label: "Staff identity", type: "IDENTITY", procedures: ["identity", "email"] };
const accessEdge: InfrastructureNode = { id: "boundary", label: "Access boundary", type: "EDGE", procedures: ["firewall", "network", "dns"] };
const businessApps: InfrastructureNode = { id: "service", label: "Business apps", type: "APPLICATION", procedures: ["server", "cloud", "forensic"] };

export const infrastructureTopologies: InfrastructureTopology[] = [
  { title: "Enterprise trust map", critical: "service", criticalRule: "The shared application platform supports every dependent workflow, so isolating it carries the highest service cost.", nodes: [
    staffIdentity,
    accessEdge,
    businessApps,
    { id: "admin", label: "Privileged services", type: "CONTROL", procedures: ["identity", "cloud", "hunt"] },
    { id: "data", label: "Corporate records", type: "ASSET", procedures: ["network", "cloud", "intel"] },
    { id: "supplier", label: "Managed provider", type: "EXTERNAL", procedures: ["firewall", "intel", "network"] },
  ], edges: [
    { from: "user", to: "boundary", label: "AUTHENTICATES" }, { from: "boundary", to: "service", label: "CONNECTS" },
    { from: "service", to: "admin", label: "TRUSTS" }, { from: "admin", to: "data", label: "CONTROLS" },
    { from: "service", to: "data", label: "READS" }, { from: "supplier", to: "boundary", label: "SUPPORTS" },
  ] },
  { title: "Clinical support map", critical: "records", criticalRule: "The records store sets the clinical-continuity cost of containment, so it is the critical dependency.", nodes: [
    { id: "clinician", label: "Clinical user", type: "IDENTITY", procedures: ["identity", "email"] },
    { id: "gateway", label: "Support gateway", type: "EDGE", procedures: ["firewall", "network", "dns"] },
    { id: "support", label: "Support service", type: "APPLICATION", procedures: ["server", "forensic", "cloud"] },
    { id: "scheduling", label: "Scheduling platform", type: "APPLICATION", procedures: ["server", "cloud", "intel"] },
    { id: "records", label: "Patient records", type: "ASSET", procedures: ["network", "cloud", "intel"] },
  ], edges: [
    { from: "clinician", to: "gateway", label: "AUTHENTICATES" }, { from: "gateway", to: "support", label: "CONNECTS" },
    { from: "support", to: "scheduling", label: "TRUSTS" }, { from: "scheduling", to: "records", label: "READS" },
    { from: "support", to: "records", label: "READS" },
  ] },
  { title: "Generation support map", critical: "engineering", criticalRule: "The engineering zone holds operational authority, so it is critical and isolating it needs plant approval.", nodes: [
    { id: "supplier", label: "Supplier identity", type: "IDENTITY", procedures: ["identity", "email"] },
    { id: "gateway", label: "Maintenance gateway", type: "EDGE", procedures: ["firewall", "network", "dns"] },
    { id: "jump", label: "Maintenance jump host", type: "EDGE", procedures: ["endpoint", "network", "firewall"] },
    { id: "patch", label: "Patch server", type: "APPLICATION", procedures: ["server", "endpoint", "forensic"] },
    { id: "engineering", label: "Engineering zone", type: "CONTROL", procedures: ["identity", "endpoint", "hunt"] },
    { id: "historian", label: "Historian relay", type: "APPLICATION", procedures: ["server", "endpoint", "forensic"] },
    { id: "config", label: "Plant configuration", type: "ASSET", procedures: ["network", "server", "intel"] },
  ], edges: [
    { from: "supplier", to: "gateway", label: "AUTHENTICATES" }, { from: "gateway", to: "jump", label: "CONNECTS" },
    { from: "jump", to: "patch", label: "DEPLOYS" }, { from: "jump", to: "historian", label: "DEPLOYS" },
    { from: "patch", to: "engineering", label: "TRUSTS" }, { from: "engineering", to: "config", label: "CONTROLS" },
    { from: "config", to: "historian", label: "BACKFILLS" },
  ] },
  { title: "Terminal dependency map", critical: "portal", criticalRule: "The booking portal is the partner-facing edge, so it is critical and isolating it severs external transactions first.", nodes: [
    { id: "partner", label: "Partner identity", type: "IDENTITY", procedures: ["identity", "email"] },
    { id: "portal", label: "Booking portal", type: "EDGE", procedures: ["server", "network", "firewall"] },
    { id: "platform", label: "Terminal platform", type: "APPLICATION", procedures: ["server", "endpoint", "forensic"] },
    { id: "planning", label: "Vessel planning", type: "CONTROL", procedures: ["identity", "endpoint", "hunt"] },
    { id: "schedules", label: "Cargo schedules", type: "ASSET", procedures: ["network", "cloud", "intel"] },
  ], edges: [
    { from: "partner", to: "portal", label: "CONNECTS" }, { from: "portal", to: "platform", label: "TRUSTS" },
    { from: "platform", to: "planning", label: "CONTROLS" }, { from: "planning", to: "schedules", label: "CONTROLS" },
    { from: "platform", to: "schedules", label: "READS" },
  ] },
  { title: "Cloud trust map", critical: "control", criticalRule: "Control-plane isolation removes the privilege path that reaches every tenant resource, so it is critical.", nodes: [
    { id: "workload", label: "Workload identity", type: "IDENTITY", procedures: ["identity", "cloud"] },
    { id: "api", label: "Cloud API edge", type: "EDGE", procedures: ["firewall", "network", "dns"] },
    { id: "control", label: "Control plane", type: "CONTROL", procedures: ["identity", "cloud", "hunt"] },
    { id: "store", label: "Object storage", type: "ASSET", procedures: ["cloud", "network", "intel"] },
  ], edges: [
    { from: "workload", to: "api", label: "AUTHENTICATES" }, { from: "api", to: "control", label: "CALLS" },
    { from: "control", to: "store", label: "CONTROLS" }, { from: "api", to: "store", label: "READS" },
  ] },
  { title: "Shared-service map", critical: "gateway", criticalRule: "The shared gateway is the single trust entry point, so it is critical and isolating it affects every connected organisation.", nodes: [
    { id: "support", label: "Support identity", type: "IDENTITY", procedures: ["identity", "email"] },
    { id: "gateway", label: "Shared gateway", type: "EDGE", procedures: ["firewall", "network", "dns"] },
    { id: "platform", label: "Common platform", type: "APPLICATION", procedures: ["server", "cloud", "forensic"] },
    { id: "trust", label: "Trust service", type: "CONTROL", procedures: ["identity", "cloud", "hunt"] },
    { id: "partners", label: "Partner records", type: "ASSET", procedures: ["network", "cloud", "intel"] },
    { id: "federation", label: "Federation broker", type: "CONTROL", procedures: ["cloud", "identity", "intel"] },
  ], edges: [
    { from: "support", to: "gateway", label: "AUTHENTICATES" }, { from: "gateway", to: "platform", label: "CONNECTS" },
    { from: "platform", to: "trust", label: "TRUSTS" }, { from: "trust", to: "partners", label: "READS" },
    { from: "trust", to: "federation", label: "ISSUES" }, { from: "platform", to: "partners", label: "READS" },
  ] },
  { title: "Public-service map", critical: "transactions", criticalRule: "Transaction records carry legal and public-accountability weight, so they are critical and their isolation is the costliest decision.", nodes: [
    { id: "citizen", label: "Citizen identity", type: "IDENTITY", procedures: ["identity", "email"] },
    { id: "dgateway", label: "Digital gateway", type: "EDGE", procedures: ["firewall", "network", "dns"] },
    { id: "publicsvc", label: "Public service", type: "APPLICATION", procedures: ["server", "cloud", "forensic"] },
    { id: "agency", label: "Agency control", type: "CONTROL", procedures: ["identity", "cloud", "hunt"] },
    { id: "transactions", label: "Transaction records", type: "ASSET", procedures: ["network", "cloud", "intel"] },
  ], edges: [
    { from: "citizen", to: "dgateway", label: "AUTHENTICATES" }, { from: "dgateway", to: "publicsvc", label: "CONNECTS" },
    { from: "publicsvc", to: "agency", label: "TRUSTS" }, { from: "agency", to: "transactions", label: "CONTROLS" },
    { from: "publicsvc", to: "transactions", label: "WRITES" },
  ] },
  { title: "Core network map", critical: "core", criticalRule: "The network core carries national traffic, so it is critical and isolating it is the highest-consequence action on this map.", nodes: [
    { id: "operator", label: "Operator identity", type: "IDENTITY", procedures: ["identity", "email"] },
    { id: "medge", label: "Management edge", type: "EDGE", procedures: ["firewall", "network", "dns"] },
    { id: "oss", label: "OSS support", type: "APPLICATION", procedures: ["server", "cloud", "forensic"] },
    { id: "core", label: "Network core", type: "APPLICATION", procedures: ["network", "server", "cloud"] },
    { id: "routing", label: "Routing control", type: "CONTROL", procedures: ["identity", "cloud", "hunt"] },
    { id: "subscriber", label: "Subscriber services", type: "ASSET", procedures: ["network", "cloud", "intel"] },
    { id: "probe", label: "Performance probes", type: "EDGE", procedures: ["network", "dns", "intel"] },
  ], edges: [
    { from: "operator", to: "medge", label: "AUTHENTICATES" }, { from: "medge", to: "oss", label: "CONNECTS" },
    { from: "oss", to: "core", label: "MANAGES" }, { from: "core", to: "routing", label: "CONTROLS" },
    { from: "routing", to: "subscriber", label: "PROVISIONS" }, { from: "core", to: "subscriber", label: "CARRIES" },
    { from: "probe", to: "core", label: "MONITORS" },
  ] },
  { title: "Water support map", critical: "supervision", criticalRule: "Process supervision carries safety authority, so it is critical and isolating it requires operations approval.", nodes: [
    { id: "engineer", label: "Engineer identity", type: "IDENTITY", procedures: ["identity", "email"] },
    { id: "remote", label: "Remote support", type: "EDGE", procedures: ["firewall", "network", "dns"] },
    { id: "ops", label: "Operations server", type: "APPLICATION", procedures: ["server", "endpoint", "forensic"] },
    { id: "supervision", label: "Process supervision", type: "CONTROL", procedures: ["identity", "endpoint", "hunt"] },
  ], edges: [
    { from: "engineer", to: "remote", label: "AUTHENTICATES" }, { from: "remote", to: "ops", label: "CONNECTS" },
    { from: "ops", to: "supervision", label: "CONTROLS" }, { from: "remote", to: "supervision", label: "SUPPORTS" },
  ] },
  { title: "Clearing trust map", critical: "settlement", criticalRule: "Settlement records underpin transaction finality, so they are critical and their isolation halts completion.", nodes: [
    { id: "approver", label: "Approver identity", type: "IDENTITY", procedures: ["identity", "email"] },
    { id: "gateway", label: "Payment gateway", type: "EDGE", procedures: ["firewall", "network", "dns"] },
    { id: "clearing", label: "Clearing service", type: "APPLICATION", procedures: ["server", "cloud", "forensic"] },
    { id: "approval", label: "Approval plane", type: "CONTROL", procedures: ["identity", "cloud", "hunt"] },
    { id: "settlement", label: "Settlement records", type: "ASSET", procedures: ["network", "cloud", "intel"] },
  ], edges: [
    { from: "approver", to: "gateway", label: "AUTHENTICATES" }, { from: "gateway", to: "clearing", label: "CONNECTS" },
    { from: "clearing", to: "approval", label: "TRUSTS" }, { from: "approval", to: "settlement", label: "CONTROLS" },
    { from: "clearing", to: "settlement", label: "WRITES" },
  ] },
];

export const namedSpecialists: Record<SpecialistId, { name: string; callsign: string; voice: string }> = {
  hunter: { name: "Maya Chen", callsign: "TRACE", voice: "I will test behaviour across the evidence boundary." },
  forensics: { name: "Elias Ward", callsign: "ARCHIVE", voice: "Preserve the sequence before the system changes again." },
  identity: { name: "Noor Rahman", callsign: "TRUST", voice: "A valid credential is not the same as a valid action." },
  ot: { name: "Daniel Koh", callsign: "RELAY", voice: "Keep cyber action inside the safe operating envelope." },
  continuity: { name: "Sofia Reyes", callsign: "ANCHOR", voice: "Protect the service while the team reduces uncertainty." },
  communications: { name: "Marcus Bell", callsign: "SIGNAL", voice: "I will keep decisions clear, factual and timely." },
};

export type SetPieceId = `sector-${number}` | `sector-${number}-b`;
export type SetPieceOption = { title: string; detail: string; impact: number; continuity: number; sector: number; objective: number; quality: number };
// Every sector decision carries a graduated middle measure alongside the decisive
// and the permissive one. A real incident rarely offers only "stop it" or "carry
// on": the option that gets used is usually the narrow one — apply the control to
// the affected part, or add a verification step and keep running. It costs more
// effort than either extreme, which is why it does not simply dominate them.
export type SectorSetPiece = { id: SetPieceId; title: string; prompt: string; a: SetPieceOption; b: SetPieceOption; c: SetPieceOption };

export const sectorSetPieces: SectorSetPiece[] = [
  { id: "sector-0", title: "Privileged reset window", prompt: "Business owners can support one coordinated identity reset before payroll processing begins.", a: { title: "Reset the privileged tier", detail: "Reduce identity risk while accepting a short administrative freeze.", impact: -7, continuity: -3, sector: 5, objective: -6, quality: 5 }, b: { title: "Protect payroll availability", detail: "Delay the reset and monitor privileged sessions through processing.", impact: 4, continuity: 4, sector: -4, objective: 7, quality: 3 }, c: { title: "Reset only the exposed accounts", detail: "Stage the reset around the accounts evidence has already touched, leaving payroll processing running.", impact: -3, continuity: -1, sector: 3, objective: -4, quality: 5 } },
  { id: "sector-1", title: "Clinical access decision", prompt: "The affected support path also serves a time-sensitive clinical workflow.", a: { title: "Move clinical work to downtime procedures", detail: "Create a safe isolation window at an immediate service cost.", impact: -6, continuity: -7, sector: 4, objective: -7, quality: 5 }, b: { title: "Keep the support path live", detail: "Preserve clinical access while accepting continued actor opportunity.", impact: 5, continuity: 3, sector: -6, objective: 8, quality: 2 }, c: { title: "Move only the affected clinical lane", detail: "One lane goes to downtime procedures while the rest of the service runs normally.", impact: -3, continuity: -1, sector: 3, objective: -4, quality: 5 } },
  { id: "sector-2", title: "Supplier support boundary", prompt: "Plant operations can suspend remote maintenance or preserve vendor support through the shift.", a: { title: "Suspend supplier access", detail: "Protect the boundary while local engineers assume support duties.", impact: -5, continuity: -4, sector: 6, objective: -8, quality: 5 }, b: { title: "Maintain supervised access", detail: "Retain support capacity while monitoring the supplier session.", impact: 3, continuity: 4, sector: -3, objective: 5, quality: 3 }, c: { title: "Reduce supplier access to read-only", detail: "The vendor keeps diagnostics and loses the ability to change anything.", impact: -2, continuity: -1, sector: 4, objective: -5, quality: 5 } },
  { id: "sector-3", title: "Vessel-planning cut-off", prompt: "The next operating plan must be issued before the terminal can fully validate the booking platform.", a: { title: "Issue a manual validated plan", detail: "Slow terminal flow to avoid propagating untrusted data.", impact: -4, continuity: -6, sector: 5, objective: -5, quality: 5 }, b: { title: "Continue automated planning", detail: "Protect capacity but rely on a platform under investigation.", impact: 5, continuity: 4, sector: -7, objective: 6, quality: 2 }, c: { title: "Validate partner-originated bookings only", detail: "Automated planning continues for internal traffic while partner entries are checked by hand.", impact: -2, continuity: -1, sector: 3, objective: -3, quality: 4 } },
  { id: "sector-4", title: "Tenant isolation boundary", prompt: "A potentially affected tenant can be isolated, but shared control-plane evidence is incomplete.", a: { title: "Isolate the affected tenant", detail: "Constrain exposure while accepting customer disruption.", impact: -7, continuity: -5, sector: 5, objective: -8, quality: 4 }, b: { title: "Constrain privileges only", detail: "Preserve workload access with more residual uncertainty.", impact: -3, continuity: 2, sector: -2, objective: -3, quality: 4 }, c: { title: "Isolate the affected workload only", detail: "Constrain the one workload the evidence reaches rather than the whole tenant.", impact: -4, continuity: -1, sector: 3, objective: -5, quality: 4 } },
  { id: "sector-5", title: "Partner warning threshold", prompt: "Dependent organisations need to know whether the trusted support identity remains safe.", a: { title: "Issue a qualified warning", detail: "Share confirmed facts and uncertainty so partners can protect themselves.", impact: -4, continuity: 0, sector: 6, objective: -4, quality: 5 }, b: { title: "Wait for attribution", detail: "Avoid unnecessary alarm but delay partner action.", impact: 5, continuity: 1, sector: -6, objective: 5, quality: 2 }, c: { title: "Notify the affected partners privately", detail: "Tell the organisations the evidence actually touches, with what is known and what is not.", impact: -2, continuity: 1, sector: 4, objective: 1, quality: 4 } },
  { id: "sector-6", title: "Public transaction surge", prompt: "A demand peak has begun while the administrative trust boundary remains uncertain.", a: { title: "Restrict administration", detail: "Freeze privileged change while keeping public transactions available.", impact: -5, continuity: -2, sector: 5, objective: -6, quality: 5 }, b: { title: "Maintain normal administration", detail: "Preserve operational flexibility while the trust path remains exposed.", impact: 4, continuity: 3, sector: -4, objective: 6, quality: 2 }, c: { title: "Require a second approver for privileged change", detail: "Administration continues under dual control, slower but accountable.", impact: -2, continuity: -1, sector: 3, objective: -4, quality: 5 } },
  { id: "sector-7", title: "Core routing instability", prompt: "A neighbouring network domain is unstable and may be connected to the intrusion.", a: { title: "Quarantine the management route", detail: "Constrain movement with a controlled subscriber impact.", impact: -6, continuity: -5, sector: 6, objective: -7, quality: 5 }, b: { title: "Observe routing behaviour", detail: "Preserve visibility while accepting cascading network risk.", impact: 5, continuity: 2, sector: -7, objective: 8, quality: 2 }, c: { title: "Pin the affected prefixes to a known-good policy", detail: "Hold the narrow route range steady without quarantining the management plane.", impact: -3, continuity: -1, sector: 4, objective: -4, quality: 4 } },
  { id: "sector-8", title: "Manual process operation", prompt: "Operators can move one process area to manual supervision before support access is constrained.", a: { title: "Enter manual supervision", detail: "Create a safer cyber-response window at an operating cost.", impact: -5, continuity: -6, sector: 7, objective: -7, quality: 5 }, b: { title: "Remain in normal control", detail: "Preserve efficiency but narrow the margin for cyber intervention.", impact: 3, continuity: 3, sector: -6, objective: 6, quality: 2 }, c: { title: "Put one process area under closer supervision", detail: "An operator watches the affected area directly while the rest of the plant runs as normal.", impact: -2, continuity: -1, sector: 4, objective: -4, quality: 5 } },
  { id: "sector-9", title: "Clearing cut-off", prompt: "Several unusual approvals must be accepted, delayed or rejected before settlement.", a: { title: "Hold high-risk transactions", detail: "Protect clearing integrity while legitimate settlement is reviewed.", impact: -7, continuity: -4, sector: 7, objective: -9, quality: 5 }, b: { title: "Clear and investigate later", detail: "Meet the deadline while accepting possible fraudulent settlement.", impact: 7, continuity: 4, sector: -8, objective: 10, quality: 1 }, c: { title: "Require out-of-band approval above a lowered threshold", detail: "Settlement continues, with anything above a reduced limit confirmed on a second channel.", impact: -3, continuity: -1, sector: 4, objective: -5, quality: 5 } },
];

// A second crisis per sector, drawn by the incident variant, so the fourth
// variant of a case is not the same crisis as the first. Each keeps the shape
// the first set has: a decisive measure, a permissive one, and a narrow one that
// keeps the service running and still costs something.
const op = (title: string, detail: string, impact: number, continuity: number, sector: number, objective: number, quality: number): SetPieceOption => ({ title, detail, impact, continuity, sector, objective, quality });
export const secondSetPieces: SectorSetPiece[] = [
  { id: "sector-0-b", title: "Board pack mail run", prompt: "The mail team can hold every external message for scanning before the board pack goes out tonight.", a: op("Hold all external mail for scanning", "Every outside message waits for the scanner, and the board pack goes out late.", -6, -5, 5, -6, 5), b: op("Keep mail flowing", "Deliver as normal and review the mail logs afterwards.", 4, 3, -4, 6, 2), c: op("Hold mail to finance and executives only", "The people the evidence points at wait for scanning; everyone else receives mail as normal.", -2, -1, 3, -3, 5) },
  { id: "sector-1-b", title: "Medication cabinet link", prompt: "The ward medication cabinets sync with a system the intruder may have touched. Night rounds start within the hour.", a: op("Run the cabinets offline", "Nurses dispense from local records and paper charts until the link is checked.", -5, -7, 5, -6, 5), b: op("Keep the cabinets synced", "Rounds run normally while the link carries whatever it carries.", 5, 3, -6, 7, 2), c: op("Pharmacist check on controlled drugs", "The link stays up, and a pharmacist confirms every controlled-drug release by phone.", -2, -2, 3, -3, 5) },
  { id: "sector-2-b", title: "Plant data export", prompt: "Plant data leaves for the corporate network every fifteen minutes, across the boundary under investigation.", a: op("Stop the export", "Corporate reports go blind while the boundary is checked; operators still see the plant.", -4, -5, 6, -7, 5), b: op("Keep exporting", "Trading and planning keep their numbers, and the path stays open.", 3, 3, -5, 6, 2), c: op("Send it through a one-way gateway", "Data still leaves the plant, and nothing can come back along the same path.", -2, -1, 3, -4, 5) },
  { id: "sector-3-b", title: "Crane software update", prompt: "The crane supplier wants to push a scheduled update tonight through its remote channel.", a: op("Close the channel and postpone", "No remote changes to the cranes until the channel is cleared; a known fault stays unfixed.", -4, -4, 5, -6, 5), b: op("Let the update run", "The cranes get their fix through a channel nobody has cleared.", 4, 3, -6, 7, 2), c: op("Install it on site, one crane first", "An engineer brings the update in person on checked media and installs it on one crane before the rest.", -1, -2, 3, -3, 5) },
  { id: "sector-4-b", title: "Customer key rotation", prompt: "Customers ask whether to change their access keys. Forcing it breaks every integration that has not been updated.", a: op("Force new keys for every customer", "All keys change tonight; integrations break until customers update them.", -6, -7, 5, -7, 4), b: op("Advise, enforce nothing", "Customers choose, and most will wait.", 3, 3, -4, 5, 2), c: op("Force new keys where use looks unusual", "Only keys signed in from outside their normal pattern change; the rest are left to their owners.", -3, -2, 3, -4, 5) },
  { id: "sector-5-b", title: "Shared certificate", prompt: "The intruder may hold a copy of a certificate many customers trust. Replacing it means every client must load the new one.", a: op("Revoke and replace it now", "The old certificate stops working tonight, along with every client that has not updated.", -5, -6, 6, -7, 5), b: op("Keep the current certificate", "Nothing breaks, and a possibly copied certificate stays trusted.", 4, 2, -6, 7, 2), c: op("Replace it with a day's overlap", "Both certificates work for a day while clients move over, and the old one is watched closely.", -2, -1, 3, -3, 4) },
  { id: "sector-6-b", title: "Weekly payment run", prompt: "The weekly benefit payment run is due, and the case system that feeds it is under investigation.", a: op("Delay the payment run", "No payments go until the records are checked, and claimants wait.", -4, -7, 6, -7, 4), b: op("Pay as normal", "Claimants are paid on time from records nobody has checked.", 4, 3, -6, 7, 2), c: op("Pay, holding recently changed accounts", "Most payments go on time; accounts whose bank details changed this week wait for a check.", -2, -2, 4, -4, 5) },
  { id: "sector-7-b", title: "Number transfers", prompt: "The intruder may be able to move customers' phone numbers to another network, and with them their sign-in codes.", a: op("Suspend number transfers", "No customer can move their number for a day, and the regulator is told why.", -5, -5, 6, -7, 5), b: op("Keep transfers open", "Customers move numbers as normal while the route is traced.", 4, 2, -6, 7, 2), c: op("Call back before every transfer", "Transfers continue, and each request is confirmed with the customer on their registered number.", -2, -2, 3, -4, 5) },
  { id: "sector-8-b", title: "Chemical dosing values", prompt: "Dosing values were changed overnight. They are within safe limits, and nobody on shift remembers changing them.", a: op("Restore the signed-off values and lock them", "Operators put back the last approved values and block remote changes.", -5, -4, 7, -6, 5), b: op("Leave the values and watch", "The plant runs as it is while the change is traced.", 3, 3, -7, 6, 2), c: op("Restore the values, keep remote access", "The approved values return; remote changes stay possible, and each one raises an alarm.", -3, -1, 4, -3, 5) },
  { id: "sector-9-b", title: "Treasury payment file", prompt: "Treasury's end-of-day payment file arrived with a changed list of payees, approved by the usual approver.", a: op("Reject the file", "Nothing in the file pays out; treasury resubmits after checking, past the cut-off.", -6, -5, 7, -8, 5), b: op("Release the file", "Payments go on time to a payee list nobody has checked.", 6, 3, -8, 9, 1), c: op("Release, holding the new payees", "Known payees are paid on time; new ones wait for a call back to treasury.", -3, -1, 4, -4, 5) },
];

export const allSetPieces = [...sectorSetPieces, ...secondSetPieces];

// Variant 0 is the standard picture every non-campaign operation plays; odd
// variants meet the sector's second crisis. A case the campaign replays after a
// loss meets whichever crisis it did not meet last time.
export function setPieceFor(scenario: number, variantId: string, recent: readonly string[] = []): SectorSetPiece {
  const index = Number(variantId.split("-")[1] ?? 0);
  const [drawn, other] = index % 2 === 1 ? [secondSetPieces[scenario], sectorSetPieces[scenario]] : [sectorSetPieces[scenario], secondSetPieces[scenario]];
  return recent.includes(drawn.id) && !recent.includes(other.id) ? other : drawn;
}

export function setPieceById(id: SetPieceId, scenario: number): SectorSetPiece {
  return allSetPieces.find(piece => piece.id === id) ?? sectorSetPieces[scenario];
}

export type ChallengeSetup = { scenario: number; difficulty: Difficulty; mode: GameMode; specialist: SpecialistId; seed: number };
const difficultyIds: Difficulty[] = ["training", "operational", "crisis"];
const modeIds: GameMode[] = ["campaign", "daily", "ironman", "escalation", "expert"];
const specialistIds: SpecialistId[] = ["hunter", "forensics", "identity", "ot", "continuity", "communications"];

// A code promises the same operation, so it carries the version of the content
// it was made against. Increment this whenever a scenario's technique pools, the
// techniques themselves or the seeded draws change: an older code would
// otherwise decode cleanly and quietly play a different incident. Version 1
// codes were written as "BC-…" before the version was part of the code.
export const CHALLENGE_VERSION = 6;
const checksumOf = (text: string) => [...text].reduce((sum, char) => (sum + char.charCodeAt(0)) % 97, 0);

export function encodeChallenge(setup: ChallengeSetup) {
  const body = [setup.scenario, difficultyIds.indexOf(setup.difficulty), modeIds.indexOf(setup.mode), specialistIds.indexOf(setup.specialist), setup.seed].join("-");
  return `BC${CHALLENGE_VERSION}-${body}-${checksumOf(`${CHALLENGE_VERSION}:${body}`).toString().padStart(2, "0")}`;
}

export function decodeChallenge(code: string): ChallengeSetup | null {
  const match = /^BC(\d+)-(\d+)-(\d+)-(\d+)-(\d+)-(\d+)-(\d{2})$/i.exec(code.trim());
  if (!match || Number(match[1]) !== CHALLENGE_VERSION) return null;
  const [, version, scenarioRaw, difficultyRaw, modeRaw, specialistRaw, seedRaw, checksumRaw] = match;
  const body = [scenarioRaw, difficultyRaw, modeRaw, specialistRaw, seedRaw].join("-");
  const scenario = Number(scenarioRaw), difficulty = difficultyIds[Number(difficultyRaw)], mode = modeIds[Number(modeRaw)], specialist = specialistIds[Number(specialistRaw)], seed = Number(seedRaw);
  return checksumOf(`${version}:${body}`) === Number(checksumRaw) && scenario >= 0 && scenario < 10 && difficulty && mode && specialist && Number.isSafeInteger(seed) ? { scenario, difficulty, mode, specialist, seed } : null;
}

// A well-formed code from an earlier content version: it would decode to a
// different incident than the one it was shared for, so it is named as outdated
// rather than reported as mistyped.
export function isOutdatedChallenge(code: string) {
  const current = /^BC(\d+)-(?:\d+-){5}\d{2}$/i.exec(code.trim());
  if (current) return Number(current[1]) < CHALLENGE_VERSION;
  return /^BC-(?:\d+-){5}\d{2}$/i.test(code.trim());
}

// The nth d20 of a seeded operation is a pure function of the seed and the turn
// index, so nothing about the roll stream has to be stored, serialised or
// replayed: a challenge code reproduces the same sequence on any device, and a
// saved session resumes on exactly the roll it would have produced.
export function seededRoll(seed: number, index: number, faces = 20) {
  let state = ((seed >>> 0) + Math.imul(index + 1, 0x9e3779b9)) >>> 0;
  state = Math.imul(state ^ (state >>> 16), 0x21f0aaad) >>> 0;
  state = Math.imul(state ^ (state >>> 15), 0x735a2d97) >>> 0;
  state = (state ^ (state >>> 15)) >>> 0;
  return (state % faces) + 1;
}

export function seededChallengeRandom(seed: number) {
  let state = seed >>> 0;
  return (max: number) => { state = (state * 1664525 + 1013904223) >>> 0; return state % max; };
}
