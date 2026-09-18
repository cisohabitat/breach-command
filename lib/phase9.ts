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

const variantTemplates: [Omit<IncidentVariant, "id">, Omit<IncidentVariant, "id">, Omit<IncidentVariant, "id">][] = [
  [{ title: "Quarter-end pressure", briefing: "A reporting deadline reduces tolerance for administrative disruption.", modifier: "Impact begins higher; continuity is protected.", impact: 7, continuity: 4, objective: 0 }, { title: "Privileged-access review", briefing: "A scheduled access review provides stronger identity context.", modifier: "Actor progress begins lower.", impact: 0, continuity: 0, objective: -8 }, { title: "Executive travel window", briefing: "Several privileged identities are active outside their usual locations.", modifier: "Identity uncertainty and business pressure begin higher.", impact: 5, continuity: 1, objective: 5 }],
  [{ title: "Clinical surge", briefing: "Emergency demand is rising while support access remains uncertain.", modifier: "Continuity begins under pressure.", impact: 2, continuity: -9, objective: 0 }, { title: "Downtime rehearsal", briefing: "A recent rehearsal gives clinical teams a safer fallback.", modifier: "Continuity starts stronger.", impact: 0, continuity: 7, objective: 2 }, { title: "Medical-device exception", briefing: "A legacy clinical device cannot accept the normal isolation control.", modifier: "Service margin and containment flexibility begin lower.", impact: 3, continuity: -6, objective: 4 }],
  [{ title: "Maintenance overlap", briefing: "Two suppliers are inside the remote-support window.", modifier: "Actor progress begins higher.", impact: 2, continuity: 0, objective: 9 }, { title: "Local engineering cover", briefing: "Local engineers can preserve critical support without the remote path.", modifier: "Service margin starts stronger.", impact: 0, continuity: 8, objective: 0 }, { title: "Turbine start sequence", briefing: "A scheduled generation change narrows the safe intervention window.", modifier: "Continuity and engineering margin begin under pressure.", impact: 2, continuity: -7, objective: 4 }],
  [{ title: "Vessel arrival surge", briefing: "The incident coincides with a compressed terminal planning window.", modifier: "Impact and objective pressure begin higher.", impact: 5, continuity: -4, objective: 5 }, { title: "Manual manifest window", briefing: "A verified manual manifest creates a brief investigative buffer.", modifier: "Actor progress starts lower.", impact: 0, continuity: 2, objective: -7 }, { title: "Customs data mismatch", briefing: "Partner records conflict with the terminal planning picture.", modifier: "Evidence ambiguity and operating pressure begin higher.", impact: 4, continuity: -3, objective: 5 }],
  [{ title: "Multi-tenant alarm", briefing: "A second tenant reports a related control-plane event.", modifier: "Scope pressure begins higher.", impact: 5, continuity: 0, objective: 6 }, { title: "Fresh deployment record", briefing: "A validated deployment record narrows the first evidence boundary.", modifier: "Business impact begins lower.", impact: -5, continuity: 0, objective: 0 }, { title: "Control-plane throttling", briefing: "Emergency API limits are protecting the platform but slowing evidence collection.", modifier: "Continuity is protected while impact begins higher.", impact: 4, continuity: 5, objective: 2 }],
  [{ title: "Partner blackout", briefing: "A dependent organisation cannot provide its expected telemetry.", modifier: "Confidence and continuity begin lower.", impact: 4, continuity: -6, objective: 0 }, { title: "Joint response cell", briefing: "Partners have opened a shared evidence channel.", modifier: "Impact and objective pressure begin lower.", impact: -4, continuity: 0, objective: -5 }, { title: "Conflicting partner advice", briefing: "Two dependent organisations propose incompatible containment boundaries.", modifier: "Coordination pressure begins higher.", impact: 5, continuity: -2, objective: 4 }],
  [{ title: "Public demand peak", briefing: "Citizen demand is approaching its daily maximum.", modifier: "Continuity begins under pressure.", impact: 3, continuity: -8, objective: 0 }, { title: "Agency coordination window", briefing: "Two agencies have aligned their change controls for one hour.", modifier: "Business impact starts lower.", impact: -6, continuity: 2, objective: 0 }, { title: "Identity-provider degradation", briefing: "A shared login dependency is degrading while administrative trust is uncertain.", modifier: "Service and objective pressure begin higher.", impact: 3, continuity: -6, objective: 6 }],
  [{ title: "Routing maintenance", briefing: "A planned route change creates genuine and malicious anomalies.", modifier: "Actor progress begins higher.", impact: 2, continuity: -3, objective: 8 }, { title: "Clean management path", briefing: "A recently validated management route provides a stable comparison.", modifier: "Objective pressure starts lower.", impact: 0, continuity: 3, objective: -7 }, { title: "Roaming traffic surge", briefing: "A regional event is driving unusual load across neighbouring networks.", modifier: "Continuity and attribution begin under pressure.", impact: 3, continuity: -7, objective: 4 }],
  [{ title: "Reduced operator cover", briefing: "The night shift has limited capacity for manual supervision.", modifier: "Service margin begins lower.", impact: 2, continuity: -8, objective: 0 }, { title: "Safe-state rehearsal", briefing: "Operators have just completed a controlled safe-state rehearsal.", modifier: "Continuity begins stronger.", impact: 0, continuity: 8, objective: 0 }, { title: "Quality sensor drift", briefing: "A process sensor anomaly may be malicious activity or an equipment fault.", modifier: "Operational uncertainty begins higher.", impact: 4, continuity: -4, objective: 5 }],
  [{ title: "Settlement compression", briefing: "The clearing window has been shortened by an upstream delay.", modifier: "Impact and fraud pressure begin higher.", impact: 6, continuity: -3, objective: 6 }, { title: "Dual-control audit", briefing: "A live audit gives the team verified approval-path evidence.", modifier: "Actor progress starts lower.", impact: 0, continuity: 0, objective: -9 }, { title: "Liquidity safeguard active", briefing: "A protective threshold is slowing suspicious and legitimate approvals alike.", modifier: "Continuity begins lower while actor progress is constrained.", impact: 1, continuity: -6, objective: -5 }],
];

