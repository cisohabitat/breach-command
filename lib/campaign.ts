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
  mastery: Record<string, number>;
  commandPosture: { observe: number; act: number };
  unresolvedThreads: number;
  actorSightings: Record<string, number>;
  specialistBonds: Record<string, number>;
  routeHistory: string[];
};

export const defaultCampaign: CampaignState = { completed: [], xp: 0, bestScores: {}, operations: 0, leadershipTrust: 50, readiness: 50, streak: 0, specialistFatigue: {}, mastery: {}, commandPosture: { observe: 0, act: 0 }, unresolvedThreads: 0, actorSightings: {}, specialistBonds: {}, routeHistory: [] };

// Whether stored text is a campaign record at all. parseCampaign defaults every
// missing field and falls back to a new campaign on anything unreadable, so this
// is how a damaged record is told apart from one that never existed.
export function campaignReadable(raw: string): boolean {
  try {
    const value = JSON.parse(raw) as unknown;
    return !!value && typeof value === "object" && !Array.isArray(value);
  } catch {
    return false;
  }
}

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
      mastery: value.mastery && typeof value.mastery === "object" ? value.mastery : {},
      commandPosture: value.commandPosture && typeof value.commandPosture === "object" ? value.commandPosture : { observe: 0, act: 0 },
      unresolvedThreads: Number.isFinite(value.unresolvedThreads) ? Math.max(0, Number(value.unresolvedThreads)) : 0,
      actorSightings: value.actorSightings && typeof value.actorSightings === "object" ? value.actorSightings : {},
      specialistBonds: value.specialistBonds && typeof value.specialistBonds === "object" ? value.specialistBonds : {},
      routeHistory: Array.isArray(value.routeHistory) ? value.routeHistory.filter(item => typeof item === "string").slice(-12) : [],
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
    { title: "Rapid coordination", unlocked: xp >= 200, detail: "One more command action, five less starting impact, and the first unlucky action of an operation no longer hands the actor tempo." },
    { title: "Continuity command", unlocked: xp >= 450, detail: "A sixth established procedure and a deeper continuity reserve." },
  ];
}

export function campaignTier(xp: number) {
  return xp >= 450 ? 3 : xp >= 200 ? 2 : xp >= 75 ? 1 : 0;
}

export function campaignAct(completed: number) {
  if (completed >= 7) return { number: 3, title: "Convergence", detail: "Cross-sector evidence points to a coordinated strategic campaign." };
  if (completed >= 3) return { number: 2, title: "Escalation", detail: "Recurring infrastructure and trust paths connect previously separate incidents." };
  return { number: 1, title: "First contact", detail: "Establish the pattern behind a series of apparently isolated compromises." };
}

export function campaignEnding(state: CampaignState) {
  if (state.completed.length < 10) return null;
  const bonds = Object.values(state.specialistBonds);
  const cohesion = bonds.length ? Math.round(bonds.reduce((sum, value) => sum + value, 0) / bonds.length) : 35;
  const finalRoute = state.routeHistory.at(-1) ?? "common-ground";
  const coda = ` Final doctrine: ${finalRoute.replace("-", " ")}. Team cohesion: ${cohesion}/100.`;
  if (state.leadershipTrust >= 75 && state.readiness >= 75 && state.unresolvedThreads <= 1) return { title: "Collective resilience", detail: "The campaign closes with trusted coordination, strong service continuity and no material unresolved access." + coda };
  if (state.unresolvedThreads >= 4) return { title: "The quiet foothold", detail: "Services survived, but unresolved access leaves the strategic picture uncertain and forces a sustained hunt." + coda };
  if (state.leadershipTrust < 40) return { title: "Operational victory, fractured trust", detail: "The technical campaign was contained, but delayed or unclear decisions weakened collective confidence." + coda };
  return { title: "Guarded stability", detail: "The campaign is contained with manageable residual risk and a funded programme of follow-up work." + coda };
}

