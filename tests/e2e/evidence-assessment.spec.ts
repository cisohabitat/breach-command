import { expect, test } from "@playwright/test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { getEvidenceAssessment } from "../../lib/advanced-game";
import { openWithSave, pendingDecisionGame, twoStagesGame } from "./fixtures";

const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");

for (const width of [320, 375, 430, 768, 810, 820, 834, 1024, 1080, 1194, 1280]) {
  test(`signal and confidence remain readable at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await openWithSave(page, { ...twoStagesGame(), difficulty: "training" });
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    if (width <= 650) await page.locator(".reference-fold > summary").click();
    const guide = page.locator(".evidence-workspace .signal-guide");
    await guide.locator("summary").click();
    await expect(guide.locator("li")).toHaveCount(4);
    const details = page.locator(".evidence-detail");
    await details.evaluate(element => { (element as HTMLDetailsElement).open = true; });
    const read = page.locator(".evidence-cards .evidence-assessment").first();
    await expect(read).toContainText("Signal: strong");
    await expect(read).toContainText("Confidence: weak");
    await read.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await read.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await read.screenshot({ path: info.outputPath("assessment.png") });
    await page.locator(".procedure-card:not(:disabled)").first().click();
    await expect(page.locator(".action-sheet")).toContainText("Successful exhaustive collection gives strong confidence");
    await expect(page.getByRole("button", { name: "Run procedure", exact: true })).toBeVisible();
  });
}

test("a causal comparison strengthens visible confidence and survives resume", async ({ page }) => {
  const game = twoStagesGame();
  const findings = game.evidence.filter(item => item.supports).slice(0, 2);
  expect(findings).toHaveLength(2);
  expect(findings[0].id.replace(/^E\d+-/, "")).not.toBe(findings[1].id.replace(/^E\d+-/, ""));
  await openWithSave(page, game);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.locator(".evidence-detail").evaluate(element => { (element as HTMLDetailsElement).open = true; });
  for (const item of findings) await page.locator(".evidence-cards button").filter({ has: page.locator(`[data-signal="${getEvidenceAssessment(game, item).signal}"]`) }).filter({ hasText: `Turn ${item.turn}` }).click();
  await page.getByRole("button", { name: "Causal sequence", exact: true }).click();
  await page.getByRole("button", { name: "Test assessment", exact: true }).click();
  await expect(page.locator(".evidence-cards [data-confidence=strong]")).toHaveCount(2);
  await expect(page.locator(".evidence-cards")).toContainText("different collection sources");
  // A fresh page shares storage without rerunning openWithSave's fixture reset.
  const resumed = await page.context().newPage();
  await resumed.goto("/");
  await resumed.waitForLoadState("networkidle");
  await resumed.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(resumed.locator(".evidence-cards [data-confidence=strong]")).toHaveCount(2);
  await resumed.close();
});

test("the decision reports both axes before the response is chosen", async ({ page }, info) => {
  await openWithSave(page, { ...pendingDecisionGame(), difficulty: "training" });
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  const decision = page.locator(".evidence-decision");
  await expect(decision.locator(".evidence-assessment")).toContainText("Signal: strong");
  await expect(decision.locator(".evidence-assessment")).toContainText("Confidence: weak");
  await expect(decision.locator(".signal-guide summary")).toBeVisible();
  await decision.locator(".signal-guide summary").click();
  await decision.locator(".evidence-assessment").screenshot({ path: info.outputPath("decision-assessment.png") });
  await page.addScriptTag({ content: axeSource });
  const violations = await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ["violations"] })).violations);
  expect(violations).toEqual([]);
});
