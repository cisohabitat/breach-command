// Regression coverage from the whole-corpus review in docs/reviews/SCENARIOS-2026-10-18.md.
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { attacks, attackMitre, difficulties, infrastructureTopologies, newGame, playTurn, proceduresFor, resolveResponse, responseProfiles, scenarios, type Difficulty } from "../lib/advanced-game.ts";
import { variantModifier, variantTemplates } from "../lib/phase9.ts";
import { legacy } from "../lib/i18n/message.ts";
import { en } from "./english.ts";

test("all ATT&CK references exist in the reviewed active Enterprise catalogue", () => {
  // This offline extract catches retired IDs as well as typos. It does not
  // establish semantic correctness: that review is recorded with its sources.
  const catalogue = JSON.parse(readFileSync(new URL("./fixtures/attack-enterprise-2026-10-18.json", import.meta.url), "utf8")) as { activeTechniques: Record<string, string> };
  for (const attack of attacks) for (const id of attackMitre[attack.id]) {
    assert.ok(catalogue.activeTechniques[id], `${attack.id}: ${id} needs an active reference and a reviewed catalogue update`);
  }
});

test("every scenario's authored technique can actually produce a finding through each offered detect source", () => {
  let checked = 0;
  scenarios.forEach((scenario, index) => {
    const initial = newGame(index, "training", () => 0);
    const offered = new Set(proceduresFor(initial).map(source => source.id));
    if (scenario.choices.flat().some(id => attacks.find(attack => attack.id === id)!.vector === "cloud") || infrastructureTopologies[index].nodes.some(node => node.procedures.includes("cloud"))) {
      assert.match(scenario.scope, /cloud/i, `${scenario.id} names the cloud estate it investigates`);
    }
    scenario.choices.forEach((choices, stage) => choices.forEach(id => {
      const attack = attacks.find(item => item.id === id)!;
      const chain = scenario.choices.map(pool => pool[0]);
      chain[stage] = id;
      for (const source of attack.detect.filter(source => offered.has(source))) {
        const game = { ...initial, chain, revealed: chain.slice(0, stage), injectDeck: [0], impact: 0, continuity: 100, sectorHealth: 100 };
        const result = playTurn(game, source, 20);
        assert.equal(result.turns[0].revealed, id, `${scenario.id}/${id} via ${source}`);
        assert.ok(en(result.turns[0].narrative).includes(attack.evidence), "the report carries the authored finding");
        assert.ok(result.evidence.some(item => item.supports === id), "the finding can be used in the evidence workspace");
        assert.deepEqual(game.revealed, chain.slice(0, stage), "collection leaves the input state intact");
        checked++;
      }
    }));
  });
  assert.ok(checked >= 480, "all sixteen techniques in each of ten cases, through at least three sources");
});

test("all seventy variants change only the advertised starting readouts and respect their bounds", () => {
  const clamp = (value: number) => Math.max(0, Math.min(100, value));
  variantTemplates.forEach((variants, scenario) => variants.forEach((variant, index) => {
    for (const difficulty of Object.keys(difficulties) as Difficulty[]) {
      // The low-readiness route makes positive continuity bonuses observable;
      // the standalone case also covers bonuses capped at full continuity.
      for (const mode of ["daily", "campaign"] as const) {
        const setup = { mode, campaignRoute: "breakwater" as const, campaignReadiness: 20 };
        const base = newGame(scenario, difficulty, () => 0, setup);
        const modified = newGame(scenario, difficulty, () => 0, { ...setup, variant: { ...variant, id: `${scenario}-${index}`, title: legacy(variant.title), briefing: legacy(variant.briefing), modifier: variantModifier(variant) } });
        assert.equal(modified.continuity, clamp(base.continuity + variant.continuity));
        // Service above full is not lost: it lowers starting impact instead.
        assert.equal(modified.impact, clamp(base.impact + variant.impact - Math.max(0, base.continuity + variant.continuity - 100)));
        assert.equal(modified.objectiveProgress, clamp(base.objectiveProgress + variant.objective));
        const omitStartingValues = (game: typeof base) => Object.fromEntries(Object.entries(game).filter(([key]) => !["variant", "impact", "continuity", "objectiveProgress"].includes(key)));
        assert.deepEqual(omitStartingValues(modified), omitStartingValues(base), "no hidden change to evidence, attribution, containment options or sector margin");
      }
    }
  }));
});

test("each sector's twenty-seven response paths resolve in containment, assurance and recovery order", () => {
  responseProfiles.forEach((profile, scenario) => {
    const initial = newGame(scenario, "training", () => 0);
    for (const containment of profile.containment) for (const assurance of profile.assurance) for (const recovery of profile.recovery) {
      const start = { ...initial, status: "response" as const, revealed: [...initial.chain], impact: 0, continuity: 100, sectorHealth: 100 };
      assert.throws(() => resolveResponse(start, assurance.id), /Unknown response/);
      const first = resolveResponse(start, containment.id);
      const second = resolveResponse(first, assurance.id);
      const final = resolveResponse(second, recovery.id);
      assert.equal(final.status, "won");
      assert.deepEqual(final.responseChoices, [containment.id, assurance.id, recovery.id]);
      assert.deepEqual(start.responseChoices, []);
    }
  });
});
