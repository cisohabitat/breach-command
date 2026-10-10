import type { AdversaryObjectiveId, SpecialistId } from "./command-systems";
import { registerContent } from "./i18n/content/registry.ts";
import { lit, msg, ref, type Message } from "./i18n/message.ts";

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

// Why the campaign is on its route, in the terms routeForCampaign reads. The
// route changed from Common Ground to Breakwater with nothing saying why.
export function routeReason(state: { completed: number[]; commandPosture: { observe: number; act: number }; leadershipTrust: number }): Message {
  const route = routeForCampaign(state);
  const { observe, act } = state.commandPosture;
  if (route === "convergence") return msg("engine.campaign.routeConvergence");
  if (state.completed.length < 2) return msg("engine.campaign.routeEarly");
  if (route === "watchtower") return msg("engine.campaign.routeWatchtower", { observe, act });
  if (route === "breakwater" && act > observe + 1) return msg("engine.campaign.routeBreakwaterAct", { observe, act });
  if (route === "breakwater") return msg("engine.campaign.routeBreakwaterTrust", { trust: state.leadershipTrust });
  return msg("engine.campaign.routeCommonGround", { trust: state.leadershipTrust });
}

// An operation's variant: its numbers, and its words as references to the
// template they came from (session version 19; copied text before).
export type VariantTemplate = { title: string; briefing: string; modifier: string; impact: number; continuity: number; objective: number };
export type IncidentVariant = { id: string; title: Message; briefing: Message; modifier: Message; impact: number; continuity: number; objective: number };

