// Importing replaces existing progress. Reject damage before local migration
// can silently repair it into a new campaign. Load only when restoring a backup.
export function isCampaignBackup(value: unknown, cases = 10): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const number = (n: unknown, max = Number.MAX_SAFE_INTEGER) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= max;
  const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
  if (!Array.isArray(record.completed) || !record.completed.every(id => Number.isInteger(id) && id >= 0 && id < cases)
    || new Set(record.completed).size !== record.completed.length || !number(record.xp)
    || !number(record.operations) || !Number.isInteger(record.operations)) return false;
  for (const field of ["leadershipTrust", "readiness", "streak", "unresolvedThreads"] as const) {
    if (record[field] !== undefined && !number(record[field], field === "leadershipTrust" || field === "readiness" ? 100 : Number.MAX_SAFE_INTEGER)) return false;
  }
  for (const [field, max] of [["bestScores", 100], ["specialistFatigue", 6], ["mastery", 3], ["commandPosture", Number.MAX_SAFE_INTEGER], ["actorSightings", Number.MAX_SAFE_INTEGER], ["specialistBonds", 100]] as const) {
    const entries = record[field];
    if (entries !== undefined && (!object(entries) || !Object.values(entries).every(n => number(n, max)))) return false;
  }
  for (const field of ["routeHistory", "recentCommands", "recentInjects", "recentCrises", "rehearsed"] as const) {
    const entries = record[field];
    if (entries !== undefined && (!Array.isArray(entries) || !entries.every(id => typeof id === "string"))) return false;
  }
  const ladder = record.ladder;
  if (ladder !== undefined && (!object(ladder) || !Object.entries(ladder).every(([key, rungs]) => /^\d+$/.test(key)
    && Array.isArray(rungs) && rungs.every(id => ["crisis", "steady", "accurate", "swift", "tired", "expert"].includes(id))))) return false;
  return true;
}
