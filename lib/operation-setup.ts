import type { GameMode, SpecialistId } from "./command-systems.ts";
import { campaignTier, defaultCampaign, type CampaignState } from "./campaign.ts";
import { incidentVariant, routeForCampaign } from "./phase9.ts";
import type { GameSetup } from "./advanced-game.ts";

// A shared code carries no campaign record. Its resources, fatigue, doctrine
// and variant come from the same neutral command on every device.
export function operationCampaign(campaign: CampaignState, reproducible: boolean) {
  return reproducible ? defaultCampaign : campaign;
}

export function operationSetup(scenario: number, mode: GameMode, specialist: SpecialistId, seed: number, reproducible: boolean, campaign: CampaignState, replay?: Pick<GameSetup, "variant" | "campaignRoute">): GameSetup {
  const command = operationCampaign(campaign, reproducible);
  const route = replay?.campaignRoute ?? routeForCampaign(command);
  const { observe, act } = command.commandPosture;
  return {
    mode,
    specialist,
    seed: reproducible ? seed : null,
    campaignTier: campaignTier(command.xp),
    inheritedFatigue: command.specialistFatigue[specialist] ?? 0,
    readiness: command.readiness,
    leadershipTrust: command.leadershipTrust,
    unresolvedThreads: command.unresolvedThreads,
    doctrine: observe > act + 2 ? "observe" : act > observe + 2 ? "act" : "balanced",
    campaignRoute: route,
    variant: replay?.variant ?? incidentVariant(scenario, route, seed),
    recentCommands: command.recentCommands,
    recentInjects: command.recentInjects,
    recentCrises: command.recentCrises,
  };
}