// Each scenario holds seven authored operational variants. The first three are stable across releases so
// existing seeded selections keep resolving to the same variant; the rest widen the briefing space.
export const variantTemplates: VariantTemplate[][] = [
  [{ title: "Quarter-end pressure", briefing: "A reporting deadline reduces tolerance for administrative disruption.", modifier: "Impact begins higher; continuity is protected.", impact: 7, continuity: 4, objective: 0 }, { title: "Privileged-access review", briefing: "A scheduled access review provides stronger identity context.", modifier: "Actor progress begins lower.", impact: 0, continuity: 0, objective: -8 }, { title: "Executive travel window", briefing: "Several privileged identities are active outside their usual locations.", modifier: "Identity uncertainty and business pressure begin higher.", impact: 5, continuity: 1, objective: 5 }, { title: "Contractor onboarding day", briefing: "A wave of new contractor accounts expands the identity baseline this morning.", modifier: "Attribution is harder; actor progress begins higher.", impact: 0, continuity: 0, objective: 7 }, { title: "Backup verification gap", briefing: "The last verified backup is older than the recovery objective allows.", modifier: "Recovery confidence and continuity begin lower.", impact: 2, continuity: -6, objective: 0 }, { title: "Office move weekend", briefing: "Half the staff are working from home while the office network is rewired.", modifier: "Continuity begins under pressure; actor progress begins higher.", impact: 2, continuity: -5, objective: 3 }, { title: "A new security lead", briefing: "A recently hired security lead has just finished mapping the estate.", modifier: "Business impact begins lower.", impact: -4, continuity: 0, objective: 0 }],
  [{ title: "Clinical surge", briefing: "Emergency demand is rising while support access remains uncertain.", modifier: "Continuity begins under pressure.", impact: 2, continuity: -9, objective: 0 }, { title: "Downtime rehearsal", briefing: "A recent rehearsal gives clinical teams a safer fallback.", modifier: "Continuity starts stronger.", impact: 0, continuity: 7, objective: 2 }, { title: "Medical-device exception", briefing: "A legacy clinical device cannot accept the normal isolation control.", modifier: "Service margin and containment flexibility begin lower.", impact: 3, continuity: -6, objective: 4 }, { title: "Locum staff rotation", briefing: "Agency clinicians are using shared logins during a busy rotation.", modifier: "Identity ambiguity begins higher.", impact: 2, continuity: -2, objective: 5 }, { title: "Records read-only window", briefing: "A planned read-only window protects the records but slows investigative access.", modifier: "Continuity is protected; evidence collection begins slower.", impact: -2, continuity: 6, objective: 0 }, { title: "Winter pressures", briefing: "Beds are full and the emergency department is diverting ambulances.", modifier: "Impact begins higher; continuity begins under pressure.", impact: 5, continuity: -5, objective: 0 }, { title: "Recent tabletop exercise", briefing: "Clinical and IT leads rehearsed a cyber incident last month.", modifier: "Impact begins lower; continuity starts stronger.", impact: -3, continuity: 3, objective: 0 }],
  [{ title: "Maintenance overlap", briefing: "Two suppliers are inside the remote-support window.", modifier: "Actor progress begins higher.", impact: 2, continuity: 0, objective: 9 }, { title: "Local engineering cover", briefing: "Local engineers can preserve critical support without the remote path.", modifier: "Service margin starts stronger.", impact: 0, continuity: 8, objective: 0 }, { title: "Turbine start sequence", briefing: "A scheduled generation change narrows the safe intervention window.", modifier: "Continuity and engineering margin begin under pressure.", impact: 2, continuity: -7, objective: 4 }, { title: "Control-room handover", briefing: "A shift handover overlaps the supplier window and delays a trusted decision.", modifier: "Decision latency raises impact; actor progress begins higher.", impact: 4, continuity: -2, objective: 6 }, { title: "Spare jump host online", briefing: "A validated spare jump host keeps support work off the suspect path.", modifier: "Continuity and containment flexibility begin stronger.", impact: 0, continuity: 6, objective: -4 }, { title: "Storm restoration", briefing: "Field crews are restoring supply after a storm, and remote access is in heavy use.", modifier: "Continuity begins under pressure; actor progress begins higher.", impact: 2, continuity: -5, objective: 4 }, { title: "Fresh network survey", briefing: "An engineering survey of the plant network was signed off last week.", modifier: "Actor progress begins lower.", impact: 0, continuity: 0, objective: -4 }],
  [{ title: "Vessel arrival surge", briefing: "The incident coincides with a compressed terminal planning window.", modifier: "Impact and objective pressure begin higher.", impact: 5, continuity: -4, objective: 5 }, { title: "Manual manifest window", briefing: "A verified manual manifest creates a brief investigative buffer.", modifier: "Actor progress starts lower.", impact: 0, continuity: 2, objective: -7 }, { title: "Customs data mismatch", briefing: "Partner records conflict with the terminal planning picture.", modifier: "Evidence ambiguity and operating pressure begin higher.", impact: 4, continuity: -3, objective: 5 }, { title: "Berth schedule compression", briefing: "A berth re-plan shortens the safe window for portal changes.", modifier: "Continuity and service margin begin under pressure.", impact: 3, continuity: -5, objective: 0 }, { title: "Partner feed restored", briefing: "A restored partner data feed provides a clean baseline for comparison.", modifier: "Impact and actor progress begin lower.", impact: -3, continuity: 3, objective: -5 }, { title: "Customs system outage", briefing: "The national customs platform is down, and clearances are being handled by email.", modifier: "Impact and actor progress begin higher.", impact: 4, continuity: -2, objective: 4 }, { title: "Quiet berth schedule", briefing: "Only two vessels are alongside, so the terminal has some slack.", modifier: "Continuity starts stronger.", impact: 0, continuity: 5, objective: 0 }],
  [{ title: "Multi-tenant alarm", briefing: "A second tenant reports a related control-plane event.", modifier: "Scope pressure begins higher.", impact: 5, continuity: 0, objective: 6 }, { title: "Fresh deployment record", briefing: "A validated deployment record narrows the first evidence boundary.", modifier: "Business impact begins lower.", impact: -5, continuity: 0, objective: 0 }, { title: "Control-plane throttling", briefing: "Emergency API limits are protecting the platform but slowing evidence collection.", modifier: "Continuity is protected while impact begins higher.", impact: 4, continuity: 5, objective: 2 }, { title: "Change freeze in force", briefing: "A change freeze removes the usual explanations for new control-plane activity.", modifier: "Attribution and scope pressure begin higher.", impact: 2, continuity: 0, objective: 4 }, { title: "Region failover rehearsal", briefing: "A planned regional failover is generating legitimate cross-region traffic.", modifier: "Evidence ambiguity begins higher; impact begins lower.", impact: -3, continuity: 3, objective: 5 }, { title: "Major customer launch", briefing: "A large customer goes live on the platform today.", modifier: "Impact begins higher; continuity begins under pressure.", impact: 5, continuity: -4, objective: 0 }, { title: "Longer log retention", briefing: "Longer log retention was switched on for every account last month.", modifier: "Actor progress begins lower.", impact: 0, continuity: 0, objective: -4 }],
  [{ title: "Partner blackout", briefing: "A dependent organisation cannot provide its expected telemetry.", modifier: "Confidence and continuity begin lower.", impact: 4, continuity: -6, objective: 0 }, { title: "Joint response cell", briefing: "Partners have opened a shared evidence channel.", modifier: "Impact and objective pressure begin lower.", impact: -4, continuity: 0, objective: -5 }, { title: "Conflicting partner advice", briefing: "Two dependent organisations propose incompatible containment boundaries.", modifier: "Coordination pressure begins higher.", impact: 5, continuity: -2, objective: 4 }, { title: "Trust-anchor rotation", briefing: "A scheduled certificate rotation is invalidating evidence of legitimate access.", modifier: "Confirmed identity evidence begins weaker.", impact: 2, continuity: -3, objective: 6 }, { title: "Standby support identity", briefing: "A verified standby identity provides a clean comparison for the suspect session.", modifier: "Impact and actor progress start lower.", impact: -3, continuity: 2, objective: -6 }, { title: "Peering dispute", briefing: "A dispute with a peer network has left traffic on longer, busier routes.", modifier: "Continuity begins under pressure.", impact: 2, continuity: -6, objective: 0 }, { title: "Partner liaison on site", briefing: "A liaison from the largest dependent organisation is in the room.", modifier: "Impact begins lower.", impact: -4, continuity: 2, objective: 0 }],
  [{ title: "Public demand peak", briefing: "Citizen demand is approaching its daily maximum.", modifier: "Continuity begins under pressure.", impact: 3, continuity: -8, objective: 0 }, { title: "Agency coordination window", briefing: "Two agencies have aligned their change controls for one hour.", modifier: "Business impact starts lower.", impact: -6, continuity: 2, objective: 0 }, { title: "Identity-provider degradation", briefing: "A shared login dependency is degrading while administrative trust is uncertain.", modifier: "Service and objective pressure begin higher.", impact: 3, continuity: -6, objective: 6 }, { title: "Press enquiry", briefing: "A press enquiry forces early statements before the facts are confirmed.", modifier: "Impact and attribution pressure begin higher.", impact: 5, continuity: 0, objective: 5 }, { title: "Pre-approved change window", briefing: "An out-of-hours change window gives room to act without service disruption.", modifier: "Service margin starts stronger; actor progress begins lower.", impact: 0, continuity: 7, objective: -5 }, { title: "Ministerial visit", briefing: "A minister is visiting the service centre this afternoon.", modifier: "Impact begins higher.", impact: 7, continuity: 0, objective: 0 }, { title: "Paper fallback ready", briefing: "Paper forms for the busiest transactions were reprinted last week.", modifier: "Continuity starts stronger.", impact: 0, continuity: 6, objective: 0 }],
  [{ title: "Routing maintenance", briefing: "A planned route change creates genuine and malicious anomalies.", modifier: "Actor progress begins higher.", impact: 2, continuity: -3, objective: 8 }, { title: "Clean management path", briefing: "A recently validated management route provides a stable comparison.", modifier: "Objective pressure starts lower.", impact: 0, continuity: 3, objective: -7 }, { title: "Roaming traffic surge", briefing: "A regional event is driving unusual load across neighbouring networks.", modifier: "Continuity and attribution begin under pressure.", impact: 3, continuity: -7, objective: 4 }, { title: "Outage review open", briefing: "An ongoing outage review provides a verified timeline of legitimate change.", modifier: "Business impact begins lower; actor progress begins higher.", impact: -4, continuity: 2, objective: 6 }, { title: "Emergency maintenance window", briefing: "A declared emergency window allows routing changes with less service risk.", modifier: "Continuity and containment options begin stronger.", impact: -1, continuity: 6, objective: 2 }, { title: "Cup final traffic", briefing: "Mobile traffic is at its yearly peak around a cup final.", modifier: "Impact begins higher; continuity begins under pressure.", impact: 4, continuity: -5, objective: 0 }, { title: "Spare core capacity", briefing: "A new core site has just come online and can carry diverted traffic.", modifier: "Continuity starts stronger; actor progress begins lower.", impact: 0, continuity: 4, objective: -2 }],
  [{ title: "Reduced operator cover", briefing: "The night shift has limited capacity for manual supervision.", modifier: "Service margin begins lower.", impact: 2, continuity: -8, objective: 0 }, { title: "Safe-state rehearsal", briefing: "Operators have just completed a controlled safe-state rehearsal.", modifier: "Continuity begins stronger.", impact: 0, continuity: 8, objective: 0 }, { title: "Quality sensor drift", briefing: "A process sensor anomaly may be malicious activity or an equipment fault.", modifier: "Operational uncertainty begins higher.", impact: 4, continuity: -4, objective: 5 }, { title: "Historian backfill", briefing: "A historian backfill is overwriting process records the team still needs.", modifier: "Evidence integrity begins weaker; actor progress begins higher.", impact: 1, continuity: -2, objective: 6 }, { title: "Double-staffed shift", briefing: "Extra operators are on shift to supervise a controlled intervention.", modifier: "Service margin and continuity begin stronger.", impact: 0, continuity: 7, objective: -4 }, { title: "Drought restrictions", briefing: "Supply is tight and the public is watching usage figures closely.", modifier: "Impact and actor progress begin higher.", impact: 4, continuity: 0, objective: 3 }, { title: "Independent quality sensors", briefing: "Water-quality sensors outside the control system were fitted last month.", modifier: "Continuity starts stronger.", impact: 0, continuity: 5, objective: 0 }],
  [{ title: "Settlement compression", briefing: "The clearing window has been shortened by an upstream delay.", modifier: "Impact and fraud pressure begin higher.", impact: 6, continuity: -3, objective: 6 }, { title: "Dual-control audit", briefing: "A live audit gives the team verified approval-path evidence.", modifier: "Actor progress starts lower.", impact: 0, continuity: 0, objective: -9 }, { title: "Liquidity safeguard active", briefing: "A protective threshold is slowing suspicious and legitimate approvals alike.", modifier: "Continuity begins lower while actor progress is constrained.", impact: 1, continuity: -6, objective: -5 }, { title: "Regulatory examination", briefing: "An active regulatory examination raises the evidence bar for every containment decision.", modifier: "Impact begins higher and continuity changes face more scrutiny.", impact: 4, continuity: -2, objective: 3 }, { title: "Standby clearing path", briefing: "A validated standby clearing path lets settlement continue off the suspect systems.", modifier: "Impact and actor progress begin lower.", impact: -5, continuity: 4, objective: -6 }, { title: "Interest rate announcement", briefing: "The central bank announces a rate change today, and payment volumes are up.", modifier: "Impact begins higher; continuity begins under pressure.", impact: 5, continuity: -4, objective: 0 }, { title: "Fraud team on alert", briefing: "The fraud team saw a similar pattern at another bank yesterday.", modifier: "Actor progress begins lower.", impact: 0, continuity: 0, objective: -5 }],
];

