import { expect, test } from "@playwright/test";
import { newGame, playTurn, proceduresFor, resolveDecision, setHypothesis } from "../../lib/advanced-game";
import { openWithSave, pendingDecisionGame, twoStagesGame } from "./fixtures";

for (const width of [375, 1180]) {
  test(`Training introduces reference concepts when useful at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openWithSave(page, newGame(0, "training", () => 0), true, { voice: false });
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await page.getByRole("button", { name: /Investigate/ }).first().click();
    await expect(page.locator("#hypothesis-heading")).toHaveText("How did they get in?");
    const reference = page.locator(".reference-fold");
    if (!(await reference.evaluate(element => (element as HTMLDetailsElement).open))) await reference.locator(":scope > summary").click();
    const theory = page.locator(".theory-guide");
    await expect(theory).toHaveJSProperty("open", false);
    await expect(page.locator(".evidence-workspace .signal-guide")).toHaveCount(0);
    await expect(page.locator(".relationship-assessment")).toHaveCount(0);
    await theory.locator(":scope > summary").click();
    await expect(theory.locator(".case-theory button").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("two confirmed stages expose theory and comparison, with the next stage question", async ({ page }) => {
  await openWithSave(page, { ...twoStagesGame(), difficulty: "training" }, true, { voice: false });
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.getByRole("button", { name: /Investigate/ }).first().click();
  await expect(page.locator("#hypothesis-heading")).toHaveText("How do they keep access?");
  await expect(page.locator(".theory-guide")).toHaveJSProperty("open", true);
  await expect(page.getByRole("button", { name: "Causal sequence", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Test assessment", exact: true })).toBeDisabled();
});

test("a successful check with no stage teaches bounded weak signal", async ({ page }) => {
  let game = setHypothesis(newGame(0, "training", () => 0), "identity");
  game = { ...game, injectDeck: [] };
  const bounded = proceduresFor(game).map(source => playTurn(game, source.id, 15)).find(result => result.turns[0].success && !result.turns[0].revealed && !result.turns[0].injectReveal);
  expect(bounded).toBeTruthy();
  game = bounded!;
  expect(game.turns[0].success).toBe(true);
  expect(game.turns[0].revealed).toBeNull();
  await openWithSave(page, game, true, { voice: false });
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.getByRole("button", { name: /^Briefing/ }).first().click();
  await page.locator(".log-entry").first().click();
  const report = page.locator(".report-dialog");
  await expect(report.locator(".evidence-assessment")).toContainText("Signal: weak");
  await expect(report.locator(".evidence-assessment small")).toContainText("absence here does not clear the incident");
  await expect(report.locator(".signal-guide summary")).toBeVisible();
  await report.getByRole("button", { name: "Continue investigation", exact: true }).click();
  await page.getByRole("button", { name: /Investigate/ }).first().click();
  await expect(page.locator(".relationship-assessment")).toHaveCount(0);
  await expect(page.locator(".theory-guide")).toHaveJSProperty("open", false);
});

test("a chosen response reports actual changes before the roll disclosure", async ({ page }) => {
  const before = pendingDecisionGame();
  const after = resolveDecision(before, "act");
  const recorded = after.decisions.at(-1)!;
  await openWithSave(page, before, false, { voice: false });
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.locator('button[data-response="act"]').click();
  const feedback = page.locator(".decision-recorded");
  await expect(feedback).toBeVisible();
  await expect(feedback).toContainText(recorded.impactChange < 0 ? "business impact eased" : "business impact rose");
  if (recorded.continuityChange < 0) await expect(feedback).toContainText("service continuity fell");
  await expect(feedback.locator(".effect-list")).toBeVisible();
  expect(await feedback.evaluate(element => element.getBoundingClientRect().top < document.querySelector(".report-layout")!.getBoundingClientRect().top)).toBe(true);
  await expect(feedback.locator("details")).toHaveJSProperty("open", false);
});
