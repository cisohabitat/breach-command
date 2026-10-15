import assert from "node:assert/strict";
import { test } from "node:test";
import { landOnInvestigation, recoverFocus } from "../hooks/use-recover-focus.ts";

function environment() {
  const frames: FrameRequestCallback[] = [];
  const scrolls: unknown[] = [];
  const body = {};
  const original = {};
  const chosen = {};
  const document = {
    body,
    activeElement: original,
    querySelector(selector: string) {
      if (selector === ".investigation-dashboard") return { getBoundingClientRect: () => ({ top: 200 }) };
      if (selector === ".investigation-actions") return { focus: () => { document.activeElement = actions; } };
      return null;
    },
  };
  const actions = {};
  const values = { document, window: { scrollY: 100, scrollTo: (position: unknown) => scrolls.push(position) }, requestAnimationFrame: (callback: FrameRequestCallback) => { frames.push(callback); return frames.length; } };
  const descriptors = Object.fromEntries(Object.keys(values).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(values)) Object.defineProperty(globalThis, key, { configurable: true, value });
  return {
    document, body, original, chosen, actions, scrolls,
    frame: () => { const callback = frames.shift(); assert.ok(callback); callback(0); },
    restore: () => { for (const [key, descriptor] of Object.entries(descriptors)) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); } },
  };
}

test("deferred investigation recovery preserves a player's newer focus and scroll", () => {
  const env = environment();
  try {
    env.document.activeElement = env.body;
    recoverFocus();
    env.document.activeElement = env.chosen;
    env.frame();
    assert.equal(env.document.activeElement, env.chosen);
    assert.deepEqual(env.scrolls, []);
  } finally { env.restore(); }
});

test("investigation navigation still lands when focus stays put or falls to the page", () => {
  for (const dropped of [false, true]) {
    const env = environment();
    try {
      assert.equal(landOnInvestigation(true), true);
      if (dropped) env.document.activeElement = env.body;
      env.frame();
      assert.equal(env.document.activeElement, env.actions);
      assert.equal(env.scrolls.length, 1);
    } finally { env.restore(); }
  }
});
