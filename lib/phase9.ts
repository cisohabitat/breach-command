import type { AdversaryObjectiveId } from "./command-systems";
import { registerContent } from "./i18n/content/registry.ts";
import { msg, ref, type Message } from "./i18n/message.ts";

export type CampaignRouteId = "watchtower" | "breakwater" | "common-ground" | "convergence";

export const campaignRoutes: Record<CampaignRouteId, { title: string; order: string; consequence: string; scenarios: number[] }> = {
  watchtower: { title: "Watchtower", order: "Preserve access long enough to expose the campaign architecture.", consequence: "Better intelligence, but the actor begins later missions with more objective progress.", scenarios: [1, 4, 7] },
  breakwater: { title: "Breakwater", order: "Disrupt trusted access before the campaign reaches essential services.", consequence: "Lower starting impact, but intervention costs reduce service readiness.", scenarios: [2, 3, 8] },
  "common-ground": { title: "Common Ground", order: "Coordinate partners and protect shared operational confidence.", consequence: "Service integrity starts up to 3 points higher; above full service, impact starts lower instead.", scenarios: [5, 6, 9] },
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
export type VariantTemplate = { title: string; briefing: string; impact: number; continuity: number; objective: number };
export type IncidentVariant = { id: string; title: Message; briefing: Message; modifier: Message; impact: number; continuity: number; objective: number };

// Each scenario holds seven authored operational variants. The first three are stable across releases so
// existing seeded selections keep resolving to the same variant; the rest widen the briefing space.
export const variantTemplates: VariantTemplate[][] = [
  [{ title: "Quarter-end pressure", briefing: "A reporting deadline reduces tolerance for administrative disruption.", impact: 7, continuity: -4, objective: 0 }, { title: "Privileged-access review", briefing: "A scheduled access review provides stronger identity context.", impact: 0, continuity: 0, objective: -8 }, { title: "Executive travel window", briefing: "Several privileged identities are active outside their usual locations.", impact: 5, continuity: 1, objective: 5 }, { title: "Contractor onboarding day", briefing: "A wave of new contractor accounts expands the identity baseline this morning.", impact: 0, continuity: 0, objective: 7 }, { title: "Backup verification gap", briefing: "The last verified backup is older than the recovery objective allows.", impact: 2, continuity: -6, objective: 0 }, { title: "Office move weekend", briefing: "Half the staff are working from home while the office network is rewired.", impact: 2, continuity: -5, objective: 3 }, { title: "A new security lead", briefing: "A recently hired security lead has just finished mapping the estate.", impact: -4, continuity: 0, objective: 0 }],
  [{ title: "Clinical surge", briefing: "Emergency demand is rising while support access remains uncertain.", impact: 2, continuity: -9, objective: 0 }, { title: "Downtime rehearsal", briefing: "A recent rehearsal gives clinical teams a safer fallback.", impact: 0, continuity: 7, objective: 2 }, { title: "Medical-device exception", briefing: "An unaffected legacy clinical device depends on support services that cannot be isolated without a clinical fallback.", impact: 3, continuity: -6, objective: 4 }, { title: "Locum staff rotation", briefing: "Agency clinicians are using shared logins during a busy rotation.", impact: 2, continuity: -2, objective: 5 }, { title: "Records read-only window", briefing: "A planned read-only window limits routine record changes while the incident is investigated.", impact: -2, continuity: 6, objective: 0 }, { title: "Winter pressures", briefing: "Beds are full and the emergency department is diverting ambulances.", impact: 5, continuity: -5, objective: 0 }, { title: "Recent tabletop exercise", briefing: "Clinical and IT leads rehearsed a cyber incident last month.", impact: -3, continuity: 3, objective: 0 }],
  [{ title: "Maintenance overlap", briefing: "Two suppliers are inside the remote-support window.", impact: 2, continuity: 0, objective: 9 }, { title: "Local engineering cover", briefing: "Local engineers can preserve critical support without the remote path.", impact: 0, continuity: 8, objective: 0 }, { title: "Turbine start sequence", briefing: "A scheduled generation change narrows the safe intervention window.", impact: 2, continuity: -7, objective: 4 }, { title: "Control-room handover", briefing: "A shift handover overlaps the supplier window and delays a trusted decision.", impact: 4, continuity: -2, objective: 6 }, { title: "Spare jump host online", briefing: "A validated spare jump host keeps support work off the suspect path.", impact: 0, continuity: 6, objective: -4 }, { title: "Storm restoration", briefing: "Field crews are restoring supply after a storm, and remote access is in heavy use.", impact: 2, continuity: -5, objective: 4 }, { title: "Fresh network survey", briefing: "An engineering survey of the plant network was signed off last week.", impact: 0, continuity: 0, objective: -4 }],
  [{ title: "Vessel arrival surge", briefing: "The incident coincides with a compressed terminal planning window.", impact: 5, continuity: -4, objective: 5 }, { title: "Manual manifest window", briefing: "A verified manual manifest creates a brief investigative buffer.", impact: 0, continuity: 2, objective: -7 }, { title: "Customs data mismatch", briefing: "Partner records conflict with the terminal planning picture.", impact: 4, continuity: -3, objective: 5 }, { title: "Berth schedule compression", briefing: "A berth re-plan shortens the safe window for portal changes.", impact: 3, continuity: -5, objective: 0 }, { title: "Partner feed restored", briefing: "A restored partner data feed provides a clean baseline for comparison.", impact: -3, continuity: 3, objective: -5 }, { title: "Customs system outage", briefing: "The national customs platform is down, and clearances are being handled by email.", impact: 4, continuity: -2, objective: 4 }, { title: "Quiet berth schedule", briefing: "Only two vessels are alongside, so the terminal has some slack.", impact: 0, continuity: 5, objective: 0 }],
  [{ title: "Multi-tenant alarm", briefing: "A second tenant reports a related control-plane event.", impact: 5, continuity: 0, objective: 6 }, { title: "Fresh deployment record", briefing: "A validated deployment record narrows the first evidence boundary.", impact: -5, continuity: 0, objective: 0 }, { title: "Control-plane throttling", briefing: "Emergency API limits are protecting the platform but slowing customer workflows.", impact: 4, continuity: 5, objective: 2 }, { title: "Change freeze in force", briefing: "A change freeze removes the usual explanations for new control-plane activity.", impact: 2, continuity: 0, objective: 4 }, { title: "Region failover rehearsal", briefing: "A planned regional failover is generating legitimate cross-region traffic.", impact: -3, continuity: 3, objective: 5 }, { title: "Major customer launch", briefing: "A large customer goes live on the platform today.", impact: 5, continuity: -4, objective: 0 }, { title: "Longer log retention", briefing: "Longer log retention was switched on for every account last month.", impact: 0, continuity: 0, objective: -4 }],
  [{ title: "Partner blackout", briefing: "A dependent organisation cannot provide its expected telemetry.", impact: 4, continuity: -6, objective: 0 }, { title: "Joint response cell", briefing: "Partners have opened a shared evidence channel.", impact: -4, continuity: 0, objective: -5 }, { title: "Conflicting partner advice", briefing: "Two dependent organisations propose incompatible containment boundaries.", impact: 5, continuity: -2, objective: 4 }, { title: "Trust-anchor rotation", briefing: "A scheduled certificate rotation leaves old and new credentials in use while partners migrate.", impact: 2, continuity: -3, objective: 6 }, { title: "Standby support identity", briefing: "A verified standby identity provides a clean comparison for the suspect session.", impact: -3, continuity: 2, objective: -6 }, { title: "Peering dispute", briefing: "A dispute with a peer network has left traffic on longer, busier routes.", impact: 2, continuity: -6, objective: 0 }, { title: "Partner liaison on site", briefing: "A liaison from the largest dependent organisation is in the room.", impact: -4, continuity: 2, objective: 0 }],
  [{ title: "Public demand peak", briefing: "Citizen demand is approaching its daily maximum.", impact: 3, continuity: -8, objective: 0 }, { title: "Agency coordination window", briefing: "Two agencies have aligned their change controls for one hour.", impact: -6, continuity: 2, objective: 0 }, { title: "Identity-provider degradation", briefing: "A shared login dependency is degrading while administrative trust is uncertain.", impact: 3, continuity: -6, objective: 6 }, { title: "Press enquiry", briefing: "A press enquiry forces early statements before the facts are confirmed.", impact: 5, continuity: 0, objective: 5 }, { title: "Pre-approved change window", briefing: "An out-of-hours change window gives room to act without service disruption.", impact: 0, continuity: 7, objective: -5 }, { title: "Ministerial visit", briefing: "A minister is visiting the service centre this afternoon.", impact: 7, continuity: 0, objective: 0 }, { title: "Paper fallback ready", briefing: "Paper forms for the busiest transactions were reprinted last week.", impact: 0, continuity: 6, objective: 0 }],
  [{ title: "Routing maintenance", briefing: "A planned route change creates genuine and malicious anomalies.", impact: 2, continuity: -3, objective: 8 }, { title: "Clean management path", briefing: "A recently validated management route provides a stable comparison.", impact: 0, continuity: 3, objective: -7 }, { title: "Roaming traffic surge", briefing: "A regional event is driving unusual load across neighbouring networks.", impact: 3, continuity: -7, objective: 4 }, { title: "Outage review open", briefing: "An ongoing outage review provides a verified timeline of legitimate change.", impact: -4, continuity: 2, objective: 6 }, { title: "Emergency maintenance window", briefing: "A declared emergency window allows routing changes with less service risk.", impact: -1, continuity: 6, objective: 2 }, { title: "Cup final traffic", briefing: "Mobile traffic is at its yearly peak around a cup final.", impact: 4, continuity: -5, objective: 0 }, { title: "Spare core capacity", briefing: "A new core site has just come online and can carry diverted traffic.", impact: 0, continuity: 4, objective: -2 }],
  [{ title: "Reduced operator cover", briefing: "The night shift has limited capacity for manual supervision.", impact: 2, continuity: -8, objective: 0 }, { title: "Safe-state rehearsal", briefing: "Operators have just completed a controlled safe-state rehearsal.", impact: 0, continuity: 8, objective: 0 }, { title: "Quality sensor drift", briefing: "A process sensor anomaly may be malicious activity or an equipment fault.", impact: 4, continuity: -4, objective: 5 }, { title: "Historian backfill", briefing: "A historian backfill is overwriting process records the team still needs.", impact: 1, continuity: -2, objective: 6 }, { title: "Double-staffed shift", briefing: "Extra operators are on shift to supervise a controlled intervention.", impact: 0, continuity: 7, objective: -4 }, { title: "Drought restrictions", briefing: "Supply is tight and the public is watching usage figures closely.", impact: 4, continuity: 0, objective: 3 }, { title: "Independent quality sensors", briefing: "Water-quality sensors outside the control system were fitted last month.", impact: 0, continuity: 5, objective: 0 }],
  [{ title: "Settlement compression", briefing: "The clearing window has been shortened by an upstream delay.", impact: 6, continuity: -3, objective: 6 }, { title: "Dual-control audit", briefing: "A live audit gives the team verified approval-path evidence.", impact: 0, continuity: 0, objective: -9 }, { title: "Liquidity safeguard active", briefing: "A protective threshold is slowing suspicious and legitimate approvals alike.", impact: 1, continuity: -6, objective: -5 }, { title: "Regulatory examination", briefing: "An active regulatory examination raises the evidence bar for every containment decision.", impact: 4, continuity: -2, objective: 3 }, { title: "Standby clearing path", briefing: "A validated standby clearing path lets settlement continue off the suspect systems.", impact: -5, continuity: 4, objective: -6 }, { title: "Interest rate announcement", briefing: "The central bank announces a rate change today, and payment volumes are up.", impact: 5, continuity: -4, objective: 0 }, { title: "Fraud team on alert", briefing: "The fraud team saw a similar pattern at another bank yesterday.", impact: 0, continuity: 0, objective: -5 }],
];

export function incidentVariant(scenario: number, route: CampaignRouteId, seed: number): IncidentVariant {
  const routeOffset = route === "watchtower" ? 1 : route === "breakwater" ? 2 : route === "convergence" ? 3 : 0;
  // A seed that resolved to one of the first three still does; one that
  // resolved to the fourth or fifth now spreads across the fourth to seventh.
  const base = seed + scenario + routeOffset;
  const first = ((base % 5) + 5) % 5;
  const index = first < 3 ? first : 3 + ((Math.floor(base / 5) % 4) + 4) % 4;
  const template = variantTemplates[scenario][index];
  const words = (field: "title" | "briefing") => ref(`variantTemplates.${scenario}.${index}.${field}`);
  return { id: `${scenario}-${index}`, title: words("title"), briefing: words("briefing"), modifier: variantModifier(template), impact: template.impact, continuity: template.continuity, objective: template.objective };
}

// What a variant does to the starting readouts, in words, from its numbers.
// Seventy authored copies of these sentences were 9 kB of the first load, and
// one of them said the opposite of its number.
// An operation from before rules version 2 kept service at full instead.
export function variantModifier(variant: { impact: number; continuity: number; objective: number }, legacyRules = false): Message {
  const part = (meter: "impact" | "continuity" | "objective") => variant[meter] ? msg("engine.variant.part", { meter: msg(`engine.variant.${meter}`), count: Math.abs(variant[meter]), direction: msg(variant[meter] > 0 ? "engine.variant.higher" : "engine.variant.lower") }) : null;
  // Service starts at full, so a rise above it comes off starting impact.
  const parts = [part("impact"), part("continuity"), variant.continuity > 0 && !legacyRules ? msg("engine.variant.surplus") : null, part("objective")].filter((item): item is Message => !!item);
  return parts.length ? parts.reduceRight((rest, first) => msg("engine.variant.join", { first, rest })) : msg("engine.variant.standardModifier");
}

// Saves from version 19 to 22 refer to the authored sentence by its path.
export const variantModifierRef = /^variantTemplates\.\d+\.\d+\.modifier$/;

export const objectiveTheory: Record<AdversaryObjectiveId, { title: string; question: string }> = {
  exfiltration: { title: "Data theft", question: "Is the actor assembling a path to stage and remove protected information?" },
  disruption: { title: "Service disruption", question: "Is the actor positioning to interrupt the essential service?" },
  fraud: { title: "Financial manipulation", question: "Is the actor seeking trusted approvals or transaction control?" },
  espionage: { title: "Long-term collection", question: "Is durable low-noise access more valuable than immediate effect?" },
  preposition: { title: "Strategic pre-positioning", question: "Is the actor mapping dependencies for a later operation?" },
};

// The words of these tables are a locale's to replace (lib/i18n/content/).
registerContent({ campaignRoutes, objectiveTheory, variantTemplates });
