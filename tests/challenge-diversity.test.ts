import assert from "node:assert/strict";
import { test } from "node:test";
import { CHALLENGE_VERSION, decodeChallenge, encodeChallenge, isOutdatedChallenge, operationChallenge, seededChallengeRandom, seededRoll } from "../lib/challenge.ts";
import { newGame, scenarios, getShareCard, getResultSummary } from "../lib/advanced-game.ts";
import { parseSession, serialiseSession } from "../lib/session.ts";
import { en } from "./english.ts";

test("seeded stages span every chain combination in every scenario", () => {
  for (let scenario = 0; scenario < scenarios.length; scenario++) {
    const chains = new Set<string>();
    for (let seed = 0; seed < 10_000; seed++) {
      const game = newGame(scenario, "operational", seededChallengeRandom(seed), { seed });
      chains.add(game.chain.join(","));
    }
    assert.equal(chains.size, 256, `${scenarios[scenario].id}: knowing the first stage must not determine the remaining three`);
  }
});

test("current challenges round-trip while earlier saved operations keep their chain and dice without a false replay code", () => {
  const setup = { scenario: 2, difficulty: "operational" as const, mode: "daily" as const, specialist: "hunter" as const, seed: 4242 };
  const current = newGame(setup.scenario, setup.difficulty, seededChallengeRandom(setup.seed), setup);
  assert.equal(current.challengeVersion, CHALLENGE_VERSION);
  assert.deepEqual(decodeChallenge(operationChallenge(current)!), setup);
  assert.equal(parseSession(serialiseSession(current, false, false))?.game.challengeVersion, CHALLENGE_VERSION);
  const oldCode = encodeChallenge(setup).replace(/^BC\d+-/, "BC9-");
  assert.equal(decodeChallenge(oldCode), null);
  assert.equal(isOutdatedChallenge(oldCode), true);

  const legacy = { ...current, chain: ["vendor", "delegation", "timer", "beacon"], challengeVersion: undefined };
  const restored = parseSession(serialiseSession(legacy, false, false))!.game;
  assert.deepEqual(restored.chain, legacy.chain);
  assert.equal(restored.seed, setup.seed);
  assert.equal(operationChallenge(restored), null);
  assert.equal(getShareCard(restored).code, null);
  assert.ok(!JSON.stringify(en(getResultSummary(restored))).includes(`BC${CHALLENGE_VERSION}-`));
  // Existing saves' d20 stream is unchanged by the new setup generator.
  assert.deepEqual(Array.from({ length: 6 }, (_, i) => seededRoll(4242, i)), [1, 19, 19, 3, 3, 9]);
});
