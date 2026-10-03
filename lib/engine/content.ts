// Authored tables the engine reads: injects, adversary profiles, command events, response options and decision language.
import { type HypothesisId } from "../game.ts";
import { type AdversaryProfileId, type DecisionChoice, type ResponseOption, type ResponsePhase, type ResponseProfile } from "./types.ts";

// A critical roll is the loudest feedback the game gives, so what it draws has to
// agree with it: a natural 20 must never hand the player a penalty and a natural 1
// must never hand them a gift. Valence decides which end of the deck each
// trigger reaches into; a run of failed rolls still draws from the whole deck.
export const injects = [
  { id: "expert", valence: "good", title: "A specialist joins", text: "A responder helps focus the next investigative plan.", effect: "bonus", effectLabel: "Analytical advantage on the next procedure." },
  { id: "delay", valence: "bad", title: "Access approval delayed", text: "Coordination friction slows the next action while business impact grows.", effect: "penalty", effectLabel: "The next action is harder and pressure rises." },
  { id: "restored", valence: "good", title: "Collection pipeline restored", text: "A repaired pipeline lets you revisit a used procedure early.", effect: "restore", effectLabel: "One cooling-down procedure becomes available." },
  { id: "partner", valence: "good", title: "Partner shares evidence", text: "A trusted partner supplies a validated finding.", effect: "reveal", effectLabel: "One hidden stage is revealed, if any remain." },
  { id: "press", valence: "bad", title: "Leadership wants an update", text: "Leaders ask whether the essential service is safe. Uncertainty carries a cost.", effect: "pressure", effectLabel: "Business pressure rises." },
  { id: "backup", valence: "good", title: "A useful evidence copy", text: "Retained telemetry improves the next investigation.", effect: "bonus", effectLabel: "Analytical advantage on the next procedure." },
  { id: "noise", valence: "bad", title: "An alert flood", text: "Unrelated alerts reduce analyst attention and delay decisions.", effect: "penalty", effectLabel: "The next action is harder and pressure rises." },
  { id: "operations", valence: "good", title: "Operations stabilises service", text: "A workaround buys the investigation team time.", effect: "relief", effectLabel: "Business pressure falls." },
  { id: "exercise", valence: "neutral", title: "Authorised exercise confirmed", text: "The controller confirms that the activity belongs to an authorised test.", effect: "end", effectLabel: "Exercise ends." },
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
      { id: "accelerate", title: "Accept the service owner's assurance", description: "Payroll and workflow owners can see their own data, so their sign-off carries real weight here.", disruption: "Low", confidence: "Moderate", residual: "Moderate", impact: 2, continuity: 5, score: 9 },
    ],
    recovery: [
      { id: "rebuild", title: "Rebuild the application tier from baseline", description: "Highest assurance for shared services, with the longest payroll interruption.", disruption: "High", confidence: "Strong", residual: "Low", impact: -18, continuity: -13, score: 14 },
      { id: "restore", title: "Restore validated service backups", description: "Returns payroll and shared applications faster if integrity is understood.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -12, continuity: 2, score: 11 },
      { id: "patch", title: "Patch the application tier in place", description: "A shared application tier patches cleanly and the dependency map is well understood.", disruption: "Low", confidence: "Moderate", residual: "Moderate", impact: -6, continuity: 8, score: 10 },
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
      { id: "accelerate", title: "Accept the clinical safety check", description: "Care teams verify records against their own independent checks, and every hour of manual working carries its own risk.", disruption: "Low", confidence: "Moderate", residual: "Moderate", impact: 3, continuity: 6, score: 11 },
    ],
    recovery: [
      { id: "rebuild", title: "Rebuild the support estate from baseline", description: "Highest assurance, with the longest period of manual clinical work.", disruption: "High", confidence: "Strong", residual: "Low", impact: -17, continuity: -16, score: 14 },
      { id: "restore", title: "Restore validated clinical backups", description: "Returns scheduling and records faster if integrity is sound.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -11, continuity: 3, score: 12 },
      { id: "patch", title: "Patch in place under clinical supervision", description: "Keeps scheduling and records running while clinicians watch for anomalies they would recognise.", disruption: "Low", confidence: "Developing", residual: "High", impact: -5, continuity: 8, score: 9 },
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
      { id: "accelerate", title: "Accept the plant integrity check", description: "Plant instrumentation is independent of the support estate, so it can confirm what the support estate cannot.", disruption: "Low", confidence: "Moderate", residual: "Moderate", impact: 2, continuity: 5, score: 11 },
    ],
    recovery: [
      { id: "rebuild", title: "Rebuild the support estate from baseline", description: "Strongest assurance, with the longest engineering-capacity gap.", disruption: "High", confidence: "Strong", residual: "Low", impact: -18, continuity: -12, score: 14 },
      { id: "restore", title: "Restore validated support backups", description: "Returns maintenance capability faster if integrity is understood.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -12, continuity: 2, score: 11 },
      { id: "patch", title: "Patch in place behind the plant boundary", description: "The engineering boundary holds while the support estate is patched, and instrumentation would show a process deviation.", disruption: "Low", confidence: "Moderate", residual: "Moderate", impact: -6, continuity: 7, score: 11 },
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
      { id: "accelerate", title: "Accept the terminal's operational check", description: "Terminal checks confirm that bookings flow, not that they are trustworthy, and partner traffic keeps moving either way.", disruption: "Low", confidence: "Developing", residual: "High", impact: 3, continuity: 6, score: 6 },
    ],
    recovery: [
      { id: "rebuild", title: "Rebuild the booking platform from baseline", description: "Highest assurance, with the longest planning interruption.", disruption: "High", confidence: "Strong", residual: "Low", impact: -18, continuity: -14, score: 14 },
      { id: "restore", title: "Restore validated scheduling backups", description: "Returns automated planning faster if integrity is sound.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -12, continuity: 3, score: 12 },
      { id: "patch", title: "Patch in place and keep the berth working", description: "Holds terminal capacity, but partner systems keep transacting against an estate you have not re-proved.", disruption: "Low", confidence: "Developing", residual: "High", impact: -6, continuity: 8, score: 7 },
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
      { id: "accelerate", title: "Accept the provider's platform assurance", description: "The provider attests to a control plane you cannot inspect, which is the plane under investigation.", disruption: "Low", confidence: "Limited", residual: "High", impact: 2, continuity: 5, score: 4 },
    ],
    recovery: [
      { id: "rebuild", title: "Rebuild the workload from a trusted image", description: "Highest assurance, with the longest automation gap.", disruption: "High", confidence: "Strong", residual: "Low", impact: -18, continuity: -13, score: 14 },
      { id: "restore", title: "Restore validated workload snapshots", description: "Returns automation faster if snapshot integrity is understood.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -12, continuity: 2, score: 11 },
      { id: "patch", title: "Patch roles in place and monitor", description: "Keeps workloads running, but a role left in place is the same role the actor used.", disruption: "Low", confidence: "Limited", residual: "High", impact: -6, continuity: 8, score: 6 },
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
      { id: "accelerate", title: "Accept each tenant's own assurance", description: "Downstream tenants sign off on their own view, which leaves what they cannot see unexamined.", disruption: "Low", confidence: "Developing", residual: "High", impact: 2, continuity: 5, score: 8 },
    ],
    recovery: [
      { id: "rebuild", title: "Rebuild the shared platform from baseline", description: "Strongest assurance, with the longest coordination pause for partners.", disruption: "High", confidence: "Strong", residual: "Low", impact: -18, continuity: -12, score: 14 },
      { id: "restore", title: "Restore validated shared backups", description: "Returns dependent organisations faster if integrity is understood.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -12, continuity: 2, score: 11 },
      { id: "patch", title: "Patch the shared platform in place", description: "A shared platform is patched once for every tenant, and staged rollout is routine work here.", disruption: "Low", confidence: "Moderate", residual: "Moderate", impact: -6, continuity: 8, score: 9 },
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
      { id: "accelerate", title: "Accept the department's service check", description: "Service checks show the counter is open. The authority to make administrative decisions is what is in question.", disruption: "Low", confidence: "Limited", residual: "High", impact: 3, continuity: 6, score: 5 },
    ],
    recovery: [
      { id: "rebuild", title: "Rebuild the public service from baseline", description: "Highest assurance, with the longest administrative pause.", disruption: "High", confidence: "Strong", residual: "Low", impact: -18, continuity: -14, score: 14 },
      { id: "restore", title: "Restore validated service backups", description: "Returns citizen transactions faster if integrity is sound.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -12, continuity: 3, score: 12 },
      { id: "patch", title: "Patch in place and keep services open", description: "Public capacity holds, but administrative decisions keep issuing from an estate still under suspicion.", disruption: "Low", confidence: "Developing", residual: "High", impact: -6, continuity: 8, score: 7 },
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
      { id: "accelerate", title: "Accept the routing health check", description: "A compromised management plane reports healthy routing, because reporting healthy routing is what it is for.", disruption: "Low", confidence: "Limited", residual: "High", impact: 3, continuity: 6, score: 5 },
    ],
    recovery: [
      { id: "rebuild", title: "Rebuild the management core from baseline", description: "Strongest assurance, with the longest restriction of management change.", disruption: "High", confidence: "Strong", residual: "Low", impact: -20, continuity: -14, score: 14 },
      { id: "restore", title: "Restore validated core configuration", description: "Returns routing control faster if integrity is understood.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -13, continuity: 2, score: 11 },
      { id: "patch", title: "Patch the management plane in place", description: "Connectivity holds and the change window stays short, but the plane doing the reporting is the one being patched.", disruption: "Low", confidence: "Developing", residual: "High", impact: -6, continuity: 8, score: 9 },
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
      { id: "accelerate", title: "Accept the treatment safety check", description: "Manual supervision and physical process limits sit outside the compromised estate and can be trusted on their own terms.", disruption: "Low", confidence: "Moderate", residual: "Moderate", impact: 2, continuity: 5, score: 12 },
    ],
    recovery: [
      { id: "rebuild", title: "Rebuild the support environment from baseline", description: "Strongest assurance, with the longest manual-supervision period.", disruption: "High", confidence: "Strong", residual: "Low", impact: -17, continuity: -13, score: 14 },
      { id: "restore", title: "Restore validated support backups", description: "Returns engineering support faster if integrity is understood.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -11, continuity: 2, score: 11 },
      { id: "patch", title: "Patch in place under manual supervision", description: "Supervision continues through the patch, and the process would show a deviation before an operator would.", disruption: "Low", confidence: "Moderate", residual: "Moderate", impact: -5, continuity: 7, score: 12 },
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
      { id: "accelerate", title: "Accept the settlement reconciliation", description: "Reconciliation is the control being tested. Accepting its own output as assurance is the failure this incident is about.", disruption: "Low", confidence: "Limited", residual: "High", impact: 3, continuity: 5, score: 3 },
    ],
    recovery: [
      { id: "rebuild", title: "Rebuild the clearing service from baseline", description: "Highest assurance, with the longest settlement delay.", disruption: "High", confidence: "Strong", residual: "Low", impact: -19, continuity: -14, score: 14 },
      { id: "restore", title: "Restore validated settlement backups", description: "Returns clearing faster if backup integrity is understood.", disruption: "Moderate", confidence: "Moderate", residual: "Moderate", impact: -12, continuity: 2, score: 11 },
      { id: "patch", title: "Patch in place and clear the window", description: "The settlement window closes on time, on an estate whose approval path has not been re-proved.", disruption: "Low", confidence: "Limited", residual: "High", impact: -5, continuity: 8, score: 5 },
    ],
  },
];

// Kept for compatibility: the first incident's authored set. Prefer responseOptionsFor.
export const responseOptions: Record<ResponsePhase, ResponseOption[]> = { containment: responseProfiles[0].containment, assurance: responseProfiles[0].assurance, recovery: responseProfiles[0].recovery };

export type DecisionLanguage = {
  observeTitle: string; observe: string;
  actTitle: string; act: string;
  attributeTitle: string; attribute: string;
  containTitle: string; contain: string;
  notifyTitle: string; notify: string;
  observeCost: number; actRelief: number; continuityCost: number; containRelief: number; containCost: number;
};

export const decisionLanguage: DecisionLanguage[] = [
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

export const decisionTitles: Record<DecisionChoice, keyof DecisionLanguage> = { observe: "observeTitle", act: "actTitle", attribute: "attributeTitle", contain: "containTitle", notify: "notifyTitle" };

export const decisionText: Record<DecisionChoice, keyof DecisionLanguage> = { observe: "observe", act: "act", attribute: "attribute", contain: "contain", notify: "notify" };

export const scenarioProfiles: AdversaryProfileId[][] = [
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

// The interface uses the field's own vocabulary, which is right for the subject
// and wrong for a first-time player reading it cold. Every term here is one a
// playtest reported needing translated.
export const plainLanguage: Record<string, string> = {
  "endpoint": "An individual computer — a laptop, desktop or server — as opposed to the network or an online service.",
  "control plane": "The management layer of a cloud service: the settings, roles and keys that decide what everything else in the account may do.",
  "pivot": "Using one compromised system or account as a stepping stone to reach the next.",
  "C2": "Command and control: the channel an intruder uses to send instructions to compromised systems and receive what they collect.",
  "egress": "Traffic leaving the organisation's network for the internet.",
  "east-west traffic": "Traffic between systems inside the network, rather than in from or out to the internet.",
  "DNS": "The internet's address book, which turns names into network addresses. Its lookups can be abused to smuggle small amounts of data.",
  "established source": "An evidence source your team already knows well: a few start that way and the campaign adds more. It adds +2 to the roll.",
  "inject": "An unplanned event the exercise controller adds part-way through: a disclosure, an outage or a lucky break.",
  "pre-positioning": "Gaining quiet access now in order to act later, often during a crisis, rather than to take anything today.",
  "privileged tier": "Accounts with powerful administrative access — the ones that can change anything.",
  "trust boundary": "The line between two systems that are allowed to rely on each other. Crossing it is how an intruder spreads.",
  "actor tempo": "How quickly the intruder is moving. It rises when you give them time and falls when you press them.",
  "bounded containment": "Shutting down one specific path rather than the whole service, so less of the business stops.",
  "assurance gate": "The step between stopping the attack and restoring service, where you check the environment is actually clean.",
  "residual risk": "What is still uncertain after you act — the part of the problem the chosen option does not settle.",
  "causal sequence": "One finding is what the next one needed — consecutive stages of the intrusion, or two steps on the same route. Two things on the same system at the same time are not thereby related.",
  "evidence boundary": "How far out you are currently looking. Widening it brings connected systems into the investigation and costs time.",
  "assurance": "Checking the environment is genuinely clean before you put the service back.",
  "exfiltration": "Data being taken out of the organisation.",
  "persistence": "A foothold the intruder can return through after a reboot or a password change.",
  "lateral movement": "Moving from the first system compromised to other systems inside the network.",
  "attribution": "Working out who is behind the activity, from how they behave rather than from a name.",
  "continuity": "Whether the essential service is still running for the people who depend on it.",
};

// A bare signed number leaves a new player guessing which way is good: impact
// rising is bad, continuity and sector confidence rising are good. Every meter
// delta the interface shows says which.
export const meterDirection: Record<string, { label: string; risesIsGood: boolean }> = {
  impact: { label: "Impact", risesIsGood: false },
  continuity: { label: "Continuity", risesIsGood: true },
  sector: { label: "Sector confidence", risesIsGood: true },
  objective: { label: "Actor progress", risesIsGood: false },
  tempo: { label: "Actor tempo", risesIsGood: false },
};

// Decision verbs trade off along five axes. Only act pressures the actor hard
// enough to force a route adaptation, while contain protects the sector that act
// would erode, notify protects continuity at the cost of tempo and disclosure,
// and attribute buys analytical depth without reducing exposure at all.
export const decisionEffects: Record<DecisionChoice, string> = {
  observe: "Evidence improved while attacker opportunity increased.",
  act: "Immediate exposure reduced; service and telemetry were affected.",
  attribute: "Attribution depth improved before any change to the environment.",
  contain: "The observed path was restricted without eroding the sector's own margin.",
  notify: "Stakeholders were aligned on confirmed facts; the actor gained tempo.",
};
