// pnpm new-scenario <slug>: writes content-drafts/<slug>.ts, a draft of every
// table a new sector needs, for the drafts test to hold until it is complete.
import { existsSync, writeFileSync } from "node:fs";
import { scaffold } from "./scenario-scaffold.ts";

const slug = process.argv[2];
if (!slug || !/^[a-z][a-z0-9-]{2,30}$/.test(slug)) {
  console.error("Usage: pnpm new-scenario <slug>, lower-case letters, digits and hyphens.");
  process.exit(1);
}
const path = new URL(`../content-drafts/${slug}.ts`, import.meta.url);
if (existsSync(path)) {
  console.error(`content-drafts/${slug}.ts already exists.`);
  process.exit(1);
}
writeFileSync(path, scaffold(slug));
console.log(`Wrote content-drafts/${slug}.ts. Run pnpm validate:content to see what is left to write.`);
