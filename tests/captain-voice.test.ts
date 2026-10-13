import assert from "node:assert/strict";
import { test } from "node:test";
import { newGame, playTurn, attacks } from "../lib/advanced-game.ts";
import { captainUpdateFor } from "../lib/captain-voice.ts";
import { speakCaptain, type CaptainSpeechState } from "../lib/captain-speech.ts";

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

function installSpeech() {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  const events = new EventTarget();
  const probe = { states: [] as CaptainSpeechState[], utterances: [] as SpeechSynthesisUtterance[], cancellations: 0, throws: false, voices: [] as SpeechSynthesisVoice[] };
  const synth = {
    getVoices: () => probe.voices,
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    speak: (utterance: SpeechSynthesisUtterance) => {
      if (probe.throws) throw new Error("speech refused");
      probe.utterances.push(utterance);
      utterance.onstart?.({} as SpeechSynthesisEvent);
    },
    cancel: () => { probe.cancellations++; },
  };
  class Utterance {
    text: string;
    constructor(text: string) { this.text = text; }
  }
  Object.defineProperty(globalThis, "window", { configurable: true, value: { speechSynthesis: synth, SpeechSynthesisUtterance: Utterance } });
  const local = { name: "Installed voice", lang: "en-US", localService: true, default: true, voiceURI: "local" } as SpeechSynthesisVoice;
  return {
    probe, local, events,
    restore: () => {
      if (descriptor) Object.defineProperty(globalThis, "window", descriptor);
      else Reflect.deleteProperty(globalThis, "window");
    },
  };
}

test("speech waits for local voices, replaces rather than overlaps, and stops", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { probe, local, events, restore } = installSpeech();
  let stop = () => {};
  try {
    probe.voices = [{ ...local, localService: false }];
    stop = speakCaptain("First line", "en", state => probe.states.push(state));
    assert.deepEqual(probe.states, ["waiting"]);
    assert.equal(probe.utterances.length, 0, "remote voices are never selected");
    probe.voices = [local];
    events.dispatchEvent(new Event("voiceschanged"));
    assert.equal(probe.utterances.length, 1);
    assert.equal(probe.states.at(-1), "speaking");
    const oldEnd = probe.utterances[0].onend;
    stop = speakCaptain("Second line", "en", state => probe.states.push(state));
    assert.equal(probe.cancellations, 1);
    assert.equal(probe.utterances.length, 2);
    oldEnd?.call(probe.utterances[0], {} as SpeechSynthesisEvent);
    assert.equal(probe.states.at(-1), "speaking", "stale callbacks cannot end the replacement");
    stop();
    assert.equal(probe.cancellations, 2);
    assert.equal(probe.states.at(-1), "idle");
    t.mock.timers.tick(30_000);
    assert.equal(probe.states.at(-1), "idle", "cancelled timers cannot restart playback");
  } finally { stop(); restore(); }
});

test("missing voices, playback errors and missing end events fail without blocking", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { probe, local, restore } = installSpeech();
  let stop = () => {};
  try {
    stop = speakCaptain("No voice", "en", state => probe.states.push(state));
    t.mock.timers.tick(1500);
    assert.equal(probe.states.at(-1), "unavailable");
    assert.equal(probe.utterances.length, 0);
    probe.voices = [local];
    probe.throws = true;
    assert.doesNotThrow(() => { stop = speakCaptain("Refused", "en", state => probe.states.push(state)); });
    assert.equal(probe.states.at(-1), "unavailable");
    probe.throws = false;
    stop = speakCaptain("No end event", "en", state => probe.states.push(state));
    t.mock.timers.tick(25_000);
    assert.equal(probe.states.at(-1), "unavailable");
    assert.ok(probe.cancellations > 0);
  } finally { stop(); restore(); }
});
