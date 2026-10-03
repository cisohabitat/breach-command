import type { AdversaryObjectiveId, SpecialistId } from "./command-systems";

export type CampaignRouteId = "watchtower" | "breakwater" | "common-ground" | "convergence";

export const campaignRoutes: Record<CampaignRouteId, { title: string; order: string; consequence: string; scenarios: number[] }> = {
  watchtower: { title: "Watchtower", order: "Preserve access long enough to expose the campaign architecture.", consequence: "Better intelligence, but the actor begins later missions with more objective progress.", scenarios: [1, 4, 7] },
  breakwater: { title: "Breakwater", order: "Disrupt trusted access before the campaign reaches essential services.", consequence: "Lower starting impact, but intervention costs reduce service readiness.", scenarios: [2, 3, 8] },
  "common-ground": { title: "Common Ground", order: "Coordinate partners and protect shared operational confidence.", consequence: "Specialists recover faster and leadership trust matters more.", scenarios: [5, 6, 9] },
  convergence: { title: "Convergence", order: "Bring every confirmed thread into a single final operating picture.", consequence: "The ending now reflects route, team cohesion and unresolved access.", scenarios: [7, 8, 9] },
};

export function routeForCampaign(state: { completed: number[]; commandPosture: { observe: number; act: number }; leadershipTrust: number }): CampaignRouteId {
  if (state.completed.length >= 7) return "convergence";
  if (state.completed.length < 2) return "common-ground";
  if (state.commandPosture.observe > state.commandPosture.act + 1) return "watchtower";
  if (state.commandPosture.act > state.commandPosture.observe + 1) return "breakwater";
  return state.leadershipTrust >= 55 ? "common-ground" : "breakwater";
}

export type IncidentVariant = { id: string; title: string; briefing: string; modifier: string; impact: number; continuity: number; objective: number };

