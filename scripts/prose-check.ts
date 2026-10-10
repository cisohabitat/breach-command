// The English of everything the engine composes for a player, as one hash:
// seeded operations and campaigns are played, and at every state of every game
// each function that writes a sentence is called with each argument that
// changes it, and what it returns is said in English (a message through say(),
// as the interface would). Recorded in scripts/prose-expected.json; moving a
// sentence into the catalogue must leave the hash where it was, so the words
// cannot change unseen. --record writes it; --dump=<file> writes every line.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import * as engine from "../lib/advanced-game.ts";
import { correlateEvidence, newGame, playTurn, proceduresFor, resolveCommand, resolveDecision, resolveMapAction, resolveResponse, resolveSetPiece, scenarios, setCaseTheory, setHypothesis, setInfrastructureFocus, type Difficulty, type Game } from "../lib/advanced-game.ts";
import * as campaign from "../lib/campaign.ts";
import { chooseBotAction, type BotAction } from "../lib/game-bot.ts";
import { seededChallengeRandom } from "../lib/phase8.ts";
import * as phase9 from "../lib/phase9.ts";
import * as notes from "../lib/specialist-notes.ts";
import { describeWhen } from "../lib/last-operation.ts";
import * as message from "../lib/i18n/message.ts";
import "../lib/i18n/engine-messages.ts";
import "../lib/i18n/content/tables.ts";

let state = 20261010;
Math.random = () => { state = (state * 16807) % 2147483647; return (state - 1) / 2147483646; };
Object.defineProperty(globalThis, "crypto", { value: undefined, configurable: true });

// Any message in a result, said in English; everything else as it is.
const english = (value: unknown): unknown => {
  const isMessage = (message as { isMessage?: (value: unknown) => boolean }).isMessage;
  if (isMessage?.(value)) return message.say(value as message.Message, "en");
  if (Array.isArray(value)) return value.map(english);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, english(item)]));
  return value;
};
const lines: string[] = [];
const say = (name: string, call: () => unknown) => {
  let result: unknown;
  try { result = call(); } catch (error) { result = `throws: ${(error as Error).message}`; }
  lines.push(`${name} ${JSON.stringify(english(result))}`);
};
const fn = (name: string) => (engine as Record<string, unknown>)[name] as ((...args: unknown[]) => unknown) | undefined;
const call = (name: string, ...args: unknown[]) => { const f = fn(name); if (f) say(name, () => f(...args)); };

function readState(game: Game) {
  for (const name of ["getAttributionRead", "getObjectiveRead", "getLead", "getKnownFacts", "getSectorRead", "getSectorAlert", "getMapHint", "nextEvidenceSource", "getDecisionOptions", "getRuledOutRoutes", "getReadingOdds", "getHypothesisStanding", "getLossReason", "getAdversaryRead", "getAdversaryState", "getOperationalLabel"]) call(name, game);
  for (const guided of [false, true]) { call("guidanceLevel", game, guided); call("getCoachPrompt", game, guided); call("getTrainingPrompt", game, guided); }
  for (const procedure of proceduresFor(game)) {
    call("getDiscriminatingRead", game, procedure.id);
    call("getModifierBreakdown", game, procedure.id);
    call("getModifierBreakdown", game, procedure.id, { scope: "enterprise", intensity: "exhaustive" });
  }
  say("bot", () => chooseBotAction(game).reason);
}
function reviewState(game: Game) {
  for (const name of ["getBeginnerReview", "getOutcome", "getScoreRows", "getResultSummary", "getShareCard", "getHypothesisLedger", "getCounterfactuals"]) call(name, game);
  for (const next of [0, 3, 9]) call("recommendNext", game, next);
}
function apply(game: Game, action: BotAction): Game {
  switch (action.type) {
    case "decision": return resolveDecision(game, action.choice);
    case "command": return resolveCommand(game, action.choice);
    case "set-piece": return resolveSetPiece(game, action.choice);
    case "response": return resolveResponse(game, action.choice);
    case "hypothesis": return setHypothesis(game, action.hypothesis);
    case "case-theory": return setCaseTheory(game, action.objective);
    case "correlate": return correlateEvidence(game, action.evidence, action.assessment);
    case "focus": return setInfrastructureFocus(game, action.nodeId);
    case "map": return resolveMapAction(game, action.nodeId, action.action);
    case "procedure": return playTurn(game, action.procedure, undefined, action.plan);
    case "complete": return game;
  }
}
function play(game: Game) {
  readState(game);
  for (let step = 0; step < 200 && (game.status === "playing" || game.status === "response"); step++) {
    const action = chooseBotAction(game);
    if (action.type === "complete") break;
    game = apply(game, action);
    readState(game);
  }
  reviewState(game);
  return game;
}

