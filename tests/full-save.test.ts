// A whole operation saved by version 18 (tests/fixtures/full/full-v18.json:
// the Bot Commander, seed 1, the telecoms case, a campaign operation with two
// injects, an adaptation, map actions, comparisons, a command event and a
// crisis). Version 19 stores what the engine writes as messages. Played again
// from the same seed, today's engine takes the same path, and every message it
// stores reads, in English, exactly as version 18 stored the sentence; and the
// old save itself migrates and reads as it did.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { carriedLabel, correlateEvidence, describePart, injectCard, newGame, playTurn, resolveCommand, resolveDecision, resolveMapAction, resolveResponse, resolveSetPiece, setCaseTheory, setHypothesis, setInfrastructureFocus, type Game } from "../lib/advanced-game.ts";
import { chooseBotAction, type BotAction } from "../lib/game-bot.ts";
import { seededChallengeRandom } from "../lib/phase8.ts";
import { incidentVariant } from "../lib/phase9.ts";
import { parseSession } from "../lib/session.ts";
import { isMessage, resolveRef, say, type Message } from "../lib/i18n/message.ts";
import "../lib/i18n/engine-messages.ts";
import "../lib/i18n/content/tables.ts";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/full/full-v18.json", import.meta.url), "utf8"));
const old = fixture.session.game;

function replay(): Game {
  const { seed, scenario } = fixture.setup;
  let state = seed;
  Math.random = () => { state = (state * 16807) % 2147483647; return (state - 1) / 2147483646; };
  Object.defineProperty(globalThis, "crypto", { value: undefined, configurable: true });
  const apply = (game: Game, action: BotAction): Game => {
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
  };
  const { difficulty, mode, campaignTier, readiness, leadershipTrust, unresolvedThreads, campaignRoute } = fixture.setup;
  let game = newGame(scenario, difficulty, seededChallengeRandom(seed), { seed, mode, campaignTier, readiness, leadershipTrust, unresolvedThreads, campaignRoute, variant: incidentVariant(scenario, campaignRoute, seed) });
  for (let step = 0; step < 200 && (game.status === "playing" || game.status === "response"); step++) {
    const action = chooseBotAction(game);
    if (action.type === "complete") break;
    game = apply(game, action);
  }
  return game;
}

// What version 18's describePart said of a part it had stored.
function describedBefore(label: string, value: number) {
  const signed = (n: number) => `${n < 0 ? "−" : "+"}${Math.abs(n)}`;
  const joined = label.match(/^(.*?)(, together|: [+−]\d+, capped at)$/);
  if (!joined) return `${label} ${signed(value)}`;
  return `Since your last roll ${signed(value)} (from ${joined[1].replace(/; /g, ", ")}${joined[2] === ", together" ? "" : `, capped at ${signed(value)}`})`;
}

// Every stored sentence, by where it is, as text.
function sentences(game: Game, read: (value: Message | string) => string) {
  const out: Record<string, string> = {};
  const put = (path: string, value: Message | string | null | undefined) => { if (value !== null && value !== undefined) out[path] = read(value); };
  put("variant.title", game.variant.title); put("variant.briefing", game.variant.briefing); put("variant.modifier", game.variant.modifier);
  game.turns.forEach((turn, index) => {
    put(`turns.${index}.narrative`, turn.narrative);
    put(`turns.${index}.adversaryEvent`, turn.adversaryEvent);
    turn.parts.forEach((part, at) => put(`turns.${index}.parts.${at}`, part.label));
    if (turn.inject) { put(`turns.${index}.inject.reason`, turn.inject.reason); put(`turns.${index}.inject.effectLabel`, turn.inject.effectLabel ?? injectCard(turn.inject.id).effectLabel); }
  });
  game.decisions.forEach((decision, index) => { for (const field of ["title", "effect", "counterfactual", "adaptationReason", "rationale"] as const) put(`decisions.${index}.${field}`, decision[field]); });
  game.commandHistory.forEach((record, index) => { put(`commands.${index}.title`, record.title); put(`commands.${index}.effect`, record.effect); });
  game.setPieceHistory.forEach((record, index) => { put(`crises.${index}.title`, record.title); put(`crises.${index}.effect`, record.effect); });
  game.evidence.forEach((item, index) => { for (const field of ["title", "source", "system", "detail"] as const) put(`evidence.${index}.${field}`, item[field]); });
  game.correlations.forEach((record, index) => put(`correlations.${index}.finding`, record.finding));
  game.mapHistory.forEach((record, index) => put(`map.${index}.effect`, record.effect));
  return out;
}
const english = (value: Message | string) => typeof value === "string" ? value : say(value);

test("the same seed today stores messages that read as version 18's sentences", () => {
  const game = replay();
  assert.equal(game.turns.length, old.turns.length, "the replay takes the same path");
  assert.deepEqual(game.turns.map(turn => [turn.procedure, turn.raw, turn.total, turn.revealed]), old.turns.map((turn: Game["turns"][number]) => [turn.procedure, turn.raw, turn.total, turn.revealed]));
  const before = sentences(old as Game, english);
  for (const [index, turn] of (old as { turns: { inject: { effectLabel: string } | null }[] }).turns.entries()) if (turn.inject) before[`turns.${index}.inject.effectLabel`] = turn.inject.effectLabel;
  assert.deepEqual(sentences(game, english), before);
  assert.equal(game.nextModifierSources.length ? say(carriedLabel(game.nextModifierSources, game.nextModifier)) : null, old.nextModifierSource, "and the carried change is named as it was");
  assert.ok(Object.keys(before).length > 60, `${Object.keys(before).length} sentences compared`);
});

test("the version 18 save migrates and reads as it did", () => {
  const saved = parseSession(JSON.stringify(fixture.session));
  assert.ok(saved, "it is accepted");
  const game = saved!.game;
  const before = sentences(old as Game, english);
  for (const [index, turn] of (old as { turns: { inject: { effectLabel: string } | null }[] }).turns.entries()) if (turn.inject) before[`turns.${index}.inject.effectLabel`] = turn.inject.effectLabel;
  assert.deepEqual(sentences(game, english), before);
  game.turns.forEach((turn, index) => turn.parts.forEach((part, at) => assert.equal(say(describePart(part)), describedBefore(old.turns[index].parts[at].label, part.value), `turn ${index + 1}, part ${at + 1} reads as it did`)));
});

test("every content reference a game stores resolves", () => {
  const unresolved: string[] = [];
  const walk = (value: unknown, path: string) => {
    if (isMessage(value) && "ref" in value && resolveRef(value.ref) === undefined) unresolved.push(`${path}: ${value.ref}`);
    if (value && typeof value === "object") for (const [key, item] of Object.entries(value)) walk(item, `${path}.${key}`);
  };
  walk(replay(), "replay");
  walk(parseSession(JSON.stringify(fixture.session))!.game, "migrated");
  assert.deepEqual(unresolved, []);
});