// Each scenario holds five authored operational variants. The first three are stable across releases so
// existing seeded selections keep resolving to the same variant; the last two widen the briefing space.
const variantTemplates: Omit<IncidentVariant, "id">[][] = [
  [{ title: "Quarter-end pressure", briefing: "A reporting deadline reduces tolerance for administrative disruption.", modifier: "Impact begins higher; continuity is protected.", impact: 7, continuity: 4, objective: 0 }, { title: "Privileged-access review", briefing: "A scheduled access review provides stronger identity context.", modifier: "Actor progress begins lower.", impact: 0, continuity: 0, objective: -8 }, { title: "Executive travel window", briefing: "Several privileged identities are active outside their usual locations.", modifier: "Identity uncertainty and business pressure begin higher.", impact: 5, continuity: 1, objective: 5 }, { title: "Contractor onboarding day", briefing: "A wave of new contractor accounts expands the identity baseline this morning.", modifier: "Attribution is harder; actor progress begins higher.", impact: 0, continuity: 0, objective: 7 }, { title: "Backup verification gap", briefing: "The last verified backup is older than the recovery objective allows.", modifier: "Recovery confidence and continuity begin lower.", impact: 2, continuity: -6, objective: 0 }],
  [{ title: "Clinical surge", briefing: "Emergency demand is rising while support access remains uncertain.", modifier: "Continuity begins under pressure.", impact: 2, continuity: -9, objective: 0 }, { title: "Downtime rehearsal", briefing: "A recent rehearsal gives clinical teams a safer fallback.", modifier: "Continuity starts stronger.", impact: 0, continuity: 7, objective: 2 }, { title: "Medical-device exception", briefing: "A legacy clinical device cannot accept the normal isolation control.", modifier: "Service margin and containment flexibility begin lower.", impact: 3, continuity: -6, objective: 4 }, { title: "Locum staff rotation", briefing: "Agency clinicians are using shared logins during a busy rotation.", modifier: "Identity ambiguity begins higher.", impact: 2, continuity: -2, objective: 5 }, { title: "Records read-only window", briefing: "A planned read-only window protects the records but slows investigative access.", modifier: "Continuity is protected; evidence collection begins slower.", impact: -2, continuity: 6, objective: 0 }],
  [{ title: "Maintenance overlap", briefing: "Two suppliers are inside the remote-support window.", modifier: "Actor progress begins higher.", impact: 2, continuity: 0, objective: 9 }, { title: "Local engineering cover", briefing: "Local engineers can preserve critical support without the remote path.", modifier: "Service margin starts stronger.", impact: 0, continuity: 8, objective: 0 }, { title: "Turbine start sequence", briefing: "A scheduled generation change narrows the safe intervention window.", modifier: "Continuity and engineering margin begin under pressure.", impact: 2, continuity: -7, objective: 4 }, { title: "Control-room handover", briefing: "A shift handover overlaps the supplier window and delays a trusted decision.", modifier: "Decision latency raises impact; actor progress begins higher.", impact: 4, continuity: -2, objective: 6 }, { title: "Spare jump host online", briefing: "A validated spare jump host keeps support work off the suspect path.", modifier: "Continuity and containment flexibility begin stronger.", impact: 0, continuity: 6, objective: -4 }],
  [{ title: "Vessel arrival surge", briefing: "The incident coincides with a compressed terminal planning window.", modifier: "Impact and objective pressure begin higher.", impact: 5, continuity: -4, objective: 5 }, { title: "Manual manifest window", briefing: "A verified manual manifest creates a brief investigative buffer.", modifier: "Actor progress starts lower.", impact: 0, continuity: 2, objective: -7 }, { title: "Customs data mismatch", briefing: "Partner records conflict with the terminal planning picture.", modifier: "Evidence ambiguity and operating pressure begin higher.", impact: 4, continuity: -3, objective: 5 }, { title: "Berth schedule compression", briefing: "A berth re-plan shortens the safe window for portal changes.", modifier: "Continuity and service margin begin under pressure.", impact: 3, continuity: -5, objective: 0 }, { title: "Partner feed restored", briefing: "A restored partner data feed provides a clean baseline for comparison.", modifier: "Impact and actor progress begin lower.", impact: -3, continuity: 3, objective: -5 }],
  [{ title: "Multi-tenant alarm", briefing: "A second tenant reports a related control-plane event.", modifier: "Scope pressure begins higher.", impact: 5, continuity: 0, objective: 6 }, { title: "Fresh deployment record", briefing: "A validated deployment record narrows the first evidence boundary.", modifier: "Business impact begins lower.", impact: -5, continuity: 0, objective: 0 }, { title: "Control-plane throttling", briefing: "Emergency API limits are protecting the platform but slowing evidence collection.", modifier: "Continuity is protected while impact begins higher.", impact: 4, continuity: 5, objective: 2 }, { title: "Change freeze in force", briefing: "A change freeze removes the usual explanations for new control-plane activity.", modifier: "Attribution and scope pressure begin higher.", impact: 2, continuity: 0, objective: 4 }, { title: "Region failover rehearsal", briefing: "A planned regional failover is generating legitimate cross-region traffic.", modifier: "Evidence ambiguity begins higher; impact begins lower.", impact: -3, continuity: 3, objective: 5 }],
  [{ title: "Partner blackout", briefing: "A dependent organisation cannot provide its expected telemetry.", modifier: "Confidence and continuity begin lower.", impact: 4, continuity: -6, objective: 0 }, { title: "Joint response cell", briefing: "Partners have opened a shared evidence channel.", modifier: "Impact and objective pressure begin lower.", impact: -4, continuity: 0, objective: -5 }, { title: "Conflicting partner advice", briefing: "Two dependent organisations propose incompatible containment boundaries.", modifier: "Coordination pressure begins higher.", impact: 5, continuity: -2, objective: 4 }, { title: "Trust-anchor rotation", briefing: "A scheduled certificate rotation is invalidating evidence of legitimate access.", modifier: "Confirmed identity evidence begins weaker.", impact: 2, continuity: -3, objective: 6 }, { title: "Standby support identity", briefing: "A verified standby identity provides a clean comparison for the suspect session.", modifier: "Impact and actor progress start lower.", impact: -3, continuity: 2, objective: -6 }],
  [{ title: "Public demand peak", briefing: "Citizen demand is approaching its daily maximum.", modifier: "Continuity begins under pressure.", impact: 3, continuity: -8, objective: 0 }, { title: "Agency coordination window", briefing: "Two agencies have aligned their change controls for one hour.", modifier: "Business impact starts lower.", impact: -6, continuity: 2, objective: 0 }, { title: "Identity-provider degradation", briefing: "A shared login dependency is degrading while administrative trust is uncertain.", modifier: "Service and objective pressure begin higher.", impact: 3, continuity: -6, objective: 6 }, { title: "Press enquiry", briefing: "A press enquiry forces early statements before the facts are confirmed.", modifier: "Impact and attribution pressure begin higher.", impact: 5, continuity: 0, objective: 5 }, { title: "Pre-approved change window", briefing: "An out-of-hours change window gives room to act without service disruption.", modifier: "Service margin starts stronger; actor progress begins lower.", impact: 0, continuity: 7, objective: -5 }],
  [{ title: "Routing maintenance", briefing: "A planned route change creates genuine and malicious anomalies.", modifier: "Actor progress begins higher.", impact: 2, continuity: -3, objective: 8 }, { title: "Clean management path", briefing: "A recently validated management route provides a stable comparison.", modifier: "Objective pressure starts lower.", impact: 0, continuity: 3, objective: -7 }, { title: "Roaming traffic surge", briefing: "A regional event is driving unusual load across neighbouring networks.", modifier: "Continuity and attribution begin under pressure.", impact: 3, continuity: -7, objective: 4 }, { title: "Outage review open", briefing: "An ongoing outage review provides a verified timeline of legitimate change.", modifier: "Business impact begins lower; actor progress begins higher.", impact: -4, continuity: 2, objective: 6 }, { title: "Emergency maintenance window", briefing: "A declared emergency window allows routing changes with less service risk.", modifier: "Continuity and containment options begin stronger.", impact: -1, continuity: 6, objective: 2 }],
  [{ title: "Reduced operator cover", briefing: "The night shift has limited capacity for manual supervision.", modifier: "Service margin begins lower.", impact: 2, continuity: -8, objective: 0 }, { title: "Safe-state rehearsal", briefing: "Operators have just completed a controlled safe-state rehearsal.", modifier: "Continuity begins stronger.", impact: 0, continuity: 8, objective: 0 }, { title: "Quality sensor drift", briefing: "A process sensor anomaly may be malicious activity or an equipment fault.", modifier: "Operational uncertainty begins higher.", impact: 4, continuity: -4, objective: 5 }, { title: "Historian backfill", briefing: "A historian backfill is overwriting process records the team still needs.", modifier: "Evidence integrity begins weaker; actor progress begins higher.", impact: 1, continuity: -2, objective: 6 }, { title: "Double-staffed shift", briefing: "Extra operators are on shift to supervise a controlled intervention.", modifier: "Service margin and continuity begin stronger.", impact: 0, continuity: 7, objective: -4 }],
  [{ title: "Settlement compression", briefing: "The clearing window has been shortened by an upstream delay.", modifier: "Impact and fraud pressure begin higher.", impact: 6, continuity: -3, objective: 6 }, { title: "Dual-control audit", briefing: "A live audit gives the team verified approval-path evidence.", modifier: "Actor progress starts lower.", impact: 0, continuity: 0, objective: -9 }, { title: "Liquidity safeguard active", briefing: "A protective threshold is slowing suspicious and legitimate approvals alike.", modifier: "Continuity begins lower while actor progress is constrained.", impact: 1, continuity: -6, objective: -5 }, { title: "Regulatory examination", briefing: "An active regulatory examination raises the evidence bar for every containment decision.", modifier: "Impact begins higher and continuity changes face more scrutiny.", impact: 4, continuity: -2, objective: 3 }, { title: "Standby clearing path", briefing: "A validated standby clearing path lets settlement continue off the suspect systems.", modifier: "Impact and actor progress begin lower.", impact: -5, continuity: 4, objective: -6 }],
];

