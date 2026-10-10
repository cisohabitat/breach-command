// Authored tables the engine reads: injects, adversary profiles, command events, response options and decision language.
import { type HypothesisId } from "../game.ts";
import { type AdversaryProfileId, type DecisionChoice, type ResponseOption, type ResponsePhase, type ResponseProfile } from "./types.ts";
import { registerContent } from "../i18n/content/registry.ts";

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
  // Appended, never inserted: a saved deck holds indices into this table. An
  // "adjust" card states its own numbers — the next roll, business impact,
  // service continuity and the adversary's pace — and its label says what they
  // do. A neutral card is a trade, good and bad at once, so a critical roll
  // never reaches one: it is drawn only by a run of failed rolls.
  { id: "logs", valence: "good", title: "Retention extended", text: "The storage team extends log retention before older records roll off.", effect: "restore", effectLabel: "One cooling-down procedure becomes available." },
  { id: "workaround", valence: "good", title: "A manual workaround holds", text: "Staff run part of the service by hand while the systems are checked.", effect: "adjust", shift: 0, impact: 0, continuity: 6, tempo: 0, effectLabel: "The service recovers some ground." },
  { id: "blocked", valence: "good", title: "Provider blocks an address", text: "An upstream provider blocks an address the intruder was using to reach the network.", effect: "adjust", shift: 0, impact: 0, continuity: 0, tempo: -1, effectLabel: "The adversary's pace slows." },
  { id: "outage", valence: "bad", title: "An unrelated outage", text: "A failed storage array takes part of the service down and pulls engineers away.", effect: "adjust", shift: 0, impact: 0, continuity: -6, tempo: 0, effectLabel: "The service loses ground." },
  { id: "rumour", valence: "bad", title: "A rumour spreads", text: "A staff post about “the hack” is shared outside the organisation.", effect: "pressure", effectLabel: "Business pressure rises." },
  { id: "tipped", valence: "bad", title: "The intruder notices", text: "Collection traffic touched something the intruder was watching.", effect: "adjust", shift: 0, impact: 0, continuity: 0, tempo: 1, effectLabel: "The adversary's pace quickens." },
  { id: "absent", valence: "bad", title: "A key engineer is off sick", text: "The engineer who knows the core system best is unavailable today.", effect: "adjust", shift: -2, impact: 0, continuity: 0, tempo: 0, effectLabel: "The next action is harder." },
  { id: "update", valence: "bad", title: "An update breaks a collector", text: "An overnight update stops a collection agent reporting, and the fix takes engineers off the service.", effect: "adjust", shift: -1, impact: 0, continuity: -3, tempo: 0, effectLabel: "The next action is harder and the service loses ground." },
  { id: "audit", valence: "neutral", title: "Internal audit sits in", text: "An auditor joins the room: a second pair of eyes, and more questions to answer.", effect: "adjust", shift: 1, impact: 4, continuity: 0, tempo: 0, effectLabel: "The next action is easier; business pressure rises." },
  { id: "quiet", valence: "neutral", title: "The intruder goes quiet", text: "Activity stops for an hour. The adversary is moving more slowly, and there is less to see.", effect: "adjust", shift: -1, impact: 0, continuity: 0, tempo: -1, effectLabel: "The adversary's pace slows; the next action is harder." },
  { id: "overtime", valence: "neutral", title: "Overtime approved", text: "Analysts stay late on the case, and the service desk runs short.", effect: "adjust", shift: 2, impact: 0, continuity: -4, tempo: 0, effectLabel: "The next action is easier; the service loses ground." },
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
  // Three more, each punishing a habit the game already teaches against: an
  // unused infrastructure map, an untested pair of findings, and a service left
  // stretched. Each counterplay is something the player can see and do.
  lantern: {
    title: "Grey Lantern",
    description: "Settles into systems nobody is watching and waits for them to stay unwatched.",
    preferredVectors: ["endpoint", "cloud", "identity", "application"] as HypothesisId[],
    cadence: 3,
    pressure: 1,
    unverifiedSignal: "An old maintenance account signed in overnight. It may be a scheduled job, or someone using it.",
    signature: "Unwatched ground", counterplay: "Use the infrastructure map early: monitor or isolate a system before the third turn.",
  },
  choir: {
    title: "Hollow Choir",
    description: "Spreads its activity across systems so that each finding looks unrelated to the last.",
    preferredVectors: ["application", "endpoint", "cloud", "identity"] as HypothesisId[],
    cadence: 3,
    pressure: 2,
    unverifiedSignal: "Two alerts on separate systems arrived minutes apart. They may be one actor or two unrelated faults.",
    signature: "Scattered trail", counterplay: "Compare confirmed findings as soon as two stand; an untested pair is what it relies on.",
  },
  ember: {
    title: "Ember Shift",
    description: "Times its moves to service strain, when responders are busiest and least watchful.",
    preferredVectors: ["identity", "endpoint", "application", "cloud"] as HypothesisId[],
    cadence: 2,
    pressure: 2,
    unverifiedSignal: "A surge of service-desk tickets coincides with the activity. It may be cover, or coincidence.",
    signature: "Cover of strain", counterplay: "Keep service continuity above 60; below it, the strain covers the actor's moves.",
  },
} as const;