for (const difficulty of ["training", "operational", "crisis"] as Difficulty[]) for (let scenario = 0; scenario < scenarios.length; scenario++) for (let index = 0; index < 4; index++) {
  const seed = 900000 + scenario * 1000 + index;
  play(newGame(scenario, difficulty, seededChallengeRandom(seed), { seed, mode: index === 3 ? "expert" : "daily" }));
}
for (let run = 0; run < 12; run++) {
  let state = campaign.defaultCampaign;
  const random = seededChallengeRandom(700000 + run);
  for (let step = 0; step < 12 && state.completed.length < scenarios.length; step++) {
    const scenario = campaign.nextCase(state, scenarios.length);
    const route = phase9.routeForCampaign(state);
    say("routeReason", () => phase9.routeReason(state));
    say("campaignAct", () => campaign.campaignAct(state.completed.length));
    say("campaignStory", () => campaign.campaignStory(state, route));
    say("standingEffects", () => campaign.standingEffects(state));
    say("campaignEnding", () => campaign.campaignEnding(state));
    const game = play(newGame(scenario, "operational", random, { mode: "campaign", campaignTier: campaign.campaignTier(state.xp), readiness: state.readiness, leadershipTrust: state.leadershipTrust, unresolvedThreads: state.unresolvedThreads, campaignRoute: route, variant: phase9.incidentVariant(scenario, route, random(100000)), seed: null, recentCommands: state.recentCommands, recentInjects: state.recentInjects, recentCrises: state.recentCrises }));
    const score = engine.getScoreBreakdown(game).total;
    const after = campaign.recordCampaignResult(state, game, score);
    say("campaignChanges", () => campaign.campaignChanges(state, after, game, score));
    state = after;
  }
}
for (let xp = 0; xp <= 1200; xp += 25) { say("campaignRank", () => campaign.campaignRank(xp)); say("unlockedCapabilities", () => campaign.unlockedCapabilities(xp)); }
for (const id of ["hunter", "forensics", "identity", "ot", "continuity", "communications"] as const) for (const bond of [0, 35, 50, 65, 80, 100]) {
  say("specialistArc", () => notes.specialistArc(id, bond));
  for (const won of [false, true]) for (const score of [20, 55, 80, 95]) say("specialistReaction", () => notes.specialistReaction(id, won, score, bond));
}
const now = Date.UTC(2026, 9, 10, 12);
for (const ago of [0, 30e3, 3600e3, 5 * 3600e3, 86400e3, 3 * 86400e3, 40 * 86400e3]) say("describeWhen", () => describeWhen(now - ago, now));

const hash = createHash("sha256").update(lines.join("\n")).digest("hex");
const expectedPath = new URL("./prose-expected.json", import.meta.url);
const dump = process.argv.find(arg => arg.startsWith("--dump="))?.slice("--dump=".length);
if (dump) writeFileSync(dump, `${lines.join("\n")}\n`);
if (process.argv.includes("--record")) {
  writeFileSync(expectedPath, `${JSON.stringify({ lines: lines.length, sha256: hash }, null, 2)}\n`);
  console.log(`Recorded ${lines.length} lines, ${hash}`);
} else {
  const expected = JSON.parse(readFileSync(expectedPath, "utf8")) as { lines: number; sha256: string };
  if (expected.sha256 !== hash) {
    console.error(`The composed prose changed: ${lines.length} lines, ${hash}; recorded ${expected.lines}, ${expected.sha256}. Run with --dump=<file> before and after to see where.`);
    process.exit(1);
  }
  console.log(`Composed prose unchanged: ${lines.length} lines.`);
}