export function incidentVariant(scenario: number, route: CampaignRouteId, seed: number): IncidentVariant {
  const routeOffset = route === "watchtower" ? 1 : route === "breakwater" ? 2 : route === "convergence" ? 3 : 0;
  const index = (((seed + scenario + routeOffset) % 5) + 5) % 5;
  return { ...variantTemplates[scenario][index], id: `${scenario}-${index}` };
}

export const objectiveTheory: Record<AdversaryObjectiveId, { title: string; question: string }> = {
  exfiltration: { title: "Data theft", question: "Is the actor assembling a path to stage and remove protected information?" },
  disruption: { title: "Service disruption", question: "Is the actor positioning to interrupt the essential service?" },
  fraud: { title: "Financial manipulation", question: "Is the actor seeking trusted approvals or transaction control?" },
  espionage: { title: "Long-term collection", question: "Is durable low-noise access more valuable than immediate effect?" },
  preposition: { title: "Strategic pre-positioning", question: "Is the actor mapping dependencies for a later operation?" },
};

const specialistNames: Record<SpecialistId, string> = {
  hunter: "Maya",
  forensics: "Elias",
  identity: "Noor",
  ot: "Daniel",
  continuity: "Sofia",
  communications: "Marcus",
};

type ReactionTone = "loss" | "excellent" | "strong" | "cohesive" | "steady";

