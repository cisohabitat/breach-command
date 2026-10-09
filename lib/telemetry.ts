import { readStored, removeStored, writeStored } from "./storage.ts";

export const TELEMETRY_KEY = "breach-command.balance";

export type FirstOutcome = "win" | "loss" | "exercise";

// What the first operation on this device looked like: when it began, when the
// first procedure ran, when the reading was first revised and how it ended.
// These are the facts the newcomer playtest protocol (docs/playtests) records
// by hand, kept here so a tester's device can be read back against the notes.
// They stay on the device and travel only in the player's own backup.
export type FirstSession = {
  startedAt: number | null;
  firstProcedureAt: number | null;
  firstRevisionAt: number | null;
  endedAt: number | null;
  outcome: FirstOutcome | null;
};

export type BalanceTelemetry = {
  operationsStarted: number;
  operationsFinished: number;
  wins: number;
  losses: number;
  exercises: number;
  turns: number;
  revisions: number;
  procedures: Record<string, number>;
  scenarios: Record<string, number>;
  firstSession: FirstSession;
};

export type TelemetryEvent = "start" | "turn" | "revision" | "win" | "loss" | "exercise";

function emptyFirstSession(): FirstSession {
  return { startedAt: null, firstProcedureAt: null, firstRevisionAt: null, endedAt: null, outcome: null };
}

// A fresh record every time. Handing out one shared default let the counters
// accumulate on it, so a cleared record still showed the old totals.
export function emptyTelemetry(): BalanceTelemetry {
  return { operationsStarted: 0, operationsFinished: 0, wins: 0, losses: 0, exercises: 0, turns: 0, revisions: 0, procedures: {}, scenarios: {}, firstSession: emptyFirstSession() };
}

const count = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
const moment = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
const counts = (value: unknown) => {
  const out: Record<string, number> = {};
  if (value && typeof value === "object" && !Array.isArray(value)) for (const [key, entry] of Object.entries(value)) if (count(entry)) out[key] = count(entry);
  return out;
};

// Reads a record from text the player may have edited, or from an older build:
// anything that is not a count or a time falls back to empty rather than
// carrying through to the settings panel.
export function parseTelemetry(raw: unknown): BalanceTelemetry {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return emptyTelemetry();
  const saved = raw as Record<string, unknown>;
  const first = saved.firstSession && typeof saved.firstSession === "object" ? saved.firstSession as Record<string, unknown> : {};
  const outcome = first.outcome === "win" || first.outcome === "loss" || first.outcome === "exercise" ? first.outcome : null;
  return {
    operationsStarted: count(saved.operationsStarted),
    operationsFinished: count(saved.operationsFinished),
    wins: count(saved.wins),
    losses: count(saved.losses),
    exercises: count(saved.exercises),
    turns: count(saved.turns),
    revisions: count(saved.revisions),
    procedures: counts(saved.procedures),
    scenarios: counts(saved.scenarios),
    firstSession: {
      startedAt: moment(first.startedAt),
      firstProcedureAt: moment(first.firstProcedureAt),
      firstRevisionAt: moment(first.firstRevisionAt),
      endedAt: moment(first.endedAt),
      outcome,
    },
  };
}

export function readTelemetry(): BalanceTelemetry {
  try {
    return parseTelemetry(JSON.parse(readStored(TELEMETRY_KEY) ?? "null"));
  } catch { return emptyTelemetry(); }
}

export function writeTelemetry(data: BalanceTelemetry): boolean {
  return writeStored(TELEMETRY_KEY, JSON.stringify(data));
}

// An authorised exercise is its own conclusion, not a defeat, so it is counted
// apart from wins and losses. The first-session times are set once and never
// moved, so they describe the first operation on the device, not the latest.
export function recordTelemetry(event: TelemetryEvent, detail: { scenario?: number; procedure?: string; now?: number } = {}) {
  const data = readTelemetry();
  const now = detail.now ?? Date.now();
  const first = data.firstSession;
  if (event === "start") {
    data.operationsStarted += 1;
    if (detail.scenario !== undefined) data.scenarios[String(detail.scenario)] = (data.scenarios[String(detail.scenario)] ?? 0) + 1;
    first.startedAt ??= now;
  }
  if (event === "turn") {
    data.turns += 1;
    if (detail.procedure) data.procedures[detail.procedure] = (data.procedures[detail.procedure] ?? 0) + 1;
    if (first.startedAt !== null) first.firstProcedureAt ??= now;
  }
  if (event === "revision") {
    data.revisions += 1;
    if (first.startedAt !== null) first.firstRevisionAt ??= now;
  }
  if (event === "win" || event === "loss" || event === "exercise") {
    data.operationsFinished += 1;
    data[event === "win" ? "wins" : event === "loss" ? "losses" : "exercises"] += 1;
    if (first.startedAt !== null && first.endedAt === null) {
      first.endedAt = now;
      first.outcome = event;
    }
  }
  writeTelemetry(data);
}

export function clearTelemetry() {
  removeStored(TELEMETRY_KEY);
}

// "1 min 20 s", "45 s", "2 h 5 min": the elapsed time a tester's notes record.
export function formatElapsed(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return seconds % 60 ? `${minutes} min ${seconds % 60} s` : `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return minutes % 60 ? `${hours} h ${minutes % 60} min` : `${hours} h`;
}

// The first operation on this device in sentences, for the settings panel.
export function describeFirstSession(data: BalanceTelemetry): string[] {
  const first = data.firstSession;
  if (first.startedAt === null) return ["No operation has been started on this device yet."];
  const since = (at: number | null) => at === null ? null : formatElapsed(at - first.startedAt!);
  const lines = [
    first.firstProcedureAt === null ? "First procedure: not yet run." : `First procedure ran ${since(first.firstProcedureAt)} after the first operation began.`,
    first.firstRevisionAt === null ? "First revision of a reading: not yet made." : `First revision of a reading came ${since(first.firstRevisionAt)} in.`,
  ];
  if (first.endedAt === null) lines.push("The first operation has not ended.");
  else lines.push(`The first operation ended ${since(first.endedAt)} in, ${first.outcome === "win" ? "won" : first.outcome === "exercise" ? "as an authorised exercise" : "lost"}.`);
  return lines;
}
