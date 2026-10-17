import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";

let example = 0;
type Voice = { starts: number[]; stops: (number | undefined)[] };
let active = { voices: [] as Voice[], contexts: 0, failAfter: Infinity };
const parameter = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
const node = () => ({ connect() {}, disconnect() {} });
class Context {
  currentTime = 10;
  sampleRate = 48000;
  state = "running";
  destination = node();
  constructor() { active.contexts++; }
  createGain() { return { ...node(), gain: parameter() }; }
  createDynamicsCompressor() { return { ...node(), threshold: parameter(), knee: parameter(), ratio: parameter(), attack: parameter(), release: parameter() }; }
  createBiquadFilter() { return { ...node(), frequency: parameter(), Q: parameter(), type: "" }; }
  createBuffer(_channels: number, size: number) { return { getChannelData: () => new Float32Array(size) }; }
  createBufferSource() {
    if (active.voices.length === active.failAfter) throw new Error("audio device unavailable");
    const voice: Voice = { starts: [], stops: [] };
    active.voices.push(voice);
    return { ...node(), buffer: null, onended: null, start(time: number) { voice.starts.push(time); }, stop(time?: number) { voice.stops.push(time); } };
  }
}
async function audio(t: TestContext, hidden = false, failAfter = Infinity) {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  active = { voices: [], contexts: 0, failAfter };
  Object.defineProperty(globalThis, "window", { configurable: true, value: { AudioContext: Context } });
  Object.defineProperty(globalThis, "document", { configurable: true, value: { hidden } });
  t.after(() => {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow); else Reflect.deleteProperty(globalThis, "window");
    if (originalDocument) Object.defineProperty(globalThis, "document", originalDocument); else Reflect.deleteProperty(globalThis, "document");
  });
  const feedback = await import(new URL(`../lib/feedback.ts?dice=${++example}`, import.meta.url).href);
  return { play: feedback.playDiceRoll as (sound?: boolean, elapsed?: number) => () => void, voices: active.voices, contexts: () => active.contexts };
}

test("the rattle decelerates and lands within the visible roll", async t => {
  const { play, voices } = await audio(t);
  play();
  assert.equal(voices.length, 9);
  const starts = voices.map(voice => voice.starts[0]);
  assert.equal(starts[0], 10);
  assert.equal(starts.at(-1), 10.82);
  const gaps = starts.slice(1).map((time, index) => time - starts[index]);
  assert.ok(gaps.every((gap, index) => index === 0 || gap >= gaps[index - 1] - 1e-9));
  assert.ok(voices.every(voice => voice.stops[0]! <= 10.85));
});

test("muted, hidden and expired rolls create no audio context", async t => {
  const muted = await audio(t);
  muted.play(false);
  muted.play(true, 850);
  assert.equal(muted.contexts(), 0);
  Object.defineProperty(globalThis, "document", { configurable: true, value: { hidden: true } });
  muted.play();
  assert.equal(muted.contexts(), 0);
});

test("a late audio load schedules only the remaining impacts", async t => {
  const { play, voices } = await audio(t);
  play(true, 500);
  assert.deepEqual(voices.map(voice => voice.starts[0]), [10.15, 10.32]);
  assert.ok(voices.every(voice => voice.stops[0]! <= 10.35));
});

test("cancelling stops every scheduled impact, including the landing", async t => {
  const { play, voices } = await audio(t);
  const stop = play();
  stop();
  assert.equal(voices.length, 9);
  assert.ok(voices.every(voice => voice.stops.at(-1) === undefined));
  assert.doesNotThrow(stop);
});

test("a partial scheduling failure cancels the roll without throwing", async t => {
  const { play, voices } = await audio(t, false, 2);
  assert.doesNotThrow(() => play());
  assert.equal(voices.length, 2);
  assert.ok(voices.every(voice => voice.stops.at(-1) === undefined));
});

test("gesture unlock reuses one context and contains resume rejection", async t => {
  await audio(t);
  let resumed = 0;
  class Suspended extends Context {
    state = "suspended";
    resume() { resumed++; return Promise.reject(new Error("playback denied")); }
  }
  Object.defineProperty(globalThis, "window", { configurable: true, value: { AudioContext: Suspended } });
  const shared = await import(new URL("../lib/audio-context.ts?resume-test", import.meta.url).href);
  const first = shared.feedbackAudioContext();
  assert.ok(first);
  assert.equal(shared.feedbackAudioContext(), first);
  assert.equal(active.contexts, 1);
  assert.equal(resumed, 2);
  await new Promise(resolve => setImmediate(resolve));
  first.state = "closed";
  assert.equal(shared.feedbackAudioContext(), null);
});

test("an unavailable audio device is tried once and never throws", async t => {
  await audio(t);
  let attempts = 0;
  class Unavailable { constructor() { attempts++; throw new Error("no audio device"); } }
  Object.defineProperty(globalThis, "window", { configurable: true, value: { AudioContext: Unavailable } });
  const shared = await import(new URL("../lib/audio-context.ts?failure-test", import.meta.url).href);
  assert.equal(shared.feedbackAudioContext(), null);
  assert.equal(shared.feedbackAudioContext(), null);
  assert.equal(attempts, 1);
});