// Each specialist speaks in five outcome tones. Selection is a pure function of the debrief inputs, so
// the same specialist, result, score and bond always produce the same after-action note.
const specialistReactions: Record<SpecialistId, Record<ReactionTone, string[]>> = {
  hunter: {
    loss: ["We lost the window, not the lessons. Preserve the sequence and rebuild the plan.", "The behaviour was visible; our timing was not. Keep the evidence boundary intact next run."],
    excellent: ["The team anticipated the decision points. That is repeatable command practice.", "Behaviour testing stayed ahead of the actor. Document that decision order."],
    strong: ["The evidence carried us to the chain. Tighten the correlation step and it repeats.", "We tested behaviour before assuming intent. That is the correct order."],
    cohesive: ["We held the line together. Next time we can reduce the uncertainty earlier.", "The team stayed aligned under pressure. Carry that coordination into the next incident."],
    steady: ["The service is stable. The review should focus on where our shared picture arrived late.", "We reached the answer. Look first at which signal we discounted."],
  },
  forensics: {
    loss: ["Artefacts outlived the incident; our access to them did not. Fix the capture order first.", "The loss was procedural, not evidential. Rebuild the collection sequence."],
    excellent: ["The sequence survived every action. That is disciplined evidence handling.", "We reconstructed the timeline cleanly. Keep the collection order documented."],
    strong: ["The artefact chain held. Record where it held and where it nearly broke.", "We preserved what mattered. Tighten the memory capture step."],
    cohesive: ["The team trusted the evidence over instinct. That is how reconstruction works.", "We kept the sequence intact together. Capture earlier next time."],
    steady: ["The reconstruction is defensible. Review which artefact we almost overwrote.", "The host told most of the story. Ask what we changed before we read it."],
  },
  identity: {
    loss: ["A valid credential is still not a valid action. We will prove that faster next time.", "We revoked late. The review starts with who held approval authority."],
    excellent: ["We separated identity from intent at every step. That is the standard.", "Token and action were never conflated. Keep that discipline."],
    strong: ["We questioned the credential before acting on it. That order worked.", "The trust path was clear. Document where authority slowed us down."],
    cohesive: ["We agreed on the identity boundary together. Preserve that shared reading.", "The team did not confuse access with authority. Hold that line."],
    steady: ["Trust decisions held. Examine where the identity picture arrived last.", "We got the revocation right. Ask why it needed two approvals."],
  },
  ot: {
    loss: ["We protected the process, but not the timeline. The safe response needs a rehearsed decision path.", "Operations held while the investigation slipped. Rehearse the split next time."],
    excellent: ["Safety and security stayed in step throughout. That is the result to repeat.", "We contained the support environment without disturbing the plant. Document it."],
    strong: ["The operational boundary held. Keep the safe-response sequence recorded.", "We separated cyber and process-safety decisions correctly."],
    cohesive: ["Operations and security moved together. That coordination is the lesson.", "We held the plant and the case at once. Keep that balance."],
    steady: ["The process stayed stable. Review which decision waited on an authority.", "We kept operations safe. Ask where the safe path was slowest."],
  },
  continuity: {
    loss: ["We traded availability at the wrong moment. Rehearse that trade-off deliberately.", "The service survived; the plan did not. Rebuild the continuity assumptions."],
    excellent: ["Availability and integrity stayed balanced throughout. That is the target.", "We delivered continuity without hiding the risk. Keep that judgement."],
    strong: ["Service margin held. Record where the fallback earned its place.", "We kept essential services running. Tighten the recovery sequencing."],
    cohesive: ["The team protected continuity together. Keep fallback ownership clear.", "We accepted disruption knowingly, not by accident. Hold that."],
    steady: ["The service is stable. Review where continuity was assumed rather than verified.", "We held the line on availability. Ask what that cost us in clarity."],
  },
  communications: {
    loss: ["We informed late and assumptions filled the gap. Fix the trigger, not the wording.", "The message trailed the event. Build the disclosure sequence earlier."],
    excellent: ["Statements tracked the confirmed facts precisely. That is the discipline to keep.", "We said what we knew and no more. That restraint worked."],
    strong: ["Our messaging stayed factual under pressure. Keep the confirmation step.", "We separated fact from assumption openly. That held the room together."],
    cohesive: ["The team spoke with one voice. Keep the single-source brief.", "We aligned before we spoke. That is why it held."],
    steady: ["Communication held together. Review where the first brief arrived late.", "We kept the record accurate. Ask who waited too long for an update."],
  },
};

export function specialistReaction(id: SpecialistId, won: boolean, score: number, bond: number): string {
  const name = specialistNames[id];
  const tone: ReactionTone = !won
    ? "loss"
    : score >= 88
      ? "excellent"
      : score >= 78
        ? "strong"
        : bond >= 70
          ? "cohesive"
          : "steady";
  const lines = specialistReactions[id][tone];
  const index = Math.abs(Math.round(score) * 7 + Math.round(bond) * 3) % lines.length;
  return `${name}: ${lines[index]}`;
}