export function incidentVariant(scenario: number, route: CampaignRouteId, seed: number): IncidentVariant {
  const routeOffset = route === "watchtower" ? 1 : route === "breakwater" ? 2 : route === "convergence" ? 2 : 0;
  const index = (seed + scenario + routeOffset) % 3;
  return { ...variantTemplates[scenario][index], id: `${scenario}-${index}` };
}

export const objectiveTheory: Record<AdversaryObjectiveId, { title: string; question: string }> = {
  exfiltration: { title: "Data theft", question: "Is the actor assembling a path to stage and remove protected information?" },
  disruption: { title: "Service disruption", question: "Is the actor positioning to interrupt the essential service?" },
  fraud: { title: "Financial manipulation", question: "Is the actor seeking trusted approvals or transaction control?" },
  espionage: { title: "Long-term collection", question: "Is durable low-noise access more valuable than immediate effect?" },
  preposition: { title: "Strategic pre-positioning", question: "Is the actor mapping dependencies for a later operation?" },
};

export function specialistReaction(id: SpecialistId, won: boolean, score: number, bond: number) {
  const name = { hunter: "Maya", forensics: "Elias", identity: "Noor", ot: "Daniel", continuity: "Sofia", communications: "Marcus" }[id];
  if (!won) return `${name}: We lost the window, not the lessons. Preserve the sequence and rebuild the plan.`;
  if (score >= 82) return `${name}: The team anticipated the decision points. That is repeatable command practice.`;
  if (bond >= 60) return `${name}: We held the line together. Next time, we can reduce the uncertainty earlier.`;
  return `${name}: The service is stable. The review should focus on where our shared picture arrived late.`;
}
