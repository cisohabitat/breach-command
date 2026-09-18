export const TELEMETRY_KEY = "breach-command.balance";

export type BalanceTelemetry = {
  operationsStarted: number;
  operationsFinished: number;
  wins: number;
  losses: number;
  turns: number;
  procedures: Record<string, number>;
  scenarios: Record<string, number>;
};

export const emptyTelemetry: BalanceTelemetry = { operationsStarted: 0, operationsFinished: 0, wins: 0, losses: 0, turns: 0, procedures: {}, scenarios: {} };

export function readTelemetry(): BalanceTelemetry {
  if (typeof localStorage === "undefined") return emptyTelemetry;
  try {
    const saved = JSON.parse(localStorage.getItem(TELEMETRY_KEY) ?? "null") as Partial<BalanceTelemetry> | null;
    if (!saved) return emptyTelemetry;
    return { ...emptyTelemetry, ...saved, procedures: saved.procedures ?? {}, scenarios: saved.scenarios ?? {} };
  } catch { return emptyTelemetry; }
}

export function recordTelemetry(event: "start" | "turn" | "win" | "loss", detail: { scenario?: number; procedure?: string } = {}) {
  if (typeof localStorage === "undefined") return;
  const data = readTelemetry();
  if (event === "start") {
    data.operationsStarted += 1;
    if (detail.scenario !== undefined) data.scenarios[String(detail.scenario)] = (data.scenarios[String(detail.scenario)] ?? 0) + 1;
  }
  if (event === "turn") {
    data.turns += 1;
    if (detail.procedure) data.procedures[detail.procedure] = (data.procedures[detail.procedure] ?? 0) + 1;
  }
  if (event === "win" || event === "loss") {
    data.operationsFinished += 1;
    data[event === "win" ? "wins" : "losses"] += 1;
  }
  localStorage.setItem(TELEMETRY_KEY, JSON.stringify(data));
}

export function clearTelemetry() {
  if (typeof localStorage !== "undefined") localStorage.removeItem(TELEMETRY_KEY);
}