export function recordCampaignResult(current: CampaignState, game: Game, score: number): CampaignState {
  const prior = current.bestScores[String(game.scenario)] ?? 0;
  const completed = game.status === "won" && !current.completed.includes(game.scenario)
    ? [...current.completed, game.scenario]
    : current.completed;
  const modeReward = game.mode === "expert" ? 1.5 : game.mode === "escalation" ? 1.4 : game.mode === "ironman" ? 1.35 : game.mode === "daily" ? 1.15 : 1;
  const won = game.status === "won";
  // Seniority follows results. An operation that was not resolved still teaches
  // something, but a command that keeps losing should not reach the same tier as
  // one that keeps winning — otherwise progression measures attendance.
  const outcomeShare = won ? 1 : game.status === "exercise" ? 0.6 : 0.4;
  const reward = Math.max(6, Math.round(score * (game.difficulty === "crisis" ? 1.35 : game.difficulty === "operational" ? 1.15 : 1) * modeReward * outcomeShare));
  // A drill is not a defeat. The team investigated activity that turned out to be
  // authorised: nothing was missed, no access was left open, and the command
  // record should not read as though the incident got away.
  const drill = game.status === "exercise";
  // The team rests between incidents. Benched specialists recover two points and
  // the one just deployed recovers one. Without that rest the deployed specialist
  // carried an operation's fatigue into the next: a player who kept the default
  // specialist started every operation after the first at five of six, where the
  // specialist's bonus no longer applies, for the rest of the campaign.
  const specialistFatigue = Object.fromEntries(Object.entries(current.specialistFatigue).map(([id, fatigue]) => [id, Math.max(0, fatigue - 2)]));
  specialistFatigue[game.specialist] = Math.max(0, Math.min(6, game.specialistFatigue - 1));
  const mastery = score >= 88 ? 3 : score >= 74 ? 2 : won ? 1 : 0;
  const commandPosture = {
    observe: current.commandPosture.observe + game.decisions.filter(item => item.choice === "observe").length,
    act: current.commandPosture.act + game.decisions.filter(item => item.choice === "act").length,
  };
  const actorSightings = { ...current.actorSightings, [game.adversaryProfile]: (current.actorSightings[game.adversaryProfile] ?? 0) + 1 };
  const bond = current.specialistBonds[game.specialist] ?? 35;
  const specialistBonds = { ...current.specialistBonds, [game.specialist]: Math.max(0, Math.min(100, bond + (won ? (score >= 82 ? 8 : 5) : drill ? 3 : 2) - (game.specialistFatigue >= 6 ? 2 : 0))) };
  return {
    completed,
    xp: current.xp + reward,
    bestScores: { ...current.bestScores, [String(game.scenario)]: Math.max(prior, score) },
    operations: current.operations + 1,
    // Trust is lost faster than it is earned, but a win has to earn some back.
    // At (score - 50) / 8 a typical win returned three points against a loss's
    // eight, and 120 simulated twenty-operation campaigns by a command that won
    // two in three ended 27 per cent on "fractured trust". At this rate the
    // spread is 53 per cent guarded stability, 33 collective resilience and 12
    // fractured trust; at (score - 40) / 6 the best ending became the usual one.
    leadershipTrust: Math.max(0, Math.min(100, current.leadershipTrust + (won ? Math.max(1, Math.round((score - 45) / 7)) : drill ? 0 : -8))),
    readiness: Math.max(0, Math.min(100, current.readiness + (won ? 5 : drill ? 2 : -3))),
    streak: won ? current.streak + 1 : drill ? current.streak : 0,
    specialistFatigue,
    mastery: { ...current.mastery, [String(game.scenario)]: Math.max(current.mastery[String(game.scenario)] ?? 0, mastery) },
    commandPosture,
    unresolvedThreads: Math.max(0, current.unresolvedThreads + (drill ? 0 : won && game.objectiveProgress < 65 ? -1 : 1)),
    actorSightings,
    specialistBonds,
    routeHistory: [...current.routeHistory, game.campaignRoute].slice(-12),
  };
}
