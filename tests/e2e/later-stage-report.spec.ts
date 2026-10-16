import { expect, test } from "@playwright/test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { attacks, attackVector, newGame, playTurn, procedures, resolveDecision, scenarios, setHypothesis } from "../../lib/advanced-game";
import { seededRoll } from "../../lib/phase8";
import { openWithSave } from "./fixtures";

const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");

function laterStageFixture(tested: number) {
  let game = { ...newGame(0, "training", () => 0), injectDeck: [] as number[] };
  if (tested === 2) {
    game = setHypothesis(game, attackVector(game.chain[0]));
    const source = attacks.find(item => item.id === game.chain[0])!.detect[0];
    game = playTurn(game, source, 20);
    game = resolveDecision(game, "attribute");
  }
  // Choose a legal source that sees the later stage but cannot see the stage
  // under test. This forces a windfall through the real engine and report UI.
  for (const found of scenarios[0].choices[tested]) {
    for (const source of attacks.find(item => item.id === found)!.detect) {
      if (!procedures.some(item => item.id === source) || game.lastUsed[source]) continue;
      const target = scenarios[0].choices[tested - 1].find(id => !attacks.find(item => item.id === id)!.detect.includes(source));
      if (!target) continue;
      game.chain[tested - 1] = target;
      game.chain[tested] = found;
      game = setHypothesis(game, attackVector(target));
      let seed = 1;
      while (seededRoll(seed, game.turns.length) !== 19) seed++;
      game = { ...game, seed };
      const result = playTurn(game, source).turns.at(-1)!;
      expect(result.windfall).toBe(true);
      expect(result.revealed).toBe(found);
      expect(result.hypothesisTarget).toBe(target);
      return { game, source };
    }
  }
  throw new Error("no later-stage fixture available");
}

for (const tested of [1, 2]) for (const width of [320, 375, 430, 768, 810, 820, 834, 1024, 1080, 1194, 1280]) {
  test(`a stage ${tested + 1} find names the still-open stage ${tested} at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const { game, source } = laterStageFixture(tested);
    await openWithSave(page, game, false, { voice: false, sound: false, music: false });
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await page.locator(`[data-procedure="${source}"]`).click();
    await page.getByRole("button", { name: "Run procedure", exact: true }).click();
    const report = page.locator(".report-dialog");
    const note = report.locator(".windfall-note");
    await expect(note).toContainText(`This is stage ${tested + 1}, further along the chain.`);
    await expect(note).toContainText(`The stage you were testing, stage ${tested}, is still open`);
    await expect(note).not.toContainText(/[{}]/);
    await page.addScriptTag({ content: axeSource });
    const violations = await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ["violations"] })).violations);
    expect(violations).toEqual([]);
  });
}
