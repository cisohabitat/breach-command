"use client";

import { useState } from "react";
import { decodeChallenge, encodeChallenge } from "@/lib/phase8";

export type ChallengeSetup = NonNullable<ReturnType<typeof decodeChallenge>>;

// A challenge is a shareable configuration, not a game. It owns the seed, the
// code field and whether the player has deliberately chosen a reproducible
// operation — which is what decides if the seed reaches the procedure rolls.
export function useChallengeCode(applySetup: (setup: ChallengeSetup) => void) {
  const [challengeSeed, setChallengeSeed] = useState(() => {
    const now = new Date();
    return Number(`${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}`);
  });
  const [challengeInput, setChallengeInput] = useState("");
  const [challengeActive, setChallengeActive] = useState(false);
  const [challengeMessage, setChallengeMessage] = useState("");

  function loadChallengeCode() {
    const setup = decodeChallenge(challengeInput);
    if (!setup) {
      setChallengeMessage("Code not recognised. Check every character and try again.");
      return;
    }
    applySetup(setup);
    setChallengeSeed(setup.seed);
    setChallengeActive(true);
    setChallengeMessage("Challenge loaded. Review the assignment and begin when ready.");
  }

  function generateSeed() {
    setChallengeSeed(100000 + Math.floor(Math.random() * 900000));
    setChallengeActive(true);
    setChallengeMessage("New challenge generated.");
  }

  const codeFor = (scenario: number, difficulty: ChallengeSetup["difficulty"], mode: ChallengeSetup["mode"], specialist: ChallengeSetup["specialist"]) =>
    encodeChallenge({ scenario, difficulty, mode, specialist, seed: challengeSeed });

  return { challengeSeed, challengeActive, challengeInput, setChallengeInput, challengeMessage, loadChallengeCode, generateSeed, codeFor };
}
