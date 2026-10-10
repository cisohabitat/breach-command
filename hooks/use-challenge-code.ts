"use client";

import { useState, useSyncExternalStore } from "react";
import { decodeChallenge, encodeChallenge, isOutdatedChallenge } from "@/lib/phase8";
import { scenarios } from "@/lib/game";
import type { GameMode } from "@/lib/command-systems";
import { weeklyOperation } from "@/lib/command-systems";
import { msg, type Message } from "@/lib/i18n/message";
import { register } from "@/lib/i18n";
import { sessionMessages } from "@/lib/i18n/en/session";

register(sessionMessages);


export type ChallengeSetup = NonNullable<ReturnType<typeof decodeChallenge>>;

// Today's date as a seed, read on the client only. The page is prerendered, so
// a seed taken from the build's clock would disagree with the visitor's on any
// later day and fail hydration.
function todaySeed() {
  const now = new Date();
  return Number(`${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`);
}
const noSubscription = () => () => {};
const thisWeeksSeed = () => weeklyOperation(new Date(), scenarios.length).seed;

// A challenge is a shareable configuration, not a game. It owns the seed, the
// code field and whether the player has deliberately chosen a reproducible
// operation — which is what decides if the seed reaches the hidden chain and the
// procedure rolls.
//
// Daily Operation always plays today's seed unless a code says otherwise, so a
// new seed cannot quietly turn it into a different case. A loaded or generated
// challenge applies to the next operation begun and is then spent: left in place,
// it made every later campaign operation replay the same chain.
export function useChallengeCode(applySetup: (setup: ChallengeSetup) => void) {
  const dailySeed = useSyncExternalStore(noSubscription, todaySeed, () => null);
  const weeklySeed = useSyncExternalStore(noSubscription, thisWeeksSeed, () => null);
  const [challenge, setChallenge] = useState<{ seed: number; source: "code" | "generated" } | null>(null);
  const [challengeInput, setChallengeInput] = useState("");
  const [challengeMessage, setChallengeMessage] = useState<Message | null>(null);

  function loadChallengeCode() {
    const setup = decodeChallenge(challengeInput);
    if (!setup) {
      setChallengeMessage(isOutdatedChallenge(challengeInput)
        ? msg("session.challengeOutdated")
        : msg("session.challengeUnknown"));
      return;
    }
    applySetup(setup);
    setChallenge({ seed: setup.seed, source: "code" });
    setChallengeMessage(msg("session.challengeLoaded"));
  }

  // Loads a code the game itself produced, as the replay with the Bot Commander
  // does, without going through the code field.
  function applyCode(code: string) {
    const setup = decodeChallenge(code);
    if (!setup) return false;
    applySetup(setup);
    setChallenge({ seed: setup.seed, source: "code" });
    setChallengeMessage(msg("session.replayLoaded"));
    return true;
  }

  function generateSeed() {
    setChallenge({ seed: 100000 + Math.floor(Math.random() * 900000), source: "generated" });
    setChallengeMessage(msg("session.challengeGenerated"));
  }

  // The seed the next operation will use, and whether it is a promise to replay.
  // An ordinary campaign operation has no seed of its own: it is shown today's
  // configuration code, but its chain and rolls are drawn fresh.
  function seedFor(mode: GameMode): { seed: number | null; reproducible: boolean } {
    if (mode === "daily" && challenge?.source !== "code") return { seed: dailySeed, reproducible: true };
    if (mode === "weekly" && challenge?.source !== "code") return { seed: weeklySeed, reproducible: true };
    if (challenge) return { seed: challenge.seed, reproducible: true };
    return { seed: dailySeed, reproducible: false };
  }

  function spendChallenge() {
    if (!challenge) return;
    setChallenge(null);
    setChallengeMessage(null);
  }

  const codeFor = (scenario: number, difficulty: ChallengeSetup["difficulty"], mode: ChallengeSetup["mode"], specialist: ChallengeSetup["specialist"]) => {
    const { seed } = seedFor(mode);
    return seed === null ? null : encodeChallenge({ scenario, difficulty, mode, specialist, seed });
  };

  return { todaySeed, seedFor, applyCode, spendChallenge, challengeInput, setChallengeInput, challengeMessage, loadChallengeCode, generateSeed, codeFor };
}
