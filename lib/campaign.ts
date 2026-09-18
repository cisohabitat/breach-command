import type { Game } from "./advanced-game";

export const CAMPAIGN_KEY = "breach-command.campaign";

export type CampaignState = {
  completed: number[];
  xp: number;
  bestScores: Record<string, number>;
  operations: number;
  leadershipTrust: number;
  readiness: number;
  streak: number;
  specialistFatigue: Record<string, number>;
};

export const defaultCampaign: CampaignState = { completed: [], xp: 0, bestScores: {}, operations: 0, leadershipTrust: 50, readiness: 50, streak: 0, specialistFatigue: {} };

export function parseCampaign(raw: string | null): CampaignState {
  if (!raw) return defaultCampaign;
  try {
    const value = JSON.parse(raw) as Partial<CampaignState>;
    return {
      completed: Array.isArray(value.completed) ? value.completed.filter(Number.isInteger) : [],
      xp: Number.isFinite(value.xp) ? Math.max(0, Number(value.xp)) : 0,
      bestScores: value.bestScores && typeof value.bestScores === "object" ? value.bestScores : {},
      operations: Number.isFinite(value.operations) ? Math.max(0, Number(value.operations)) : 0,
      leadershipTrust: Number.isFinite(value.leadershipTrust) ? Math.max(0, Math.min(100, Number(value.leadershipTrust))) : 50,
      readiness: Number.isFinite(value.readiness) ? Math.max(0, Math.min(100, Number(value.readiness))) : 50,
      streak: Number.isFinite(value.streak) ? Math.max(0, Number(value.streak)) : 0,
      specialistFatigue: value.specialistFatigue && typeof value.specialistFatigue === "object" ? value.specialistFatigue : {},
    };
  } catch {
    return defaultCampaign;
  }
}

export function campaignRank(xp: number) {
  if (xp >= 800) return "National Incident Commander";
  if (xp >= 450) return "Senior Incident Commander";
  if (xp >= 200) return "Incident Commander";
  if (xp >= 75) return "Response Lead";
  return "Investigation Lead";
}

export function unlockedCapabilities(xp: number) {
  return [
    { title: "Evidence fusion", unlocked: xp >= 75, detail: "One additional evidence procedure begins established." },
    { title: "Rapid coordination", unlocked: xp >= 200, detail: "Operations begin with five less business impact." },
    { title: "Continuity command", unlocked: xp >= 450, detail: "Operations begin with an additional continuity reserve." },
  ];
}

export function campaignTier(xp: number) {
  return xp >= 450 ? 3 : xp >= 200 ? 2 : xp >= 75 ? 1 : 0;
}

export function recordCampaignResult(current: CampaignState, game: Game, score: number): CampaignState {
  const prior = current.bestScores[String(game.scenario)] ?? 0;
  const completed = game.status === "won" && !current.completed.includes(game.scenario)
    ? [...current.completed, game.scenario]
    : current.completed;
  const modeReward = game.mode === "expert" ? 1.5 : game.mode === "escalation" ? 1.4 : game.mode === "ironman" ? 1.35 : game.mode === "daily" ? 1.15 : 1;
  const reward = Math.max(10, Math.round(score * (game.difficulty === "crisis" ? 1.35 : game.difficulty === "operational" ? 1.15 : 1) * modeReward));
  const won = game.status === "won";
  const specialistFatigue = Object.fromEntries(Object.entries(current.specialistFatigue).map(([id, fatigue]) => [id, Math.max(0, fatigue - 1)]));
  specialistFatigue[game.specialist] = Math.max(0, Math.min(6, game.specialistFatigue));
  return {
    completed,
    xp: current.xp + reward,
    bestScores: { ...current.bestScores, [String(game.scenario)]: Math.max(prior, score) },
    operations: current.operations + 1,
    leadershipTrust: Math.max(0, Math.min(100, current.leadershipTrust + (won ? Math.round((score - 50) / 8) : -8))),
    readiness: Math.max(0, Math.min(100, current.readiness + (won ? 5 : -3))),
    streak: won ? current.streak + 1 : 0,
    specialistFatigue,
  };
}
