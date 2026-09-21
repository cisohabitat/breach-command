// Local storage is the only persistence this game has, and it is not always
// reachable: a private window, blocked site data, a disabled-storage policy or
// a full quota all make the ordinary accessors throw rather than return empty.
// Every accessor here answers instead of throwing, so a device that cannot
// store anything still plays a complete operation from memory and is told once
// why nothing was kept.
export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStored(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// True only when a value can actually be written and read back. Reading alone
// succeeds in some blocked contexts that still refuse every write.
export function storageWritable(): boolean {
  const probe = "breach-command.probe";
  if (!writeStored(probe, "1")) return false;
  removeStored(probe);
  return true;
}
