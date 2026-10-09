import { readStored, writeStored } from "./storage.ts";

export const LAST_OPERATION_KEY = "breach-command.last-operation";

// The operation that ended last on this device and what the review suggested
// next, so a player who comes back days later is met with where they left off
// rather than an assignment screen that has forgotten them. Local, like
// everything else, and read defensively: a stale or edited record is ignored.
export type LastOperation = {
  scenario: number;
  difficulty: "training" | "operational" | "crisis";
  outcome: "won" | "lost" | "exercise";
  ending: string;
  score: number;
  endedAt: number;
  next: { scenario: number; difficulty: "training" | "operational" | "crisis"; title: string; reason: string };
};

const difficulty = (value: unknown) => value === "training" || value === "operational" || value === "crisis" ? value : null;
const index = (value: unknown, cases: number) => Number.isInteger(value) && (value as number) >= 0 && (value as number) < cases ? value as number : null;

export function parseLastOperation(raw: unknown, cases: number): LastOperation | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const next = r.next && typeof r.next === "object" ? r.next as Record<string, unknown> : null;
  const scenario = index(r.scenario, cases); const level = difficulty(r.difficulty);
  const nextScenario = next ? index(next.scenario, cases) : null; const nextLevel = next ? difficulty(next.difficulty) : null;
  if (scenario === null || !level || nextScenario === null || !nextLevel) return null;
  if (r.outcome !== "won" && r.outcome !== "lost" && r.outcome !== "exercise") return null;
  if (typeof r.endedAt !== "number" || typeof r.score !== "number" || typeof r.ending !== "string") return null;
  if (typeof next!.title !== "string" || typeof next!.reason !== "string") return null;
  return { scenario, difficulty: level, outcome: r.outcome, ending: r.ending, score: r.score, endedAt: r.endedAt, next: { scenario: nextScenario, difficulty: nextLevel, title: next!.title, reason: next!.reason } };
}

export function readLastOperation(cases: number): LastOperation | null {
  try { return parseLastOperation(JSON.parse(readStored(LAST_OPERATION_KEY) ?? "null"), cases); } catch { return null; }
}

export function writeLastOperation(record: LastOperation): boolean {
  return writeStored(LAST_OPERATION_KEY, JSON.stringify(record));
}

// "earlier today", "yesterday", "3 days ago", "on 2 October".
export function describeWhen(at: number, now = Date.now()): string {
  const day = 86_400_000;
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  if (at >= startOfToday.getTime()) return "earlier today";
  if (at >= startOfToday.getTime() - day) return "yesterday";
  const days = Math.floor((startOfToday.getTime() - at) / day) + 1;
  if (days < 7) return `${days} days ago`;
  return `on ${new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`;
}