export const commandEvents = {
  scope: {
    title: "Scope is expanding",
    prompt: "A connected service reports related activity. Decide how broadly the team should investigate.",
    a: { title: "Expand the evidence boundary", description: "Bring the connected service into the investigation now.", signal: "Wider scope, added pressure · Next roll harder", modifier: -1, impact: 2, continuity: 0, tempo: 0, quality: 4 },
    b: { title: "Hold the current boundary", description: "Keep the team focused until the link is confirmed.", signal: "Next roll easier · More pressure, faster adversary", modifier: 1, impact: 5, continuity: 0, tempo: 1, quality: 3 },
  },
  leadership: {
    title: "Leadership needs a recommendation",
    prompt: "Executives need a clear position before the next operational decision.",
    a: { title: "Brief confirmed facts and uncertainty", description: "State what is known, what is assumed and what decision is approaching.", signal: "Pressure falls · No analytical shortcut", modifier: 0, impact: -5, continuity: 0, tempo: 0, quality: 5 },
    b: { title: "Delay until the picture is complete", description: "Preserve analyst time and wait for stronger attribution.", signal: "Next roll easier · Pressure rises, faster adversary", modifier: 1, impact: 7, continuity: 0, tempo: 1, quality: 2 },
  },
  capacity: {
    title: "Specialist capacity is limited",
    prompt: "One specialist team can be surged into the incident, but routine operations will lose support.",
    a: { title: "Surge specialist support", description: "Accelerate the next evidence action and accept operational strain.", signal: "Analytical advantage · Service cost", modifier: 2, impact: 0, continuity: -5, tempo: 0, quality: 4 },
    b: { title: "Preserve operational coverage", description: "Keep routine services supported and continue with the current team.", signal: "Continuity protected · Pressure rises, faster adversary", modifier: 0, impact: 3, continuity: 2, tempo: 1, quality: 3 },
  },
  // Nine more, so a campaign act does not meet the same interruption twice. Each
  // is a call a response lead really makes in the middle of an investigation,
  // and each signal names only what its numbers do.
  counsel: {
    title: "Counsel asks to direct the collection",
    prompt: "Legal counsel wants evidence gathered under their direction so findings stay privileged if the incident reaches court.",
    a: { title: "Route collection through counsel", description: "Findings are documented for counsel first, which slows the next check but steadies the organisation.", signal: "Next roll harder · Pressure falls", modifier: -1, impact: -3, continuity: 0, tempo: 0, quality: 4 },
    b: { title: "Collect now and brief counsel after", description: "Keep the investigation moving and accept that some findings may be harder to defend later.", signal: "Pressure rises", modifier: 0, impact: 4, continuity: 0, tempo: 0, quality: 3 },
  },
  supplier: {
    title: "A supplier offers remote help",
    prompt: "The vendor of an affected system offers an engineer on a remote session today. Their access would be one more way in.",
    a: { title: "Accept a supervised session", description: "The engineer knows the system and speeds the next check, but a new remote path is open while they work.", signal: "Next roll easier · Faster adversary", modifier: 1, impact: 0, continuity: 0, tempo: 1, quality: 3 },
    b: { title: "Decline and work with the team you have", description: "No new access while the intruder is inside, at the cost of a slower, more anxious organisation.", signal: "Pressure rises", modifier: 0, impact: 3, continuity: 0, tempo: 0, quality: 4 },
  },
  regulator: {
    title: "A regulator asks whether to expect a notice",
    prompt: "The sector regulator has heard about the disruption and asks whether a formal notification is coming.",
    a: { title: "File an early factual notice", description: "Say what is known and what is not. The regulator is reassured; drafting it costs analyst time.", signal: "Pressure falls · Next roll harder", modifier: -1, impact: -4, continuity: 0, tempo: 0, quality: 5 },
    b: { title: "Wait until the scope is confirmed", description: "Keep the analysts on the investigation and answer the regulator later.", signal: "Pressure rises", modifier: 0, impact: 6, continuity: 0, tempo: 0, quality: 2 },
  },
  shift: {
    title: "The night shift is exhausted",
    prompt: "The analysts who have worked the incident since it began have been awake for twenty hours.",
    a: { title: "Hand over to a fresh shift", description: "A rested team makes fewer mistakes, but the handover loses some of what the first team knew.", signal: "Next roll harder · Pressure falls", modifier: -1, impact: -2, continuity: 0, tempo: 0, quality: 4 },
    b: { title: "Push on with the current shift", description: "They know the incident best; tired people also miss things and lose the room's confidence.", signal: "Next roll easier · Pressure rises", modifier: 1, impact: 3, continuity: 0, tempo: 0, quality: 2 },
  },
  media: {
    title: "A journalist has heard about the outage",
    prompt: "A reporter is asking whether the disruption is a cyber attack and plans to publish within the hour.",
    a: { title: "Issue a short holding statement", description: "Confirm an incident is being handled without detail. Staff are pulled onto customer questions.", signal: "Pressure falls · Service cost", modifier: 0, impact: -4, continuity: -2, tempo: 0, quality: 4 },
    b: { title: "Decline to comment", description: "Nothing is said that might be wrong, and the story runs without the organisation's account.", signal: "Pressure rises", modifier: 0, impact: 5, continuity: 0, tempo: 0, quality: 2 },
  },
  backups: {
    title: "Backups may be reachable from the intrusion",
    prompt: "The backup servers share credentials with systems the intruder may control. If they are wiped, recovery gets much harder.",
    a: { title: "Take the backups offline now", description: "Protects the recovery point, and stops the jobs that keep some services running.", signal: "Service cost · Pressure falls", modifier: 0, impact: -3, continuity: -4, tempo: 0, quality: 5 },
    b: { title: "Leave them online and watch them", description: "Every access to the backups becomes evidence, and the intruder keeps a target.", signal: "Next roll easier · Faster adversary · Pressure rises", modifier: 1, impact: 2, continuity: 0, tempo: 1, quality: 3 },
  },
  approach: {
    title: "Someone was asked for their sign-in code",
    prompt: "A member of staff reports a call from “the help desk” asking for the code on their phone. They did not give it.",
    a: { title: "Treat it as part of the incident", description: "Trace the call and the account it targeted; the intruder may be trying another way in.", signal: "Next roll easier · Pressure rises", modifier: 1, impact: 2, continuity: 0, tempo: 0, quality: 4 },
    b: { title: "Log it for the security awareness team", description: "Keep the investigation on the evidence already in hand.", signal: "Faster adversary", modifier: 0, impact: 0, continuity: 0, tempo: 1, quality: 2 },
  },
  change: {
    title: "A scheduled change is due tonight",
    prompt: "A planned upgrade to an affected system is booked for tonight. Postponing it disappoints the service owner.",
    a: { title: "Freeze all changes", description: "Systems stay as they are while evidence is collected, and the upgrade's improvements wait.", signal: "Next roll easier · Service cost", modifier: 1, impact: 0, continuity: -3, tempo: 0, quality: 4 },
    b: { title: "Let the change go ahead", description: "The service gets its upgrade; the systems under investigation change underneath the team.", signal: "Continuity protected · Next roll harder", modifier: -1, impact: 0, continuity: 2, tempo: 0, quality: 2 },
  },
  forensics: {
    title: "An outside forensics team can start in an hour",
    prompt: "A retained incident-response firm has a team free now. Bringing them in is expensive and visible.",
    a: { title: "Engage the outside team", description: "Experienced hands for the next check; the cost and the extra people raise the temperature.", signal: "Next roll easier · Pressure rises", modifier: 2, impact: 3, continuity: 0, tempo: 0, quality: 4 },
    b: { title: "Keep the investigation in house", description: "No cost and no new faces, and the team works at the pace it has.", signal: "Faster adversary", modifier: 0, impact: 0, continuity: 0, tempo: 1, quality: 3 },
  },
  // Six more, so an act of four cases and a replay meets a beat it has not met.
  insurer: {
    title: "The insurer wants its own responders",
    prompt: "The cyber insurer will cover the response only if its approved firm takes part.",
    a: { title: "Bring in the insurer's firm", description: "The cost is covered and the board is reassured; the handover slows the next check.", signal: "Next roll harder · Pressure falls", modifier: -1, impact: -4, continuity: 0, tempo: 0, quality: 4 },
    b: { title: "Keep the current team and inform the insurer", description: "No handover, and a dispute about the bill that the board will hear about.", signal: "Pressure rises", modifier: 0, impact: 3, continuity: 0, tempo: 0, quality: 3 },
  },
  phished: {
    title: "A member of staff reports a suspicious page",
    prompt: "Someone in finance says they typed their password into a page that looked wrong, last week.",
    a: { title: "Reset their account and trace its use", description: "Their sign-ins become evidence, and they lose access for the afternoon.", signal: "Next roll easier · Service cost", modifier: 1, impact: 0, continuity: -2, tempo: 0, quality: 5 },
    b: { title: "Note it and carry on", description: "The investigation keeps its course, and an account that may be in use stays open.", signal: "Faster adversary", modifier: 0, impact: 0, continuity: 0, tempo: 1, quality: 2 },
  },
  claim: {
    title: "Someone claims responsibility",
    prompt: "A message to the press office claims responsibility for the incident and names one of your systems.",
    a: { title: "Check the named system", description: "It may be a lead or a distraction; either way the press office has questions now.", signal: "Next roll easier · Pressure rises", modifier: 1, impact: 3, continuity: 0, tempo: 0, quality: 3 },
    b: { title: "Pass it to the police and keep to the evidence", description: "The message is handled properly, and the team does not chase it.", signal: "Pressure falls · Faster adversary", modifier: 0, impact: -2, continuity: 0, tempo: 1, quality: 4 },
  },
  segment: {
    title: "The network team can cut a segment",
    prompt: "The affected part of the network can be cut off from the rest within the hour.",
    a: { title: "Cut the segment now", description: "Whatever is inside it is stranded, and so are the people who work there.", signal: "Service cost · Pressure falls", modifier: 0, impact: -3, continuity: -5, tempo: 0, quality: 4 },
    b: { title: "Leave it connected and watch it", description: "Every connection becomes evidence, and the intruder keeps its route out.", signal: "Next roll easier · Faster adversary", modifier: 1, impact: 0, continuity: 0, tempo: 1, quality: 3 },
  },
  storage: {
    title: "Log storage is nearly full",
    prompt: "The log store will start overwriting its oldest records tonight.",
    a: { title: "Buy emergency storage", description: "The records are kept, and finance wants to know why the budget moved.", signal: "Next roll easier · Pressure rises", modifier: 1, impact: 2, continuity: 0, tempo: 0, quality: 4 },
    b: { title: "Let the oldest records roll off", description: "No cost, and the start of the incident may go with them.", signal: "Next roll harder", modifier: -1, impact: 0, continuity: 0, tempo: 0, quality: 2 },
  },
  customer: {
    title: "A major customer asks for a call",
    prompt: "Your largest customer wants to hear directly what is happening and whether they are affected.",
    a: { title: "Brief them now", description: "The customer is steadier for it, and the call takes the lead analyst for an hour.", signal: "Next roll harder · Pressure falls", modifier: -1, impact: -3, continuity: 0, tempo: 0, quality: 4 },
    b: { title: "Send a written update", description: "The team keeps working, and the customer reads a short note as a brush-off.", signal: "Pressure rises", modifier: 0, impact: 3, continuity: 0, tempo: 0, quality: 3 },
  },
} as const;

