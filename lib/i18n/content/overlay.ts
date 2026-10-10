// Replaces the words of every content table in place, for a locale other than
// English. It runs on the client only, after the page has hydrated in English
// (hooks/use-messages.ts loads it with import(), so English carries none of
// it), and on the balance check's --overlay run, which proves the rules give
// the same game in any language. The English is kept, so applying again, or
// another locale, always starts from it.
import { pseudo } from "../index.ts";
import { contentTables, whenContentRegisters } from "./registry.ts";
import { contentLeaves, type Leaf } from "./walk.ts";

// The English of every leaf, kept from the first time its table is seen, so
// applying again, or another locale, always starts from it.
const english = new Map<string, Leaf & { english: string }>();
let active: (path: string, english: string) => string | undefined = () => undefined;
function leavesOf(tables: Record<string, unknown>) {
  for (const leaf of contentLeaves(tables)) if (!english.has(leaf.path)) english.set(leaf.path, { ...leaf, english: leaf.text });
}

// A locale's overlay maps a path to its text; a path it lacks keeps English.
// A table registered later, with its module, is overlaid as it registers.
export function applyContentOverlay(overlay: (path: string, english: string) => string | undefined) {
  active = overlay;
  leavesOf(contentTables);
  for (const leaf of english.values()) leaf.set(overlay(leaf.path, leaf.english) ?? leaf.english);
  whenContentRegisters(tables => {
    const before = new Set(english.keys());
    leavesOf(tables);
    for (const [path, leaf] of english) if (!before.has(path)) leaf.set(active(path, leaf.english) ?? leaf.english);
  });
}

export const pseudoOverlay = (_path: string, text: string) => pseudo(text);

export function applyLocaleContent(locale: string) {
  if (locale === "en-XA") applyContentOverlay(pseudoOverlay);
  else applyContentOverlay(() => undefined);
}
