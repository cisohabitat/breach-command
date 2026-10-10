// Challenge codes and the seeded draws they promise: the assignment screen
// reads and writes a code without the rest of ./phase8.ts.
import type { Difficulty } from "./scenarios.ts";
import type { GameMode, SpecialistId } from "./command-systems.ts";

export type ChallengeSetup = { scenario: number; difficulty: Difficulty; mode: GameMode; specialist: SpecialistId; seed: number };
const difficultyIds: Difficulty[] = ["training", "operational", "crisis"];
// Appended, never inserted: a code carries the index.
const modeIds: GameMode[] = ["campaign", "daily", "ironman", "escalation", "expert", "weekly"];
const specialistIds: SpecialistId[] = ["hunter", "forensics", "identity", "ot", "continuity", "communications"];

// A code promises the same operation, so it carries the version of the content
// it was made against. Increment this whenever a scenario's technique pools, the
// techniques themselves or the seeded draws change: an older code would
// otherwise decode cleanly and quietly play a different incident. Version 1
// codes were written as "BC-…" before the version was part of the code.
export const CHALLENGE_VERSION = 7;
const checksumOf = (text: string) => [...text].reduce((sum, char) => (sum + char.charCodeAt(0)) % 97, 0);

export function encodeChallenge(setup: ChallengeSetup) {
  const body = [setup.scenario, difficultyIds.indexOf(setup.difficulty), modeIds.indexOf(setup.mode), specialistIds.indexOf(setup.specialist), setup.seed].join("-");
  return `BC${CHALLENGE_VERSION}-${body}-${checksumOf(`${CHALLENGE_VERSION}:${body}`).toString().padStart(2, "0")}`;
}

export function decodeChallenge(code: string): ChallengeSetup | null {
  const match = /^BC(\d+)-(\d+)-(\d+)-(\d+)-(\d+)-(\d+)-(\d{2})$/i.exec(code.trim());
  if (!match || Number(match[1]) !== CHALLENGE_VERSION) return null;
  const [, version, scenarioRaw, difficultyRaw, modeRaw, specialistRaw, seedRaw, checksumRaw] = match;
  const body = [scenarioRaw, difficultyRaw, modeRaw, specialistRaw, seedRaw].join("-");
  const scenario = Number(scenarioRaw), difficulty = difficultyIds[Number(difficultyRaw)], mode = modeIds[Number(modeRaw)], specialist = specialistIds[Number(specialistRaw)], seed = Number(seedRaw);
  return checksumOf(`${version}:${body}`) === Number(checksumRaw) && scenario >= 0 && scenario < 10 && difficulty && mode && specialist && Number.isSafeInteger(seed) ? { scenario, difficulty, mode, specialist, seed } : null;
}

// A well-formed code from an earlier content version: it would decode to a
// different incident than the one it was shared for, so it is named as outdated
// rather than reported as mistyped.
export function isOutdatedChallenge(code: string) {
  const current = /^BC(\d+)-(?:\d+-){5}\d{2}$/i.exec(code.trim());
  if (current) return Number(current[1]) < CHALLENGE_VERSION;
  return /^BC-(?:\d+-){5}\d{2}$/i.test(code.trim());
}

// The nth d20 of a seeded operation is a pure function of the seed and the turn
// index, so nothing about the roll stream has to be stored, serialised or
// replayed: a challenge code reproduces the same sequence on any device, and a
// saved session resumes on exactly the roll it would have produced.
export function seededRoll(seed: number, index: number, faces = 20) {
  let state = ((seed >>> 0) + Math.imul(index + 1, 0x9e3779b9)) >>> 0;
  state = Math.imul(state ^ (state >>> 16), 0x21f0aaad) >>> 0;
  state = Math.imul(state ^ (state >>> 15), 0x735a2d97) >>> 0;
  state = (state ^ (state >>> 15)) >>> 0;
  return (state % faces) + 1;
}

export function seededChallengeRandom(seed: number) {
  let state = seed >>> 0;
  return (max: number) => { state = (state * 1664525 + 1013904223) >>> 0; return state % max; };
}