// The response set is authored per incident. Containment, assurance and recovery
// each carry the sector's own constraint, so the same three-stage sequence is not
// a single fixed list: the disruption, service cost and residual risk differ with
// the sector under investigation. Ids are stable so scoring and objective
// alignment stay internally consistent across every sector.
export const responseProfiles: ResponseProfile[] = [
  {
    constraint: "Business confidence margin: isolating the shared application tier interrupts payroll and dependent workflows first.",
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
      { id: "preserve", title: "Preserve clinical support evidence", description: "Keep the forensic images taken before containment so the restored path can be verified against them.", disruption: "Moderate", confidence: "Strong", residual: "Moderate", impact: -5, continuity: -6, score: 12 },
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
      { id: "patch", title: "Patch in place behind the plant boundary", description: "The engineering boundary holds while the support estate is patched, and the independent safety system and local field readings would show a deviation that a compromised engineering path could not hide.", disruption: "Low", confidence: "Moderate", residual: "Moderate", impact: -6, continuity: 7, score: 11 },
    ],
  },
  {
    constraint: "Terminal schedule margin: capacity falls fastest late in the incident, and isolation severs partner transactions first.",
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
      { id: "patch", title: "Patch in place under manual supervision", description: "Supervision continues through the patch, checked against the independent safety system and local field readings rather than the screens the attacker may have touched.", disruption: "Low", confidence: "Moderate", residual: "Moderate", impact: -5, continuity: 7, score: 12 },
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
    containTitle: "Contain the access path", contain: "Restrict the observed path to a bounded trust scope, keeping {service} running.",
    notifyTitle: "Notify command and {owners}", notify: "Brief leadership and {owners} on confirmed facts before the next action.",
    observeCost: 7, actRelief: -13, continuityCost: -4, containRelief: -10, containCost: -3,
  },
  {
    observeTitle: "Map lateral access", observe: "Watch the movement briefly to identify reached systems and identities.",
    actTitle: "Segment the movement path", act: "Block the observed administrative route before scope is complete.",
    attributeTitle: "Attribute the movement", attribute: "Map the identities and systems touched, and compare them with the actor's established behaviour.",
    containTitle: "Contain the movement path", contain: "Segment the observed route at the nearest trust boundary, keeping {service} running.",
    notifyTitle: "Notify {owners}", notify: "Tell {owners} which systems were reached, what is confirmed and what remains uncertain.",
    observeCost: 9, actRelief: -15, continuityCost: -7, containRelief: -11, containCost: -5,
  },
  {
    observeTitle: "Capture the persistence mechanism", observe: "Preserve volatile and configuration evidence before removal.",
    actTitle: "Remove the foothold", act: "Disable the confirmed mechanism and accept reduced visibility.",
    attributeTitle: "Attribute the persistence mechanism", attribute: "Identify the mechanism, its authoring pattern and any related access before removal.",
    containTitle: "Contain the foothold", contain: "Disable the observed mechanism on a bounded set of systems, keeping {service} running.",
    notifyTitle: "Notify {owners}", notify: "Brief {owners} on the confirmed mechanism and the change window its removal needs.",
    observeCost: 8, actRelief: -14, continuityCost: -5, containRelief: -10, containCost: -4,
  },
  {
    observeTitle: "Trace the outbound channel", observe: "Collect destination and transfer evidence before blocking it.",
    actTitle: "Block the channel now", act: "Stop the confirmed connection before attribution and scope are complete.",
    attributeTitle: "Attribute the outbound channel", attribute: "Correlate destination, timing and volume to characterise the channel before blocking it.",
    containTitle: "Contain the channel", contain: "Throttle and restrict the observed channel at the boundary rather than cutting every connection {service} relies on.",
    notifyTitle: "Notify {owners} and compliance", notify: "Inform {owners} and compliance of the confirmed export path and its uncertainty.",
    observeCost: 10, actRelief: -18, continuityCost: -3, containRelief: -12, containCost: -3,
  },
];

