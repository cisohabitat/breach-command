// Saves and portable backups are untrusted input, even in a client-only game.
// Bound parsing work before JSON.parse, then walk iteratively so deeply nested
// input cannot exhaust the call stack of a validator or later renderer.
export const MAX_SAVE_CHARS = 2 * 1024 * 1024;

export function parseSaveJson(raw: string): unknown {
  if (raw.length > MAX_SAVE_CHARS) throw new Error("Save exceeds size limit");
  const value: unknown = JSON.parse(raw);
  const pending = [{ value, depth: 0 }];
  let remaining = 100_000;
  while (pending.length) {
    const item = pending.pop()!;
    if (--remaining < 0 || item.depth > 32) throw new Error("Save exceeds structure limit");
    if (!item.value || typeof item.value !== "object") continue;
    const entries = Object.entries(item.value);
    if (entries.length > 5000) throw new Error("Save exceeds collection limit");
    for (const [key, child] of entries) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") throw new Error("Unsafe save key");
      pending.push({ value: child, depth: item.depth + 1 });
    }
  }
  return value;
}
