// The saved-session corpus: a save written by every session version since 10,
// each by the code of its own era (tests/fixtures/saves/README.md), must still
// migrate, keep what the player did and play on to an ending today.
//
// The opening each was made with: newGame(2, "operational", () => 0), declare
// "identity", playTurn("identity", 15), observe if a decision is pending,
// declare "cloud", playTurn("network", 3), serialiseSession(game, true, false).
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { availableIn, playTurn, proceduresFor, resolveCommand, resolveDecision, resolveResponse, resolveSetPiece, responseOptionsFor, setHypothesis } from "../lib/advanced-game.ts";
import { parseSession, SESSION_VERSION } from "../lib/session.ts";

// The first option of whichever response phase the operation is in.
function firstResponse(game: Parameters<typeof responseOptionsFor>[0]) {
  const profile = responseOptionsFor(game) as unknown as Record<string, { id: string }[]>;
  const phase = ["containment", "assurance", "recovery"][game.responseChoices.length];
  return profile[phase][0].id;
}

const dir = new URL("./fixtures/saves/", import.meta.url);
const files = readdirSync(dir).filter(name => /^session-v\d+\.json$/.test(name)).sort();

test("the corpus covers every session version from 10 to the current one", () => {
  const versions = files.map(name => Number(name.match(/\d+/)![0]));
  for (let version = 10; version <= SESSION_VERSION; version++) assert.ok(versions.includes(version), `a save from version ${version} is in the corpus`);
});

for (const name of files) {
  test(`${name} migrates and plays on`, () => {
    const text = readFileSync(new URL(name, dir), "utf8");
    const saved = parseSession(text);
    assert.ok(saved, "it is accepted rather than refused as damaged");
    let game = saved!.game;
    assert.equal(game.scenario, 2);
    assert.equal(game.turns.length, 2, "the two turns the player took are kept");
    assert.equal(game.hypothesis, "cloud", "and the reading they last declared");
    // Play on with whatever the record allows until the operation ends.
    for (let step = 0; step < 60 && ["playing", "response"].includes(game.status); step++) {
      if (game.pendingDecision) { game = resolveDecision(game, "contain"); continue; }
      if (game.pendingCommand) { game = resolveCommand(game, "a"); continue; }
      if (game.pendingSetPiece) { game = resolveSetPiece(game, "a"); continue; }
      if (game.status === "response") { game = resolveResponse(game, firstResponse(game)); continue; }
      const open = proceduresFor(game).find(procedure => availableIn(game, procedure.id) === 0);
      assert.ok(open, "some procedure is always available to a resumed operation");
      if (!game.hypothesis) game = setHypothesis(game, "identity");
      game = playTurn(game, open!.id, 12);
    }
    assert.ok(["won", "lost", "exercise"].includes(game.status), `the resumed operation reaches an ending (it was ${game.status})`);
  });
}

test("a damaged save is still refused", () => {
  const text = readFileSync(new URL(files.at(-1)!, dir), "utf8");
  assert.equal(parseSession(text.slice(0, text.length / 2)), null);
  const saved = JSON.parse(text);
  saved.game.status = "response";
  saved.game.revealed = [];
  assert.equal(parseSession(JSON.stringify(saved)), null);
});