export function incidentVariant(scenario: number, route: CampaignRouteId, seed: number): IncidentVariant {
  const routeOffset = route === "watchtower" ? 1 : route === "breakwater" ? 2 : route === "convergence" ? 3 : 0;
  // A seed that resolved to one of the first three still does; one that
  // resolved to the fourth or fifth now spreads across the fourth to seventh.
  const base = seed + scenario + routeOffset;
  const first = ((base % 5) + 5) % 5;
  const index = first < 3 ? first : 3 + ((Math.floor(base / 5) % 4) + 4) % 4;
  const template = variantTemplates[scenario][index];
  const words = (field: "title" | "briefing" | "modifier") => ref(`variantTemplates.${scenario}.${index}.${field}`);
  return { id: `${scenario}-${index}`, title: words("title"), briefing: words("briefing"), modifier: words("modifier"), impact: template.impact, continuity: template.continuity, objective: template.objective };
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

export function specialistReaction(id: SpecialistId, won: boolean, score: number, bond: number): Message {
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
  return msg("engine.campaign.reaction", { name, line: lit(lines[index]) });
}

// Each specialist develops across a campaign as rapport grows: a request, then
// a disagreement, then a change of role. Rapport rises with every operation
// they are deployed on, so a team kept together becomes a cast.
export const ARC_THRESHOLDS = [50, 65, 80] as const;
const specialistArcs: Record<SpecialistId, [string, string, string]> = {
  hunter: [
    "Maya asks for an hour a week to hunt without an alert to chase. She thinks the quiet cases are the ones being missed.",
    "Maya disagrees with the last call: she would have kept watching one turn longer. She says so in the review, not in the room.",
    "Maya now runs the hunt rota for the whole team. New analysts shadow her first.",
  ],
  forensics: [
    "Elias asks for a second evidence store. The current one is full of cases nobody has closed.",
    "Elias pushes back on speed: he would rather lose a turn than lose an artefact, and he wants that written into the plan.",
    "Elias has been asked to train the regional teams on evidence handling. He agreed on condition the course uses a real case.",
  ],
  identity: [
    "Noor asks for authority to suspend a privileged account without waiting for its owner. She has had to wait twice.",
    "Noor disagrees with how approvals were handled: two people signed, and neither checked. She wants it fixed before the next case.",
    "Noor now owns the privileged access review. The first thing she did was remove her own standing access.",
  ],
  ot: [
    "Daniel asks for a seat at the plant's shift briefings. He says the operators notice things the logs do not.",
    "Daniel objects to the last containment: right for the network, wrong for the plant. He wants operations to sign off the next one.",
    "Daniel has moved to a joint role between engineering and security. The operators asked for him by name.",
  ],
  continuity: [
    "Sofia asks for the fallback plans to be tested with real staff, not on paper.",
    "Sofia disagrees with the cost the team accepted last time: the service paid it, and nobody asked the service.",
    "Sofia now chairs the resilience board. Every response plan crosses her desk before it is approved.",
  ],
  communications: [
    "Marcus asks to be in the room for the first hour, not briefed after it.",
    "Marcus pushes back on a holding statement he was asked to sign: it said more than the team knew. He rewrote it.",
    "Marcus has become the organisation's incident spokesperson. Reporters now ask for him rather than the press office.",
  ],
};

export function specialistArc(id: SpecialistId, bond: number): string | null {
  const reached = ARC_THRESHOLDS.filter(threshold => bond >= threshold).length;
  return reached ? specialistArcs[id][reached - 1] : null;
}

// The words of these tables are a locale's to replace (lib/i18n/content/).
registerContent({ campaignRoutes, objectiveTheory, variantTemplates, specialistReactions, specialistArcs });
