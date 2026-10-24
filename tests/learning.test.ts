import assert from "node:assert/strict";
import { test } from "node:test";
import { newGame } from "../lib/advanced-game.ts";
import { emptyLearning, parseLearning, recommendPractice, recordLearningOperation, recordReflection, updateLearning, readLearning, clearLearning, LEARNING_KEY } from "../lib/learning.ts";
import { practiceCases, practiceScore } from "../lib/practice.ts";
import { parseSession, serialiseSession, serialiseBackupSession } from "../lib/session.ts";
import { msg } from "../lib/i18n/message.ts";

test("practice covers four bounded, deterministic exercises and keeps first choices", () => {
  for (const [id, questions] of Object.entries(practiceCases)) {
    assert.equal(questions.length, 3);
    assert.ok(questions.every(q => q.options.length === 3 && q.correct >= 0 && q.correct < 3));
    assert.equal(practiceScore(id as keyof typeof practiceCases, questions.map(q => q.correct)), 3);
    assert.equal(practiceScore(id as keyof typeof practiceCases, questions.map(q => (q.correct + 1) % 3)), 0);
  }
});
test("learning input rejects unsafe counts, identifiers, incomplete attempts and future versions", () => {
  assert.deepEqual(parseLearning(emptyLearning()), emptyLearning());
  for (const value of [null, { ...emptyLearning(), version: 3 }, { ...emptyLearning(), attempts: [{ at: 1, lesson: "signal", answers: [1] }] }, { ...emptyLearning(), attempts: [{ at: 1, lesson: "constructor", answers: [1, 0, 2] }] }, { ...emptyLearning(), attempts: [{ at: -1, lesson: "signal", answers: [1, 0, 2] }] }]) assert.equal(parseLearning(value), null);
  const snapshot = { operation: "operation-1", phase: 0, confidence: "high", choice: "targeted", confirmed: 4, findings: 2, strong: 1, impact: 20, continuity: 80 };
  assert.ok(parseLearning({ ...emptyLearning(), reflections: [snapshot] }));
  for (const bad of [{ strong: 3 }, { phase: 3 }, { impact: NaN }, { operation: "<script>" }, { confidence: "certain" }]) assert.equal(parseLearning({ ...emptyLearning(), reflections: [{ ...snapshot, ...bad }] }), null);
});
test("practice follows the debrief's next lesson ahead of a secondary service cost", () => {
  const game = { ...newGame(0, "training", () => 0), status: "lost" as const, continuity: 10 };
  assert.equal(recommendPractice(game, msg("engine.review.nextOperationOnce")), "confidence");
  assert.equal(recommendPractice(game, msg("engine.review.nextOperationRead")), "containment");
  assert.equal(recommendPractice(game, msg("engine.review.nextOperationPrefer")), "signal");
});
test("local learning deduplicates operations and reflections, protects future data, and survives quota in memory", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const values = new Map<string, string>();
  let full = false;
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { if (full) throw Error("quota"); values.set(key, value); } } });
  try {
    clearLearning();
    const game = { ...newGame(0, "training", () => 0), status: "lost" as const };
    Object.defineProperty(game, "chain", { get() { throw Error("hidden chain read"); } });
    Object.defineProperty(game, "objective", { get() { throw Error("hidden objective read"); } });
    assert.equal(recommendPractice(game), "confidence");
    recordLearningOperation(game, "operation-1"); recordLearningOperation(game, "operation-1");
    assert.equal(readLearning().operations.length, 1);
    const snapshot = { operation: "operation-1", phase: 0, confidence: "low" as const, choice: "targeted", confirmed: 4, findings: 2, strong: 1, impact: 20, continuity: 80 };
    recordReflection(snapshot); recordReflection({ ...snapshot, confidence: "high" });
    assert.equal(readLearning().reflections.length, 1);
    assert.equal(readLearning().reflections[0].confidence, "high");
    const future = JSON.stringify({ version: 99 }); values.set(LEARNING_KEY, future);
    assert.equal(updateLearning(record => record), false); assert.equal(values.get(LEARNING_KEY), future);
    clearLearning(); full = true;
    assert.equal(updateLearning(r => ({ ...r, attempts: [{ at: 1, lesson: "signal", answers: [1, 0, 2] }] })), false);
    assert.equal(readLearning().attempts.length, 1);
    assert.equal(values.get(LEARNING_KEY), JSON.stringify(emptyLearning()));
    full = false; clearLearning();
  } finally { if (original) Object.defineProperty(globalThis, "localStorage", original); else Reflect.deleteProperty(globalThis, "localStorage"); }
});
test("the optional notebook identity survives save, Resume and backup without changing the game", () => {
  const game = newGame(0, "training", () => 0);
  const before = JSON.stringify(game);
  const saved = parseSession(serialiseSession(game, true, false, "operation-1"))!;
  assert.equal(saved.learningId, "operation-1");
  assert.equal(parseSession(serialiseBackupSession(null, saved, false, true, false)!)!.learningId, "operation-1");
  assert.equal(parseSession(serialiseSession(game, true, false))!.learningId, undefined);
  assert.equal(parseSession(serialiseSession(game, true, false, "<script>"))!.learningId, undefined);
  assert.equal(JSON.stringify(game), before);
});

test("protected notebooks keep new attempts, reflections and operations in visit memory without touching stored bytes", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) } });
  try {
    for (const raw of ["{broken", JSON.stringify({ version: 99 }), JSON.stringify({ ...emptyLearning(), attempts: [null] })]) {
      clearLearning();
      values.set(LEARNING_KEY, raw);
      for (let at = 1; at <= 2; at++) assert.equal(updateLearning(r => ({ ...r, attempts: [...r.attempts, { at, lesson: "signal", answers: [1, 0, 2] }] })), false);
      assert.equal(recordReflection({ operation: "operation-1", phase: 0, confidence: "low", choice: "targeted", confirmed: 4, findings: 2, strong: 1, impact: 20, continuity: 80 }), false);
      assert.equal(recordLearningOperation({ ...newGame(0, "training", () => 0), status: "lost" }, "operation-1"), false);
      const visit = readLearning();
      assert.equal(visit.attempts.length, 2);
      assert.equal(visit.reflections.length, 1);
      assert.equal(visit.operations.length, 1);
      assert.equal(values.get(LEARNING_KEY), raw, "preserve the protected notebook byte-for-byte");
    }
    assert.equal(clearLearning(), true);
    assert.deepEqual(readLearning(), emptyLearning());
  } finally { if (original) Object.defineProperty(globalThis, "localStorage", original); else Reflect.deleteProperty(globalThis, "localStorage"); }
});
