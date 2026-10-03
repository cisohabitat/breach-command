import { readStored, removeStored, writeStored } from "./storage.ts";

export const TELEMETRY_KEY = "breach-command.balance";

export type BalanceTelemetry = {
  operationsStarted: number;
  operationsFinished: number;
  wins: number;
  losses: number;
  exercises: number;
  turns: number;
  procedures: Record<string, number>;
  scenarios: Record<string, number>;
};

// A fresh record every time. Handing out one shared default let the counters
// accumulate on it, so a cleared record still showed the old totals.
export function emptyTelemetry(): BalanceTelemetry {
  return { operationsStarted: 0, operationsFinished: 0, wins: 0, losses: 0, exercises: 0, turns: 0, procedures: {}, scenarios: {} };
}

export function readTelemetry(): BalanceTelemetry {
  try {
    const saved = JSON.parse(readStored(TELEMETRY_KEY) ?? "null") as Partial<BalanceTelemetry> | null;
    if (!saved || typeof saved !== "object") return emptyTelemetry();
    return { ...emptyTelemetry(), ...saved, procedures: { ...saved.procedures }, scenarios: { ...saved.scenarios } };
  } catch { return emptyTelemetry(); }
}

// An authorised exercise is its own conclusion, not a defeat, so it is counted
// apart from wins and losses.
export function recordTelemetry(event: "start" | "turn" | "win" | "loss" | "exercise", detail: { scenario?: number; procedure?: string } = {}) {
  const data = readTelemetry();
  if (event === "start") {
    data.operationsStarted += 1;
    if (detail.scenario !== undefined) data.scenarios[String(detail.scenario)] = (data.scenarios[String(detail.scenario)] ?? 0) + 1;
  }
  if (event === "turn") {
    data.turns += 1;
    if (detail.procedure) data.procedures[detail.procedure] = (data.procedures[detail.procedure] ?? 0) + 1;
  }
  if (event === "win" || event === "loss" || event === "exercise") {
    data.operationsFinished += 1;
    data[event === "win" ? "wins" : event === "loss" ? "losses" : "exercises"] += 1;
  }
  writeStored(TELEMETRY_KEY, JSON.stringify(data));
}

export function clearTelemetry() {
  removeStored(TELEMETRY_KEY);
}
