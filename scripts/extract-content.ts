// Writes lib/i18n/content/en.json: every translatable word in the content
// tables, by path, for a translator. A locale's overlay is a file of the same
// paths. tests/content-overlay.test.ts fails when this file and the tables
// disagree, so run this after changing content: pnpm extract:content.
import { writeFileSync } from "node:fs";
import { contentTables } from "../lib/i18n/content/tables.ts";
import { contentLeaves } from "../lib/i18n/content/walk.ts";

export function extractContent() {
  return Object.fromEntries(contentLeaves(contentTables).map(leaf => [leaf.path, leaf.text]));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const source = extractContent();
  writeFileSync(new URL("../lib/i18n/content/en.json", import.meta.url), `${JSON.stringify(source, null, 1)}\n`);
  console.log(`${Object.keys(source).length} strings written to lib/i18n/content/en.json`);
}
