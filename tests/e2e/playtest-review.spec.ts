import { expect, test } from "@playwright/test";
import { attacks, newGame, playTurn, setHypothesis, type Game } from "../../lib/advanced-game";
import { codedPlaytestGame, negativePlaytestGame } from "../playtest-fixtures";
import { openWithSave, responsePhaseGame, twoStagesGame } from "./fixtures";
import { SESSION_KEY } from "../../lib/session";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
async function audit(page: import("@playwright/test").Page) {
  await page.addScriptTag({ content: axeSource });
  expect(await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ["violations"] })).violations)).toEqual([]);
}

const resume = (page: import("@playwright/test").Page) => page.getByRole("button", { name: /^Resume “.+”$/ }).click();
function pending(difficulty: Game["difficulty"] = "operational") {
  return playTurn(setHypothesis(codedPlaytestGame(0, difficulty), "identity"), "firewall", 18);
}

test("the reported negative path ends with completion-aware scores through the real UI", async ({ page }) => {
  await openWithSave(page, negativePlaytestGame(3));
  await resume(page);
  await page.getByRole("button", { name: /^Investigate/ }).click();
  await page.locator('button[data-procedure="server"]').click();
  const sheet = page.locator(".action-sheet");
  await sheet.getByRole("button", { name: /^Enterprise/ }).click();
  await sheet.getByRole("button", { name: "Run procedure", exact: true }).click();
  const report = page.locator(".report-dialog");
  await report.getByRole("button", { name: "Open debrief", exact: true }).click();
  await expect(page.locator(".debrief-verdict")).toContainText("24 of 100");
  await expect(page.locator(".score-breakdown > div").filter({ hasText: /^Investigation/ })).toContainText("6/25");
  await expect(page.locator(".score-breakdown > div").filter({ hasText: /^Hypothesis testing/ })).toContainText("1/10");
  await page.locator(".hypothesis-ledger summary").click();
  await page.locator(".hypothesis-ledger .half > b").first().scrollIntoViewIfNeeded();
  await audit(page);
  await expect(page.locator(".hypothesis-ledger")).toContainText("Prediction only · ¼ credit");
  await expect(page.locator(".hypothesis-ledger")).toContainText("no further credit");
  await page.locator("#debrief-decisions > details > summary").click();
  const comparison = page.locator(".decision-comparison-review").first();
  await comparison.locator("summary").click();
  await expect(comparison).toContainText("Turn 2, before the choice: impact 55, service 94, sector margin 81, actor progress 28, pace 3/3");
  await expect(comparison).toContainText("Stronger assessment at that moment:");
  await expect(comparison).toContainText("(5/5)");
  await expect(comparison.locator(".effect-list > .effect").filter({ hasText: "Business impact" })).toContainText("−18");
  await expect(comparison.locator(".effect-list > .effect").filter({ hasText: "Settlement integrity" })).toContainText("−3");
  await audit(page);
});

test("the saved calculation reconciles the advertised plan and discovery relief", async ({ page }) => {
  let game = newGame(0, "training", () => 0);
  const source = attacks.find(attack => attack.id === game.chain[0])!.detect[0];
  game = playTurn({ ...game, impact: 19, injectDeck: [] }, source, 18, { scope: "focused", intensity: "exhaustive" });
  await openWithSave(page, game);
  await resume(page);
  await page.locator(".report-summary > summary").click();
  await page.locator(".report-dialog .turn-calculation > summary").click();
  const impact = page.locator(".report-dialog .meter-calculations > section").filter({ hasText: "Business impact" });
  await expect(impact).toContainText("19 → 20");
  await expect(impact.locator("dl > div").filter({ hasText: "Collection plan" })).toContainText("+5");
  await expect(impact.locator("dl > div").filter({ hasText: "discovery relief" })).toContainText("−7");
  await audit(page);
});

test("resume is one named action and choosing another incident leaves the save intact", async ({ page }) => {
  const game = twoStagesGame();
  await openWithSave(page, game);
  const saved = await page.evaluate(key => localStorage.getItem(key), SESSION_KEY);
  await expect(page.getByRole("button", { name: /^Resume “.+”$/ })).toHaveCount(1);
  await expect(page.locator("#saved-operation-title")).toContainText("The quiet intrusion");
  await expect(page.locator(".resume-card")).toContainText("Operational · Turn 2 · 2/4 stages");
  await expect(page.locator(".mission-panel")).toBeHidden();
  await page.getByRole("button", { name: "Start another incident", exact: true }).click();
  await expect(page.locator(".mission-panel")).toBeVisible();
  await page.locator(".mission-selector button").nth(1).click();
  expect(await page.evaluate(key => localStorage.getItem(key), SESSION_KEY)).toBe(saved);
  await expect(page.getByRole("button", { name: /^Resume “.+”$/ })).toHaveCount(1);
  await expect(page.locator(".replace-note")).toContainText("replaces the saved one");
  await resume(page);
  const restored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).game, SESSION_KEY);
  expect(restored.scenario).toBe(0);
  expect(restored.turns).toHaveLength(2);
});

for (const difficulty of ["training", "operational", "crisis"] as const) test(`${difficulty} coaching states its assistance level`, async ({ page }) => {
  await openWithSave(page, pending(difficulty), true);
  await resume(page);
  const pressure = page.locator(".decision-pressure");
  await expect(pressure).toContainText(`${difficulty[0].toUpperCase()}${difficulty.slice(1)} guidance`);
  if (difficulty === "training") await expect(pressure).toContainText("affordable");
  else {
    await expect(pressure).not.toContainText("fits best");
    await expect(pressure).not.toContainText("Attribute the access pattern");
  }
});

test("five concise responses fit the reported desktop viewport and details never commit a choice", async ({ page }) => {
  await page.setViewportSize({ width: 1165, height: 747 });
  await openWithSave(page, pending(), true);
  await resume(page);
  const report = page.locator(".report-dialog");
  const choices = report.locator("button[data-response]");
  await expect(choices).toHaveCount(5);
  for (const button of await choices.all()) await expect(button).toBeInViewport({ ratio: 1 });
  await report.locator(".decision-choice details > summary").first().click();
  await expect(report).toContainText("Uncertainty:");
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).game.decisions.length, SESSION_KEY)).toBe(0);
});

test("a view of relevant ready sources can be narrowed and restored without changing the operation", async ({ page }) => {
  await openWithSave(page, negativePlaytestGame(3));
  await resume(page);
  await page.getByRole("button", { name: /^Investigate/ }).click();
  const all = await page.locator(".procedure-grid button").count();
  await page.getByRole("button", { name: "Focus on ready sources for this reading", exact: true }).click();
  const shown = await page.locator(".procedure-grid button").count();
  expect(shown).toBeGreaterThan(0);
  expect(shown).toBeLessThan(all);
  for (const button of await page.locator(".procedure-grid button").all()) await expect(button).toBeEnabled();
  await page.getByRole("button", { name: "Show all collection sources", exact: true }).click();
  await expect(page.locator(".procedure-grid button")).toHaveCount(all);
});

test("zero impact does not hide the recorded recovery uncertainty", async ({ page }) => {
  await openWithSave(page, { ...responsePhaseGame(), impact: 0 });
  await resume(page);
  for (const option of [1, 0, 1]) await page.locator(".response-options > button").nth(option).click();
  await page.getByRole("button", { name: /Open after-action review|Review the record|Review the drill/ }).click();
  await expect(page.locator(".recovery-remainder")).toContainText("outside the validated backups may remain");
  await expect(page.locator(".recovery-remainder")).toContainText("impact 0/100");
});
