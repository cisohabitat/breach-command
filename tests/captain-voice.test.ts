import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { captainVoiceMessages } from "../lib/i18n/en/captain-voice.ts";
import { newGame, playTurn, resolveDecision, attacks } from "../lib/advanced-game.ts";
import { captainOpeningFor } from "../lib/captain-voice.ts";
import { captainUpdateFor } from "../lib/captain-update.ts";
import { captainDebriefFor } from "../lib/captain-debrief.ts";
import { scheduleCaptain, speakCaptain, type CaptainSpeechState } from "../lib/captain-speech.ts";

test("bundled recordings match the authored captions and fit the playback deadline", () => {
  const directory = new URL("../public/audio/captain/", import.meta.url);
  const manifest = JSON.parse(readFileSync(new URL("manifest.json", directory), "utf8"));
  assert.equal(Object.keys(manifest.clips).length, 51);
  for (let scenario = 0; scenario < 10; scenario++) assert.ok(manifest.clips[captainOpeningFor(scenario)], "every case has a recorded opening");
  for (const [cue, clip] of Object.entries(manifest.clips) as [string, { text: string; durationSeconds: number }][]) {
    assert.equal(clip.text, captainVoiceMessages[`captainVoice.${cue}` as keyof typeof captainVoiceMessages]);
    assert.ok(clip.durationSeconds > 1 && clip.durationSeconds < 20);
    assert.ok(readFileSync(new URL(`${cue}.mp3`, directory)).length > 1000);
  }
});

