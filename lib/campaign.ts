import { SPECIALIST_EXHAUSTED_AT } from "./command-systems.ts";
import { countRevisions } from "./engine/revisions.ts";
import type { Game } from "./engine/types.ts";
import { registerContent } from "./i18n/content/registry.ts";
import { lit, msg, type Message } from "./i18n/message.ts";

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
  // The command events and injects met in recent operations, oldest first, so
  // the next operation reaches for beats the campaign has not seen lately.
  recentCommands: string[];
  recentInjects: string[];
  recentCrises: string[];
  // Each case's mastery ladder: the rungs this command has climbed on it.
  ladder: Record<string, LadderRungId[]>;
};

export const defaultCampaign: CampaignState = { completed: [], xp: 0, bestScores: {}, operations: 0, leadershipTrust: 50, readiness: 50, streak: 0, specialistFatigue: {}, mastery: {}, commandPosture: { observe: 0, act: 0 }, unresolvedThreads: 0, actorSightings: {}, specialistBonds: {}, routeHistory: [], recentCommands: [], recentInjects: [], recentCrises: [], ladder: {} };

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

const RECENT_COMMANDS = 15;
const RECENT_INJECTS = 16;
const RECENT_CRISES = 10;
// Newest last, each id once.
const remember = (list: string[], met: string[], keep: number) => [...list.filter(id => !met.includes(id)), ...met.filter((id, index) => met.indexOf(id) === index)].slice(-keep);

// A case's mastery ladder: authored challenges past clearing it, each a won
// operation under a constraint. An authorised exercise clears the case but
// climbs no rung, because every rung is about carrying the response through.
export type LadderRungId = "crisis" | "steady" | "swift" | "tired" | "expert";
export const ladderRungs: { id: LadderRungId; title: string; detail: string }[] = [
  { id: "crisis", title: "Won at Crisis", detail: "Win the case at Crisis difficulty." },
  { id: "steady", title: "Won without revising", detail: "Win holding one reading from the first check to the last." },
  { id: "swift", title: "Won in half the window", detail: "Win having used no more than half the investigation window." },
  { id: "tired", title: "Won with a tired specialist", detail: `Win with the deployed specialist's fatigue at ${SPECIALIST_EXHAUSTED_AT} or more, where their bonus no longer applies.` },
  { id: "expert", title: "Won in Expert", detail: "Win the case in Expert mode, with every aid withheld." },
];

export function rungsEarned(game: Game): LadderRungId[] {
  if (game.status !== "won") return [];
  const earned: LadderRungId[] = [];
  if (game.difficulty === "crisis") earned.push("crisis");
  if (countRevisions(game) === 0) earned.push("steady");
  if (game.turns.length * 2 <= game.turnLimit) earned.push("swift");
  if (game.specialistFatigue >= SPECIALIST_EXHAUSTED_AT) earned.push("tired");
  if (game.mode === "expert") earned.push("expert");
  return earned;
}

function parseLadder(value: unknown): Record<string, LadderRungId[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const known = new Set(ladderRungs.map(rung => rung.id as string));
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key, rungs]) => /^\d+$/.test(key) && Array.isArray(rungs))
    .map(([key, rungs]) => [key, (rungs as unknown[]).filter((id): id is LadderRungId => typeof id === "string" && known.has(id))]));
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
      recentCommands: Array.isArray(value.recentCommands) ? value.recentCommands.filter(item => typeof item === "string").slice(-RECENT_COMMANDS) : [],
      recentInjects: Array.isArray(value.recentInjects) ? value.recentInjects.filter(item => typeof item === "string").slice(-RECENT_INJECTS) : [],
      recentCrises: Array.isArray(value.recentCrises) ? value.recentCrises.filter(item => typeof item === "string").slice(-RECENT_CRISES) : [],
      ladder: parseLadder(value.ladder),
    };
  } catch {
    return defaultCampaign;
  }
}

