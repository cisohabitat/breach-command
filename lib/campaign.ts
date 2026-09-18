import type { Game } from "./advanced-game";

export const CAMPAIGN_KEY = "breach-command.campaign";

export type CampaignState = {
  completed: number[];
  xp: number;
  bestScores: Record<string, number>;
  operations: number;
};

export const defaultCampaign: CampaignState = { completed: [], xp: 0, bestScores: {}, operations: 0 };

export function parseCampaign(raw: string | null): CampaignState {
  if (!raw) return defaultCampaign;
  try {
    const value = JSON.parse(raw) as Partial<CampaignState>;
    return {
      completed: Array.isArray(value.completed) ? value.completed.filter(Number.isInteger) : [],
      xp: Number.isFinite(value.xp) ? Math.max(0, Number(value.xp)) : 0,
      bestScores: value.bestScores && typeof value.bestScores === "object" ? value.bestScores : {},
      operations: Number.isFinite(value.operations) ? Math.max(0, Number(value.operations)) : 0,
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
    { title: "Evidence fusion", unlocked: xp >= 75, detail: "Recognises disciplined cross-source investigation." },
    { title: "Rapid coordination", unlocked: xp >= 200, detail: "Recognises timely operational decisions." },
    { title: "Continuity command", unlocked: xp >= 450, detail: "Recognises balanced cyber and service outcomes." },
  ];
}

export function recordCampaignResult(current: CampaignState, game: Game, score: number): CampaignState {
  const prior = current.bestScores[String(game.scenario)] ?? 0;
  const completed = game.status === "won" && !current.completed.includes(game.scenario)
    ? [...current.completed, game.scenario]
    : current.completed;
  const reward = Math.max(10, Math.round(score * (game.difficulty === "crisis" ? 1.35 : game.difficulty === "operational" ? 1.15 : 1)));
  return {
    completed,
    xp: current.xp + reward,
    bestScores: { ...current.bestScores, [String(game.scenario)]: Math.max(prior, score) },
    operations: current.operations + 1,
  };
}