test("spoken debrief selects only finished results and supported strengths", () => {
  const initial = newGame(0, "training", () => 0);
  assert.deepEqual(captainDebriefFor(initial), []);
  assert.deepEqual(captainDebriefFor({ ...initial, status: "response" }), []);
  assert.deepEqual(captainDebriefFor({ ...initial, status: "won" }), [], "a recovery grade must come from the actual outcome");
  for (const grade of ["A", "B", "C", "D"]) assert.equal(captainDebriefFor({ ...initial, status: "won" }, grade).length, 3);
  const lost = { ...initial, status: "lost" as const, impact: 100 };
  assert.deepEqual(captainDebriefFor(lost), ["reviewImpact", "reviewNoStrength", "reviewServices"]);
  assert.equal(captainDebriefFor({ ...lost, objectiveProgress: 100 })[0], "reviewObjective");
  assert.equal(captainDebriefFor({ ...initial, status: "lost", continuity: 0 })[0], "reviewContinuityLost");
  assert.equal(captainDebriefFor({ ...initial, status: "lost", sectorHealth: 0 })[0], "reviewSector");
  assert.equal(captainDebriefFor({ ...initial, status: "lost" })[0], "reviewWindow");
  assert.equal(captainDebriefFor({ ...initial, status: "exercise" })[0], "reviewExercise");
  const found = playTurn({ ...initial, injectDeck: [] }, attacks.find(attack => attack.id === initial.chain[0])!.detect[0], 20);
  const ended = { ...found, status: "lost" as const, impact: 100 };
  assert.equal(captainDebriefFor(ended)[1], "reviewEvidence");
  assert.equal(captainDebriefFor(ended)[2], "reviewReading");
  const assessed = resolveDecision(found, "observe");
  const reviewed = { ...assessed, status: "lost" as const, impact: 100 };
  for (const choice of ["contain", "observe", "attribute", "notify", "act"] as const) {
    const decision = { ...assessed.decisions[0], choice, quality: 3 };
    const cues = captainDebriefFor({ ...reviewed, decisions: [decision] });
    assert.equal(cues[1], { contain: "reviewContain", observe: "reviewObserve", attribute: "reviewAttribute", notify: "reviewNotify", act: "reviewAct" }[choice]);
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
  for (let scenario = 0; scenario < 10; scenario++) assert.equal(captainUpdateFor({ ...found, scenario }, turn), "firstFinding");
  assert.equal(captainUpdateFor({ ...found, status: "lost" }, turn), null);
  assert.equal(captainUpdateFor(found, { ...turn, number: 0 }), null);
  assert.equal(captainUpdateFor({ ...found, revealed: found.chain.slice(0, 2) }, turn), "connectedFindings");
  assert.equal(captainUpdateFor({ ...found, revealed: found.chain.slice(0, 3) }, turn), "thirdFinding");
  assert.equal(captainUpdateFor(found, { ...turn, windfall: true }), "unexpectedFinding");
  assert.equal(captainUpdateFor({ ...found, impact: 76 }, { ...turn, impactChange: 8 }), "pressure", "a finding cannot suppress an urgent pressure crossing");
  assert.equal(captainUpdateFor({ ...found, continuity: 34 }, { ...turn, continuityChange: -8, windfall: true }), "pressure");
  const empty = { ...turn, revealed: null, injectReveal: null, impactChange: 8, continuityChange: 0 };
  assert.equal(captainUpdateFor({ ...found, revealed: [], impact: 76 }, empty), "pressure");
  assert.equal(captainUpdateFor({ ...found, revealed: [], impact: 84 }, empty), "noFinding", "no pressure narration every turn above the threshold");
  assert.equal(captainUpdateFor({ ...found, revealed: [] }, { ...empty, success: false }), "failedCheck");
  assert.equal(captainUpdateFor({ ...found, revealed: [], continuity: 61 }, { ...empty, continuityChange: 10 }), "serviceStabilising");
  assert.equal(captainUpdateFor({ ...found, revealed: [], evidence: [{ ...found.evidence[0], turn: empty.number, confidence: "LOW" }] }, empty), "weakSignal");
  assert.equal(captainUpdateFor({ ...found, revealed: [] }, { ...empty, inject: { id: "test", reason: empty.narrative } }), "newDevelopment");
  const second = { ...empty, number: 2 };
  assert.equal(captainUpdateFor({ ...found, revealed: [], turns: [empty, second] }, second), "noFindingAgain");
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

test("routine speech waits for input to settle and urgent speech preempts it", t => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: 100_000 });
  const { probe, restore } = installAudio();
  const activity = new EventTarget();
  const stops: (() => void)[] = [];
  let starts = 0;
  try {
    stops.push(scheduleCaptain(["firstFinding"], () => {}, () => starts++, activity));
    t.mock.timers.tick(1000);
    activity.dispatchEvent(new Event("keydown"));
    t.mock.timers.tick(1000);
    assert.equal(starts, 0);
    t.mock.timers.tick(500);
    assert.equal(starts, 1);
    stops.push(scheduleCaptain(["weakSignal"], () => {}, () => starts++, activity));
    t.mock.timers.tick(1500);
    assert.equal(starts, 1, "routine speech cannot interrupt a playing line");
    stops.push(scheduleCaptain(["pressure"], () => {}, () => starts++, activity, true));
    activity.dispatchEvent(new Event("pointerdown"));
    t.mock.timers.tick(300);
    assert.equal(starts, 2);
    assert.equal(probe.cancellations, 1);
    assert.equal(probe.clips.at(-1)!.src, "/audio/captain/pressure.mp3");
    probe.clips.at(-1)!.onended?.();
    t.mock.timers.tick(1200);
    assert.equal(starts, 2, "leave a breathing gap after another line ends");
    t.mock.timers.tick(1500);
    assert.equal(starts, 3);
    const cancel = scheduleCaptain(["newDevelopment"], () => {}, () => starts++, activity);
    cancel();
    t.mock.timers.tick(3000);
    assert.equal(starts, 3, "a canceled queue cannot speak or mark a line heard");
  } finally { for (const stop of stops) stop(); restore(); }
});

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

test("a spoken review plays its segments in order and skip cancels the remainder", () => {
  const { probe, restore } = installAudio();
  let stop = () => {};
  try {
    stop = speakCaptain(["reviewStable", "reviewEvidence", "reviewPractice"], state => probe.states.push(state));
    const audio = probe.clips[0];
    assert.equal(audio.src, "/audio/captain/reviewStable.mp3");
    audio.onended?.();
    assert.equal(audio.src, "/audio/captain/reviewEvidence.mp3");
    assert.equal(probe.clips.length, 1, "reuse the media element's playback permission");
    const staleEnd = audio.onended;
    stop();
    staleEnd?.();
    assert.equal(audio.src, "/audio/captain/reviewEvidence.mp3", "skip cannot start the remaining review segment");
    assert.equal(probe.states.at(-1), "idle");
    stop = speakCaptain(["reviewStable", "reviewEvidence", "reviewPractice"], state => probe.states.push(state));
    const complete = probe.clips.at(-1)!;
    complete.onended?.(); complete.onended?.(); complete.onended?.();
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