// Highest first: a command holds the first rank whose threshold it has reached.
const campaignRanks = [
  { id: "national", at: 800, title: "National Incident Commander" },
  { id: "senior", at: 450, title: "Senior Incident Commander" },
  { id: "commander", at: 200, title: "Incident Commander" },
  { id: "response", at: 75, title: "Response Lead" },
  { id: "investigation", at: 0, title: "Investigation Lead" },
];

export function campaignRank(xp: number) {
  return campaignRanks.find(rank => xp >= rank.at)!.title;
}

const campaignCapabilities = [
  { id: "fusion", title: "Evidence fusion", at: 75, detail: "One additional evidence procedure begins established." },
  { id: "coordination", title: "Rapid coordination", at: 200, detail: "One more command action, five less starting impact, and the first unlucky action of an operation no longer hands the actor tempo." },
  { id: "continuity", title: "Continuity command", at: 450, detail: "A sixth established procedure and a deeper continuity reserve." },
];

export function unlockedCapabilities(xp: number) {
  return campaignCapabilities.map(capability => ({ title: capability.title, unlocked: xp >= capability.at, at: capability.at, detail: capability.detail }));
}

// What trust and readiness do to the next Campaign operation, in the thresholds
// newGame applies. Both rose every operation and nothing said what they bought.
export function standingEffects(state: CampaignState): Message[] {
  const trust = { trust: state.leadershipTrust };
  const readiness = { readiness: state.readiness };
  return [
    state.leadershipTrust < 35 ? msg("campaign.trustLow", trust) : state.leadershipTrust >= 75 ? msg("campaign.trustHigh", trust) : msg("campaign.trustNone", trust),
    state.readiness < 30 ? msg("campaign.readinessLow", readiness) : state.readiness >= 75 ? msg("campaign.readinessHigh", readiness) : state.readiness >= 60 ? msg("campaign.readinessGood", readiness) : msg("campaign.readinessNone", readiness),
  ];
}

// The campaign's next case: the first not yet cleared, so a reload or a loss
// does not offer a case already done or quietly skip one that was lost.
export function nextCase(state: CampaignState, cases = 10) {
  const open = Array.from({ length: cases }, (_, index) => index).find(index => !state.completed.includes(index));
  return open ?? 0;
}

