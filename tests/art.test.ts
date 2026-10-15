import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { evidenceArtFor } from "../lib/art.ts";
import { campaignEnding, defaultCampaign } from "../lib/campaign.ts";
import { scenarios, runsOperationalTechnology } from "../lib/scenarios.ts";
import { getShareCard, newGame, procedures, sectorProcedures, adversaryProfiles } from "../lib/advanced-game.ts";

test("every check has source art, with the OT exception and sector fallback", () => {
  for (let scenario = 0; scenario < scenarios.length; scenario++) {
    for (const procedure of procedures) {
      const expected = runsOperationalTechnology(scenario) && ["server", "endpoint"].includes(procedure.id)
        ? "maintenance" : procedure.id === "endpoint" ? "telemetry" : procedure.id;
      assert.equal(evidenceArtFor(procedure.id, scenario), expected);
      assert.ok(readFileSync(new URL(`../public/art/evidence/${expected}.webp`, import.meta.url)).length);
    }
    for (const procedure of sectorProcedures) assert.equal(evidenceArtFor(procedure.id, scenario), "telemetry");
    assert.equal(getShareCard(newGame(scenario, "training", () => 0)).scenarioId, scenarios[scenario].id);
  }
});

test("all campaign conclusions expose an asset id without changing their selection", () => {
  const completed = scenarios.map((_, index) => index);
  const endings = [
    { id: "resilience", leadershipTrust: 80, readiness: 80, unresolvedThreads: 0 },
    { id: "foothold", leadershipTrust: 80, readiness: 80, unresolvedThreads: 4 },
    { id: "fractured", leadershipTrust: 30, readiness: 50, unresolvedThreads: 0 },
    { id: "stability", leadershipTrust: 50, readiness: 50, unresolvedThreads: 0 },
  ];
  assert.equal(campaignEnding(defaultCampaign), null);
  for (const { id, ...state } of endings) assert.equal(campaignEnding({ ...defaultCampaign, completed, ...state })?.id, id);
});

function webp(path: string, width: number, height: number, budget: number) {
  const bytes = readFileSync(new URL(`../public/art/${path}.webp`, import.meta.url));
  assert.equal(bytes.toString("ascii", 0, 4), "RIFF", path);
  assert.equal(bytes.toString("ascii", 8, 12), "WEBP", path);
  assert.ok(bytes.length < budget, `${path}: ${bytes.length} exceeds ${budget}`);
  let dimensions: [number, number] | undefined;
  for (let offset = 12; offset + 8 < bytes.length;) {
    const kind = bytes.toString("ascii", offset, offset + 4);
    const length = bytes.readUInt32LE(offset + 4), start = offset + 8;
    if (kind === "VP8 ") dimensions = [bytes.readUInt16LE(start + 6) & 0x3fff, bytes.readUInt16LE(start + 8) & 0x3fff];
    if (kind === "VP8X") dimensions = [bytes.readUIntLE(start + 4, 3) + 1, bytes.readUIntLE(start + 7, 3) + 1];
    offset = start + length + (length % 2);
  }
  assert.deepEqual(dimensions, [width, height], path);
}

test("new artwork meets its dimensions and budgets, and every scene has a phone copy", () => {
  webp("icons/field-kit", 768, 512, 110000);
  for (const source of ["network", "firewall", "dns", "server", "cloud", "forensic", "intel", "hunt"]) webp(`evidence/${source}`, 480, 320, 45000);
  for (const profile of Object.keys(adversaryProfiles)) webp(`adversaries/${profile}`, 256, 256, 15000);
  for (const id of ["resilience", "foothold", "fractured", "stability"]) {
    webp(`campaign/ending-${id}`, 960, 480, 110000);
    webp(`campaign/ending-${id}-480`, 480, 240, 35000);
  }
  for (const scenario of scenarios) webp(`sectors/${scenario.id}-480`, 480, 320, 45000);
  for (const path of ["campaign/act-1", "campaign/act-2", "campaign/act-3", "endings/exercise", "endings/recovery", "endings/unresolved"]) webp(`${path}-480`, 480, 240, 35000);
});
