import type { Game } from "./engine/types.ts";
import { parseSaveJson } from "./safe-json.ts";
import { readStored, writeStored } from "./storage.ts";

export const LEARNING_KEY = "breach-command.learning";
export const lessonIds = ["signal", "confidence", "containment"] as const;
export type LessonId = typeof lessonIds[number];
export type Confidence = "low" | "medium" | "high";
export type Reflection = {
  operation: string; phase: number; confidence: Confidence; choice: string;
  confirmed: number; findings: number; strong: number; impact: number; continuity: number;
};
export type PracticeAttempt = { at: number; lesson: LessonId; answers: number[] };
export type LearningOperation = {
  id: string; at: number; scenario: number; lesson: LessonId;
  checks: number; bounded: number; comparisons: number; supported: number; serviceCost: number;
};
export type LearningRecord = { version: 1; attempts: PracticeAttempt[]; operations: LearningOperation[]; reflections: Reflection[] };
export const emptyLearning = (): LearningRecord => ({ version: 1, attempts: [], operations: [], reflections: [] });
export const isLesson = (value: unknown): value is LessonId => lessonIds.some(id => id === value);
const integer = (value: unknown, max: number) => Number.isInteger(value) && (value as number) >= 0 && (value as number) <= max;
export const isLearningId = (value: unknown): value is string => typeof value === "string" && /^[a-zA-Z0-9-]{1,80}$/.test(value);

// A small, independently versioned notebook. Future versions are preserved;
// malformed records are rejected rather than rendered or partially trusted.
export function parseLearning(value: unknown): LearningRecord | null {
  if (!value || typeof value !== "object") return null;
  const r = value as LearningRecord;
  if (r.version !== 1 || !Array.isArray(r.attempts) || !Array.isArray(r.operations) || !Array.isArray(r.reflections)
    || r.attempts.length > 100 || r.operations.length > 100 || r.reflections.length > 300) return null;
  if (!r.attempts.every(a => a && integer(a.at, 8.64e15) && isLesson(a.lesson) && Array.isArray(a.answers) && a.answers.length === 3 && a.answers.every(answer => integer(answer, 2)))) return null;
  if (!r.operations.every(o => o && isLearningId(o.id) && integer(o.at, 8.64e15) && integer(o.scenario, 9) && isLesson(o.lesson)
    && [o.checks, o.bounded, o.comparisons, o.supported, o.serviceCost].every(n => integer(n, 10000)) && o.bounded <= o.checks && o.supported <= o.comparisons)) return null;
  if (!r.reflections.every(f => f && isLearningId(f.operation) && integer(f.phase, 2) && ["low", "medium", "high"].includes(f.confidence)
    && typeof f.choice === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(f.choice) && integer(f.confirmed, 4)
    && integer(f.findings, 1000) && integer(f.strong, f.findings) && integer(f.impact, 100) && integer(f.continuity, 100))) return null;
  return {
    version: 1,
    attempts: r.attempts.map(a => ({ at: a.at, lesson: a.lesson, answers: [...a.answers] })),
    operations: r.operations.map(o => ({ id: o.id, at: o.at, scenario: o.scenario, lesson: o.lesson, checks: o.checks, bounded: o.bounded, comparisons: o.comparisons, supported: o.supported, serviceCost: o.serviceCost })),
    reflections: r.reflections.map(f => ({ operation: f.operation, phase: f.phase, confidence: f.confidence, choice: f.choice, confirmed: f.confirmed, findings: f.findings, strong: f.strong, impact: f.impact, continuity: f.continuity })),
  };
}

let memory = emptyLearning();
let memoryOnly = false;
const listeners = new Set<() => void>();
export function subscribeLearning(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function readLearning() {
  if (memoryOnly) return memory;
  const raw = readStored(LEARNING_KEY);
  if (!raw) return memory;
  try { return parseLearning(parseSaveJson(raw)) ?? emptyLearning(); } catch { return emptyLearning(); }
}
export function updateLearning(change: (record: LearningRecord) => LearningRecord): boolean {
  const raw = readStored(LEARNING_KEY);
  // Never overwrite a malformed or newer notebook implicitly. Explicit clear
  // is the only destructive action and has its own confirmation in the UI.
  if (raw) { try { if (!parseLearning(parseSaveJson(raw))) return false; } catch { return false; } }
  const next = parseLearning(change(readLearning()));
  if (!next) return false;
  memory = next;
  const kept = writeStored(LEARNING_KEY, JSON.stringify(next));
  memoryOnly = !kept;
  listeners.forEach(listener => listener());
  return kept;
}
export function clearLearning() {
  memory = emptyLearning();
  const kept = writeStored(LEARNING_KEY, JSON.stringify(memory));
  memoryOnly = !kept;
  listeners.forEach(listener => listener());
  return kept;
}
export function recordReflection(reflection: Reflection) {
  return updateLearning(record => ({ ...record, reflections: [...record.reflections.filter(r => r.operation !== reflection.operation || r.phase !== reflection.phase), reflection].slice(-300) }));
}
export function recommendPractice(game: Game): LessonId {
  if (game.status === "playing" || game.status === "response") return "signal";
  if (game.decisions.some(d => d.continuityChange < -5) || game.continuity < 50) return "containment";
  if (game.correlations.some(c => !c.valid) || !game.correlations.length) return "confidence";
  return "signal";
}
export function recordLearningOperation(game: Game, id: string) {
  if (game.status === "playing" || game.status === "response") return false;
  const row: LearningOperation = { id, at: Date.now(), scenario: game.scenario, lesson: recommendPractice(game),
    checks: game.turns.length, bounded: game.turns.filter(t => t.success && !t.revealed && !t.injectReveal).length,
    comparisons: game.correlations.length, supported: game.correlations.filter(c => c.valid).length,
    serviceCost: game.decisions.reduce((sum, d) => sum + Math.max(0, -d.continuityChange), 0) };
  return updateLearning(record => record.operations.some(o => o.id === id) ? record : { ...record, operations: [...record.operations, row].slice(-100) });
}
