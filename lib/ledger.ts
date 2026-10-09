import { readStored, writeStored } from "./storage.ts";

export const LEDGER_KEY = "breach-command.ledger";
const KEEP = 500;

// Every operation this device has played to an end, newest last: what was
// played, how it ended, the score and its hypothesis part, and the challenge
// code when it can be replayed. Local, exportable with the backup or as a CSV,
// and read defensively: an edited or truncated entry is dropped, not trusted.
export type LedgerEntry = {
  at: number;
  scenario: number;
  difficulty: "training" | "operational" | "crisis";
  mode: string;
  outcome: "won" | "lost" | "exercise";
  score: number;
  hypothesis: number;
  stages: number;
  turns: number;
  code: string | null;
};

const finite = (value: unknown, low: number, high: number) => typeof value === "number" && Number.isFinite(value) && value >= low && value <= high;

export function parseLedger(raw: unknown, cases: number): LedgerEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is LedgerEntry => {
    if (!item || typeof item !== "object") return false;
    const r = item as Record<string, unknown>;
    return finite(r.at, 0, 8.64e15) && Number.isInteger(r.scenario) && finite(r.scenario, 0, cases - 1)
      && (r.difficulty === "training" || r.difficulty === "operational" || r.difficulty === "crisis")
      && typeof r.mode === "string" && r.mode.length <= 20
      && (r.outcome === "won" || r.outcome === "lost" || r.outcome === "exercise")
      && finite(r.score, 0, 100) && finite(r.hypothesis, 0, 10) && finite(r.stages, 0, 4) && finite(r.turns, 0, 99)
      && (r.code === null || (typeof r.code === "string" && r.code.length <= 60));
  }).map(item => ({ at: item.at, scenario: item.scenario, difficulty: item.difficulty, mode: item.mode, outcome: item.outcome, score: item.score, hypothesis: item.hypothesis, stages: item.stages, turns: item.turns, code: item.code })).slice(-KEEP);
}

export function readLedger(cases: number): LedgerEntry[] {
  try { return parseLedger(JSON.parse(readStored(LEDGER_KEY) ?? "[]"), cases); } catch { return []; }
}

export function writeLedger(entries: LedgerEntry[]) {
  return writeStored(LEDGER_KEY, JSON.stringify(entries.slice(-KEEP)));
}

// Hypothesis accuracy over the last ten operations, against the ten before,
// so the campaign record shows whether reading the route is improving.
export function hypothesisTrend(entries: LedgerEntry[]) {
  const mean = (list: LedgerEntry[]) => list.length ? Math.round(10 * list.reduce((sum, entry) => sum + entry.hypothesis, 0) / list.length) / 10 : null;
  return { recent: mean(entries.slice(-10)), recentCount: entries.slice(-10).length, before: mean(entries.slice(-20, -10)) };
}

export function ledgerCsv(entries: LedgerEntry[], titleOf: (scenario: number) => string) {
  const quote = (value: string) => /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  const rows = entries.map(entry => [new Date(entry.at).toISOString(), String(entry.scenario + 1), titleOf(entry.scenario), entry.difficulty, entry.mode, entry.outcome, String(entry.score), String(entry.hypothesis), String(entry.stages), String(entry.turns), entry.code ?? ""].map(quote).join(","));
  return ["ended,case,title,difficulty,mode,outcome,score,hypothesis,stages,turns,code", ...rows].join("\n");
}
