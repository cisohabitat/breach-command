import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { captainVoiceMessages } from "../lib/i18n/en/captain-voice.ts";
import { newGame, playTurn, attacks } from "../lib/advanced-game.ts";
import { captainUpdateFor } from "../lib/captain-voice.ts";
import { speakCaptain, type CaptainSpeechState } from "../lib/captain-speech.ts";

test("bundled recordings match the authored captions and fit the playback deadline", () => {
  const directory = new URL("../public/audio/captain/", import.meta.url);
  const manifest = JSON.parse(readFileSync(new URL("manifest.json", directory), "utf8"));
  assert.equal(Object.keys(manifest.clips).length, 8);
  for (const [cue, clip] of Object.entries(manifest.clips) as [string, { text: string; durationSeconds: number }][]) {
    assert.equal(clip.text, captainVoiceMessages[`captainVoice.${cue}` as keyof typeof captainVoiceMessages]);
    assert.ok(clip.durationSeconds > 1 && clip.durationSeconds < 20);
    assert.ok(readFileSync(new URL(`${cue}.mp3`, directory)).length > 1000);
  }
});

test("Captain updates follow public findings, not hidden answers", () => {
  const opening = { ...newGame(0, "training", () => 0), injectDeck: [] };
  const procedure = attacks.find(attack => attack.id === opening.chain[0])!.detect[0];
  const found = playTurn(opening, procedure, 20);
  const turn = found.turns[0];
  assert.equal(captainUpdateFor(found, turn), "firstFinding");
  const hiddenChanged = { ...found, chain: [...found.chain].reverse(), objective: "fraud" as const, adversaryProfile: "ember" as const };
  assert.equal(captainUpdateFor(hiddenChanged, turn), "firstFinding");
  assert.equal(captainUpdateFor({ ...found, scenario: 1 }, turn), null);
  assert.equal(captainUpdateFor({ ...found, status: "lost" }, turn), null);
  assert.equal(captainUpdateFor(found, { ...turn, number: 0 }), null);
  assert.equal(captainUpdateFor({ ...found, revealed: found.chain.slice(0, 2) }, turn), "connectedFindings");
  const empty = { ...turn, revealed: null, injectReveal: null, impactChange: 8, continuityChange: 0 };
  assert.equal(captainUpdateFor({ ...found, revealed: [], impact: 76 }, empty), "pressure");
  assert.equal(captainUpdateFor({ ...found, revealed: [], impact: 84 }, empty), null, "no pressure narration every turn above the threshold");
});

function installAudio() {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  const probe = { states: [] as CaptainSpeechState[], clips: [] as Audio[], cancellations: 0, throws: false };
  class Audio {
    src: string;
    volume = 1;
    onplaying: (() => void) | null = null;
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(src: string) { this.src = src; probe.clips.push(this); }
    play() {
      if (probe.throws) throw new Error("playback refused");
      this.onplaying?.();
      return Promise.resolve();
    }
    pause() { probe.cancellations++; }
    removeAttribute() {}
    load() {}
  }
  Object.defineProperty(globalThis, "window", { configurable: true, value: { Audio } });
  return {
    probe,
    restore: () => {
      if (descriptor) Object.defineProperty(globalThis, "window", descriptor);
      else Reflect.deleteProperty(globalThis, "window");
    },
  };
}

test("recorded clips replace rather than overlap and stop without stale callbacks", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { probe, restore } = installAudio();
  let stop = () => {};
  try {
    stop = speakCaptain("opening", state => probe.states.push(state));
    assert.equal(probe.clips[0].src, "/audio/captain/opening.mp3");
    assert.equal(probe.states.at(-1), "speaking");
    const oldEnd = probe.clips[0].onended;
    stop = speakCaptain("firstFinding", state => probe.states.push(state));
    assert.equal(probe.cancellations, 1);
    oldEnd?.();
    assert.equal(probe.states.at(-1), "speaking", "stale callbacks cannot end the replacement");
    stop();
    assert.equal(probe.cancellations, 2);
    assert.equal(probe.states.at(-1), "idle");
    t.mock.timers.tick(30_000);
    assert.equal(probe.states.at(-1), "idle");
  } finally { stop(); restore(); }
});

test("playback errors and missing end events fail without blocking", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { probe, restore } = installAudio();
  let stop = () => {};
  try {
    probe.throws = true;
    assert.doesNotThrow(() => { stop = speakCaptain("opening", state => probe.states.push(state)); });
    assert.equal(probe.states.at(-1), "unavailable");
    probe.throws = false;
    stop = speakCaptain("pressure", state => probe.states.push(state));
    probe.clips.at(-1)!.onerror?.();
    assert.equal(probe.states.at(-1), "unavailable");
    stop = speakCaptain("response", state => probe.states.push(state));
    t.mock.timers.tick(25_000);
    assert.equal(probe.states.at(-1), "unavailable");
    assert.ok(probe.cancellations > 0);
  } finally { stop(); restore(); }
});