// Who each sector briefs and what it keeps running, so the five responses read
// as this sector's call: "Notify command and service owners" was the same line
// at a hospital and a clearing house. Indexed by scenario.
export const sectorDecisionTerms: { owners: string; service: string }[] = [
  { owners: "business service owners", service: "payroll and shared applications" },
  { owners: "clinical operations", service: "patient care" },
  { owners: "plant operations", service: "generation" },
  { owners: "vessel planners", service: "cargo operations" },
  { owners: "affected tenants", service: "tenant workloads" },
  { owners: "dependent organisations", service: "the shared services" },
  { owners: "agency service leads", service: "public transactions" },
  { owners: "network operations", service: "customer traffic" },
  { owners: "plant operators", service: "water treatment" },
  { owners: "fraud operations", service: "payment settlement" },
];

// A stage's decision wording in a scenario's own terms.
export function decisionLanguageFor(scenario: number, stage: number): DecisionLanguage {
  const terms = sectorDecisionTerms[scenario] ?? sectorDecisionTerms[0];
  const fill = (text: string) => text.replaceAll("{owners}", terms.owners).replaceAll("{service}", terms.service);
  return Object.fromEntries(Object.entries(decisionLanguage[stage]).map(([key, value]) => [key, typeof value === "string" ? fill(value) : value])) as DecisionLanguage;
}