// What one operation did to the campaign, in words, for the review. Trust and
// readiness were shown as totals with no change and no reason.
export function campaignChanges(before: CampaignState, after: CampaignState, game: Game, score: number): Message[] {
  // The sign is a figure's, not a word: "+5", "−3", "±0".
  const signed = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : "±"}${Math.abs(value)}`;
  const lines: Message[] = [];
  const trust = { change: signed(after.leadershipTrust - before.leadershipTrust), now: after.leadershipTrust, score };
  lines.push(game.status === "won" ? msg("engine.campaign.trustWon", trust) : game.status === "exercise" ? msg("engine.campaign.trustDrill", trust) : msg("engine.campaign.trustLost", trust));
  const readiness = { change: signed(after.readiness - before.readiness), now: after.readiness };
  lines.push(game.status === "won" ? msg("engine.campaign.readinessWon", readiness) : game.status === "exercise" ? msg("engine.campaign.readinessDrill", readiness) : msg("engine.campaign.readinessLost", readiness));
  const threads = after.unresolvedThreads - before.unresolvedThreads;
  if (threads) lines.push(msg("engine.campaign.unresolvedAccess", { change: signed(threads), now: after.unresolvedThreads }));
  const xp = after.xp - before.xp;
  if (xp) lines.push(msg("engine.campaign.experience", { xp, now: after.xp, score }));
  for (const capability of unlockedCapabilities(after.xp)) if (capability.unlocked && !unlockedCapabilities(before.xp).find(item => item.at === capability.at)!.unlocked) lines.push(msg("engine.campaign.unlocked", { title: lit(capability.title), detail: lit(capability.detail) }));
  const climbed = (after.ladder?.[String(game.scenario)] ?? []).filter(id => !(before.ladder?.[String(game.scenario)] ?? []).includes(id));
  for (const id of climbed) lines.push(msg("engine.campaign.ladder", { rung: lit(ladderRungs.find(rung => rung.id === id)!.title, "lowerFirst"), climbed: (after.ladder?.[String(game.scenario)] ?? []).length, rungs: ladderRungs.length }));
  if (after.completed.length > before.completed.length) lines.push(msg("engine.campaign.caseCleared", { cleared: after.completed.length }));
  else if (game.status === "lost") lines.push(msg("engine.campaign.caseStaysOpen"));
  return lines;
}

export function campaignTier(xp: number) {
  return xp >= 450 ? 3 : xp >= 200 ? 2 : xp >= 75 ? 1 : 0;
}

// "Escalation" is also a mode; the second act reads as its own thing.
const campaignActs = [
  { number: 1, from: 0, title: "First contact", detail: "Establish the pattern behind a series of apparently isolated compromises." },
  { number: 2, from: 3, title: "Widening pattern", detail: "Recurring infrastructure and trust paths connect previously separate incidents." },
  { number: 3, from: 7, title: "Convergence", detail: "Cross-sector evidence points to a coordinated strategic campaign." },
];

export function campaignAct(completed: number) {
  const act = campaignActs.findLast(item => completed >= item.from)!;
  return { number: act.number, title: act.title, detail: act.detail };
}

// What the director says at the start of each act, and the development that
// arrives half-way through it, keyed to the route the command's own choices put
// the campaign on. The acts were thresholds with a title; this is the story
// they mark.
const actBriefings: Record<number, string> = {
  1: "Three organisations have reported intrusions this month that look unrelated. Take each one on its own evidence and tell me whether they are.",
  2: "The same trust paths keep appearing. Stop treating these as separate incidents and find what connects them.",
  3: "This is one campaign. Close what is open, and tell me plainly what we still cannot see.",
};
const actMidpoints: Record<number, number> = { 1: 2, 2: 5, 3: 8 };
const routeDevelopments: Record<string, string> = {
  watchtower: "The access you chose to watch has started to talk: a second organisation's records show the same accounts.",
  breakwater: "The routes you closed are being tried again from new addresses. Someone is testing what is left.",
  "common-ground": "Two partners you briefed have found matching activity and shared it with you first.",
  convergence: "Every open thread now points at the same small set of suppliers and accounts.",
};

export function campaignStory(state: CampaignState, route: string) {
  const act = campaignAct(state.completed.length);
  return {
    briefing: actBriefings[act.number],
    development: state.completed.length >= actMidpoints[act.number] ? routeDevelopments[route] ?? null : null,
  };
}

const campaignEndings = [
  { id: "resilience", title: "Collective resilience", detail: "The campaign closes with trusted coordination, strong service continuity and no material unresolved access." },
  { id: "foothold", title: "The quiet foothold", detail: "Services survived, but unresolved access leaves the strategic picture uncertain and forces a sustained hunt." },
  { id: "fractured", title: "Operational victory, fractured trust", detail: "The technical campaign was contained, but delayed or unclear decisions weakened collective confidence." },
  { id: "stability", title: "Guarded stability", detail: "The campaign is contained with manageable residual risk and a funded programme of follow-up work." },
];
const doctrineNames: Record<string, Parameters<typeof msg>[0]> = {
  watchtower: "campaign.doctrine.watchtower",
  breakwater: "campaign.doctrine.breakwater",
  "common-ground": "campaign.doctrine.commonGround",
  convergence: "campaign.doctrine.convergence",
};

export function campaignEnding(state: CampaignState): { title: string; detail: Message } | null {
  if (state.completed.length < 10) return null;
  const bonds = Object.values(state.specialistBonds);
  const cohesion = bonds.length ? Math.round(bonds.reduce((sum, value) => sum + value, 0) / bonds.length) : 35;
  const finalRoute = state.routeHistory.at(-1) ?? "common-ground";
  // The ending names what this command did, in the record's own numbers.
  const { observe, act } = state.commandPosture;
  const ending = campaignEndings.find(item => item.id === (
    state.leadershipTrust >= 75 && state.readiness >= 75 && state.unresolvedThreads <= 1 ? "resilience"
      : state.unresolvedThreads >= 4 ? "foothold"
        : state.leadershipTrust < 40 ? "fractured"
          : "stability"))!;
  const detail = msg("campaign.endingRecord", {
    detail: lit(ending.detail),
    operations: msg("campaign.operations", { count: state.operations }),
    watched: msg("campaign.evidenceDecisions", { count: observe }),
    act,
    access: state.unresolvedThreads ? msg("campaign.unresolvedAccess", { count: state.unresolvedThreads }) : msg("campaign.noAccessUnresolved"),
    doctrine: msg(doctrineNames[finalRoute] ?? "campaign.doctrine.commonGround"),
    cohesion,
  });
  return { title: ending.title, detail };
}

export function recordCampaignResult(current: CampaignState, game: Game, score: number): CampaignState {
  const prior = current.bestScores[String(game.scenario)] ?? 0;
  // An authorised exercise is a conclusion the investigation earned, so it clears
  // the case as a win does; left open, a player who earned it saw "0/10 incidents"
  // and the same assignment offered again.
  const completed = (game.status === "won" || game.status === "exercise") && !current.completed.includes(game.scenario)
    ? [...current.completed, game.scenario]
    : current.completed;
  const modeReward = game.mode === "expert" ? 1.5 : game.mode === "escalation" ? 1.4 : game.mode === "ironman" ? 1.35 : game.mode === "weekly" ? 1.2 : game.mode === "daily" ? 1.15 : 1;
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
    // spread is about 55 per cent guarded stability, 33 collective resilience and
    // 11 fractured trust; at (score - 40) / 6 the best ending became the usual
    // one. The offset was 45 until Training and Operational allowed more turns
    // before the score charged for them.
    leadershipTrust: Math.max(0, Math.min(100, current.leadershipTrust + (won ? Math.max(1, Math.round((score - 48) / 7)) : drill ? 0 : -8))),
    readiness: Math.max(0, Math.min(100, current.readiness + (won ? 5 : drill ? 2 : -3))),
    streak: won ? current.streak + 1 : drill ? current.streak : 0,
    specialistFatigue,
    mastery: { ...current.mastery, [String(game.scenario)]: Math.max(current.mastery[String(game.scenario)] ?? 0, mastery) },
    ladder: { ...(current.ladder ?? {}), [String(game.scenario)]: ladderRungs.map(rung => rung.id).filter(id => (current.ladder?.[String(game.scenario)] ?? []).includes(id) || rungsEarned(game).includes(id)) },
    commandPosture,
    unresolvedThreads: Math.max(0, current.unresolvedThreads + (drill ? 0 : won && game.objectiveProgress < 65 ? -1 : 1)),
    actorSightings,
    specialistBonds,
    routeHistory: [...current.routeHistory, game.campaignRoute].slice(-12),
    recentCommands: remember(current.recentCommands ?? [], game.commandHistory.map(record => record.event), RECENT_COMMANDS),
    recentInjects: remember(current.recentInjects ?? [], game.turns.flatMap(turn => turn.inject ? [turn.inject.id] : []), RECENT_INJECTS),
    recentCrises: remember(current.recentCrises ?? [], game.setPieceHistory.map(record => record.event), RECENT_CRISES),
  };
}

// The words of these tables are a locale's to replace (lib/i18n/content/).
registerContent({ ladderRungs, campaignRanks, campaignCapabilities, campaignActs, actBriefings, routeDevelopments, campaignEndings });
