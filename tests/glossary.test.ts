// Glossary completeness: every acronym and every field term the authored text
// uses has a plain-language entry, so the interface can explain it where it is
// read. The field terms are the vocabulary a newcomer would not know; ordinary
// English the field also uses (relay, replay, grant, staging) is left out.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as game from "../lib/game.ts";
import { adversaryProfiles,commandEvents,hypotheses,responseProfiles,sectorSystems } from "../lib/advanced-game.ts";
import { glossaryParts, plainLanguage } from "../lib/glossary.ts";
import { injects } from "../lib/engine/content.ts";
import * as systems from "../lib/command-systems.ts";
import * as phase8 from "../lib/phase8.ts";
import * as phase9 from "../lib/phase9.ts";

const prose: string[] = [];
const walk = (value: unknown) => {
  if (typeof value === "string") { if (value.includes(" ") && /[a-z]/.test(value)) prose.push(value); }
  else if (Array.isArray(value)) value.forEach(walk);
  else if (value && typeof value === "object") Object.values(value).forEach(walk);
};
walk([game, commandEvents, responseProfiles, sectorSystems, injects, adversaryProfiles, hypotheses, systems, phase8, phase9]);
const text = prose.join("\n");
const glossed = Object.keys(plainLanguage).map(term => term.toLowerCase());
const has = (term: string) => glossed.includes(term.toLowerCase());
// An acronym is covered by an entry that names it, such as "TXT record".
const covers = (acronym: string) => glossed.some(term => new RegExp(`\\b${acronym.toLowerCase()}\\b`).test(term));

// "IT" is everyday English and, read without case, would gloss every "it".
const plainAcronyms = new Set(["IT"]);

const fieldTerms = ["phishing", "password spraying", "privilege escalation", "jump host", "web shell", "implant", "tunnel", "proxy", "port forward", "covert channel", "dead drop", "service account", "scheduled task", "autorun", "event subscription", "container image", "pipeline runner", "sideloaded", "segmentation", "threat hunt", "forensic", "identity assertion", "tenant", "foothold", "lateral movement", "persistence", "exfiltration", "beaconing", "federation", "telemetry", "payload", "workload", "historian", "snapshot", "webhook", "token", "credential", "endpoint", "egress", "pivot", "resolver", "delegated access"];

test("every acronym in the authored text has a plain-language entry", () => {
  assert.ok(prose.length > 1000, "the scan reads the authored tables");
  const acronyms = new Set([...text.matchAll(/\b[A-Z][A-Z0-9]{1,4}\b/g)].map(match => match[0]).filter(word => !plainAcronyms.has(word)));
  for (const acronym of acronyms) assert.ok(covers(acronym), `${acronym} needs an entry in plainLanguage`);
});

test("every field term the authored text uses has a plain-language entry and is glossed where it is read", () => {
  for (const term of fieldTerms) {
    const pattern = new RegExp(`\\b${term.replace(/ /g, "[ -]")}`, "i");
    if (!pattern.test(text)) continue;
    assert.ok(has(term), `${term} appears in play and needs an entry in plainLanguage`);
    const sample = prose.find(line => pattern.test(line))!;
    assert.ok(glossaryParts(sample).some(part => part.term), `${term} is marked for its gloss in "${sample}"`);
  }
});

test("every entry explains itself in plain words", () => {
  for (const [term, meaning] of Object.entries(plainLanguage)) {
    assert.ok(meaning.length > 30 && meaning.endsWith("."), `${term} has a sentence of meaning`);
    assert.ok(!new RegExp(`\\b${term}\\b`, "i").test(meaning.split(":")[0]) || meaning.includes(":"), `${term} is not defined by itself`);
  }
});