export const decisionChoices: DecisionChoice[] = ["observe", "act", "attribute", "contain", "notify"];

export const decisionTitles: Record<DecisionChoice, keyof DecisionLanguage> = { observe: "observeTitle", act: "actTitle", attribute: "attributeTitle", contain: "containTitle", notify: "notifyTitle" };

export const decisionText: Record<DecisionChoice, keyof DecisionLanguage> = { observe: "observe", act: "act", attribute: "attribute", contain: "contain", notify: "notify" };

export const scenarioProfiles: AdversaryProfileId[][] = [
  ["ghost", "broker", "sentinel", "choir"],
  ["ghost", "raider", "sentinel", "ember"],
  ["broker", "ghost", "sentinel", "lantern"],
  ["raider", "broker", "ledger", "ember"],
  ["ghost", "raider", "broker", "lantern"],
  ["broker", "ghost", "sentinel", "choir"],
  ["ghost", "broker", "ledger", "choir"],
  ["raider", "broker", "sentinel", "lantern"],
  ["broker", "raider", "sentinel", "ember"],
  ["ledger", "ghost", "broker", "choir"],
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
  "telemetry": "The records systems produce on their own about what they are doing: logs, alerts and traffic data.",
  "credential": "Anything that proves who you are to a system: a password, a key, a token or a certificate.",
  "service ticket": "A time-limited pass a network's sign-in service hands out so an account can use one particular system.",
  "TXT record": "A free-text entry in the internet's naming system; it can be abused to carry small pieces of data in and out.",
  "logon script": "A small program that runs automatically when someone signs in to a computer.",
  "delegated access": "Permission one account gives another to act on its behalf, such as reading its mailbox.",
  "unsigned payload": "A program or file with no maker's signature, so nothing vouches for where it came from.",
  "MFA": "Multi-factor authentication: a second check at sign-in, such as a phone prompt, on top of the password.",
  "federation": "An arrangement where one organisation's sign-in service is trusted by another's, so one account works across both.",
  "historian": "The database that records an industrial plant's readings over time.",
  "SaaS": "Software as a service: an application the organisation uses over the internet rather than running itself.",
  "webhook": "An address one service calls automatically to tell another that something happened.",
  "snapshot": "A point-in-time copy of a disk or system.",
  "token": "A digital pass a system issues after sign-in, so a person or program need not sign in again for every request.",
  "artefacts": "Traces a program leaves behind on a computer — files, settings and memory — that investigators can examine.",
  "API": "A way for programs to talk to a service directly, without a person clicking through screens.",
  "payload": "The part of an attack or a message that does the actual work, such as the data or code being carried.",
  "workload": "A program or job running in the cloud, usually on its own with no person at the keyboard.",
  "beaconing": "A compromised computer checking in with the intruder at regular intervals for new instructions.",
  "resolver": "The service that answers DNS lookups, turning a name into the address behind it.",
  "process ancestry": "Which program started which: the chain of parent and child programs that led to an action.",
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
  // Added with the glossary test (tests/glossary.test.ts), which finds every
  // acronym and field term in the authored text and requires an entry here.
  "VPN": "A remote-access connection that puts an outside computer onto the organisation's network as if it were inside.",
  "OT": "Operational technology: the computers that run physical equipment such as pumps, valves, cranes and power switching.",
  "OSS": "Operations support systems: the software a telecoms operator uses to set up and manage its customers' services.",
  "phishing": "A message made to look genuine so that someone opens an attachment, follows a link or gives away a password.",
  "password spraying": "Trying a few common passwords against many accounts, slowly, so that no single account locks.",
  "privilege escalation": "Gaining more access than the account or program started with, usually administrator rights.",
  "jump host": "A computer staff are meant to pass through to reach a protected network; whoever controls it can reach what it reaches.",
  "web shell": "A small file placed on a web server that lets an outsider run commands through ordinary web requests.",
  "implant": "Malicious software placed on a computer to give the intruder lasting control of it.",
  "tunnel": "A connection carried inside another, so traffic that would be blocked travels hidden in traffic that is allowed.",
  "proxy": "A computer that passes traffic on for others, so the real source and destination are hidden from each end.",
  "port forward": "Redirecting traffic arriving at one computer on to another, often to reach a network the outsider cannot reach directly.",
  "covert channel": "A way of moving data hidden inside something that looks routine, such as name lookups or web requests.",
  "dead drop": "A public place, such as a web page or post, where the intruder leaves instructions for their software to collect.",
  "service account": "An account used by a program rather than a person, often with wide access and rarely watched.",
  "scheduled task": "A job a computer runs by itself at set times; an intruder uses one to restart their software.",
  "autorun": "A setting that starts a program automatically when the computer starts or someone signs in.",
  "event subscription": "An instruction for a computer to run something whenever a particular event happens.",
  "container image": "The packaged template a cloud workload is started from; alter it and every copy starts altered.",
  "pipeline runner": "The machine that builds and deploys software automatically, using credentials that can reach many systems.",
  "sideloaded": "Installed by hand from outside the approved source, so the usual checks never saw it.",
  "segmentation": "Dividing a network so that a problem in one part cannot easily reach the others.",
  "threat hunt": "Searching for an intruder's behaviour across many sources, rather than waiting for an alert.",
  "forensic": "Careful, recorded examination of a computer's contents to establish what happened and when.",
  "identity assertion": "A signed statement from one system telling another who a user is, which the second trusts instead of checking.",
  "tenant": "One customer's separate space inside a shared cloud or managed service.",
  "foothold": "The first point of lasting access an intruder holds inside the organisation.",
};

