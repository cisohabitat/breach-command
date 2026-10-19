import assert from "node:assert/strict";
import { test } from "node:test";

test("speech ducks enabled music and restores it smoothly without reviving muted music", async t => {
  const gains: { targets: [number, number][] }[] = [];
  const parameter = () => ({ value: 0, setTargetAtTime() {} });
  const node = () => ({ connect() {}, disconnect() {} });
  class Context {
    currentTime = 1;
    state = "running";
    destination = node();
    createGain() {
      const record = { targets: [] as [number, number][] }; gains.push(record);
      return { ...node(), gain: { value: 0, setTargetAtTime(value: number, _at: number, time: number) { record.targets.push([value, time]); } } };
    }
    createDynamicsCompressor() { return { ...node(), threshold: parameter(), knee: parameter(), ratio: parameter(), attack: parameter(), release: parameter() }; }
    createBiquadFilter() { return { ...node(), frequency: parameter(), Q: parameter() }; }
    createOscillator() { return { ...node(), frequency: parameter(), detune: parameter(), start() {}, stop() {} }; }
  }
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: { AudioContext: Context, setTimeout: () => 1, clearTimeout() {} } });
  t.after(() => original ? Object.defineProperty(globalThis, "window", original) : Reflect.deleteProperty(globalThis, "window"));
  const { setAdaptiveScore, setNarrationActive } = await import("../lib/feedback.ts");
  setAdaptiveScore(true, 0);
  assert.deepEqual(gains[2].targets.at(-1), [0.02, 0.35]);
  setNarrationActive(true);
  assert.deepEqual(gains[2].targets.at(-1), [0.004, 0.08]);
  assert.equal(gains[1].targets.at(-1)?.[0], 0.0001, "effects remain suppressed during narration");
  setAdaptiveScore(true, 1);
  assert.equal(gains[2].targets.at(-1)?.[0], 0.016, "pressure updates retain the duck");
  setNarrationActive(false);
  assert.deepEqual(gains[2].targets.at(-1), [0.08, 0.4]);
  setAdaptiveScore(false);
  setNarrationActive(true);
  setNarrationActive(false);
  assert.equal(gains[2].targets.at(-1)?.[0], 0.0001, "ending speech never unmutes disabled music");
});
