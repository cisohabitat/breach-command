import { readStored, storageWritable, storedSizes, writeStored } from "./storage.ts";

// What a player can copy into a bug report: the build, the browser, whether
// storage works and what the game keeps there by size, the saved operation's
// version, and the last fault the game caught. Nothing personal and nothing
// played: no campaign, no record, no answers. It is copied by the player and
// sent nowhere by the game.
const LAST_ERROR_KEY = "breach-command.last-error";
const SESSION_KEY = "breach-command.session";

export function recordLastError(where: string, error: Error) {
  writeStored(LAST_ERROR_KEY, JSON.stringify({ where, name: error.name, message: error.message.slice(0, 300), at: new Date().toISOString() }));
}

export function collectDiagnostics() {
  let saveVersion = "none";
  try {
    const saved = JSON.parse(readStored(SESSION_KEY) ?? "null") as { version?: unknown } | null;
    if (saved && typeof saved.version === "number") saveVersion = String(saved.version);
  } catch {
    saveVersion = "unreadable";
  }
  let lastError = "none";
  try {
    const record = JSON.parse(readStored(LAST_ERROR_KEY) ?? "null") as { where: string; name: string; message: string; at: string } | null;
    if (record) lastError = `${record.at}, ${record.where}: ${record.name}: ${record.message}`;
  } catch {
    lastError = "unreadable";
  }
  const sizes = storedSizes();
  // i18n: maintainer English. The player copies this into a bug report for
  // whoever maintains the game, who reads it in English whatever the locale.
  return [
    "Breach Command diagnostics",
    `Version: ${process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown"}, build ${process.env.NEXT_PUBLIC_BUILD_ID ?? "local"}`,
    `Browser: ${typeof navigator === "undefined" ? "unknown" : navigator.userAgent}`,
    `Screen: ${typeof window === "undefined" ? "unknown" : `${window.innerWidth}x${window.innerHeight} at ${window.devicePixelRatio}x`}`,
    `Storage: ${storageWritable() ? "writable" : "not writable"}; ${Object.keys(sizes).length ? Object.entries(sizes).map(([key, size]) => `${key.replace("breach-command.", "")} ${size} B`).join(", ") : "nothing stored"}`,
    `Saved operation: session version ${saveVersion}`,
    `Service worker: ${typeof navigator !== "undefined" && "serviceWorker" in navigator ? (navigator.serviceWorker.controller ? "controlling" : "not controlling") : "unsupported"}`,
    `Last fault: ${lastError}`,
  ].join("\n");
}