// A name lowered for the middle of a sentence, keeping words written in
// capitals or with digits as they are: "C2 & exfiltration", "DNS review".
export function inSentence(name: string) {
  return name.split(" ").map(word => /[A-Z].*[A-Z0-9]|\d/.test(word) ? word : word.toLowerCase()).join(" ");
}

// The terms in a passage of player-facing text, marked so the interface can
// offer each one's meaning where it is read. Longer terms win over the shorter
// ones inside them ("privileged tier" before a bare match), a term may be plural
// or hyphenated ("control-plane"), and only its first use in a passage is
// marked, so a paragraph does not turn into a row of links.
export type GlossaryPart = { text: string; term?: string };
const glossaryTerms = Object.keys(plainLanguage).sort((a, b) => b.length - a.length);
const glossaryPattern = new RegExp(`\\b(${glossaryTerms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "[ -]")).join("|")})s?\\b`, "gi");
export function glossaryParts(text: string): GlossaryPart[] {
  const parts: GlossaryPart[] = [];
  const seen = new Set<string>();
  let last = 0;
  for (const match of text.matchAll(glossaryPattern)) {
    const term = glossaryTerms.find(candidate => new RegExp(`^${candidate.replace(/ /g, "[ -]")}s?$`, "i").test(match[0]));
    if (!term || seen.has(term)) continue;
    seen.add(term);
    if (match.index > last) parts.push({ text: text.slice(last, match.index) });
    parts.push({ text: match[0], term });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

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
  contain: "The observed path was restricted; the actor was warned, and the contained systems stopped showing what it does.",
  notify: "Stakeholders were aligned on confirmed facts; the actor gained tempo.",
};

// The words of these tables are a locale's to replace (lib/i18n/content/).
registerContent({ injects, adversaryProfiles, commandEvents, responseProfiles, decisionLanguage, sectorDecisionTerms, plainLanguage, meterDirection, decisionEffects });
