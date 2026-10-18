import { expect, test } from "@playwright/test";
import { availableIn, newGame, playTurn, proceduresFor, resolveDecision, resolveSetPiece, setHypothesis } from "../../lib/advanced-game";
import { openWithSave, pendingDecisionGame, twoStagesGame } from "./fixtures";

for (const width of [375, 1280]) {
  test(`a fresh player's first check tests a reading without promising support at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    // Start with the shipped defaults and the academy still enabled, rather
    // than the saved-session helper which marks the tutorial complete.
    await page.addInitScript(() => {
      localStorage.clear();
      Object.defineProperty(Crypto.prototype, "getRandomValues", {
        configurable: true,
        value(array: ArrayBufferView) {
          new Uint8Array(array.buffer, array.byteOffset, array.byteLength).fill(17);
          return array;
        },
      });
    });
    await page.goto("/play", { waitUntil: "networkidle" });
    await page.locator(width < 650 ? ".phone-quick-start .primary-button" : ".start-button").click();
    await page.getByRole("button", { name: /Assume command/ }).click();
    const next = page.locator(".tutorial-next button");
    await expect(page.locator(".tutorial-steps > div")).toHaveCount(1);
    await expect(next).toBeInViewport({ ratio: 1 });
    await next.click();
    await expect(page.locator("#hypothesis-heading")).toHaveText("How did they get in?");
    await expect(page.locator(".training-prompt")).toContainText("A working reading (hypothesis) is your current explanation");
    await expect(page.locator(".hypothesis-gate")).toHaveCount(0);
    await expect(page.locator(".reference-fold")).toHaveJSProperty("open", false);
    await page.locator(".hypothesis-options > button").filter({ hasText: "Identity-led intrusion" }).click();
    const source = page.locator('[data-procedure="identity"]');
    await expect(source).toHaveAccessibleName(/own source for this reading/);
    await expect(source).not.toHaveAccessibleName(/supports current hypothesis/);
    await page.getByRole("button", { name: /^Command/ }).first().click();
    await expect(page.locator(".tutorial-next")).toContainText("Its result may support or challenge your explanation.");
    await expect(next).toBeInViewport({ ratio: 1 });
    await next.click();
    await source.click();
    await expect(page.locator(".action-sheet")).toContainText("Starting plan:");
    const commit = page.locator(".procedure-commit");
    await expect(commit).toContainText("Identity audit");
    await expect(commit).toContainText("Focused scope · Balanced analysis");
    await expect(commit).toContainText("Costs 1 turn");
    await expect(commit.getByRole("button", { name: "Run procedure", exact: true })).toBeInViewport({ ratio: 1 });
    await page.getByRole("group", { name: "Scope", exact: true }).getByRole("button", { name: /^Enterprise/ }).click();
    await page.getByRole("group", { name: "Intensity", exact: true }).getByRole("button", { name: /^Rapid/ }).click();
    await expect(commit).toContainText("Enterprise scope · Rapid analysis");
    await page.getByRole("group", { name: "Scope", exact: true }).getByRole("button", { name: /^Focused/ }).click();
    await page.getByRole("group", { name: "Intensity", exact: true }).getByRole("button", { name: /^Balanced/ }).click();
    await expect(commit).toContainText("Focused scope · Balanced analysis");
    const checkHelp = page.locator(".action-sheet details").filter({ has: page.getByText("How checks affect evidence and pressure", { exact: true }) });
    await expect(checkHelp).toHaveJSProperty("open", false);
    await checkHelp.locator("summary").click();
    await expect(checkHelp).toContainText("Signal strength depends on the finding");
    await checkHelp.locator("summary").click();
    await page.getByRole("button", { name: "Run procedure", exact: true }).click();
    const report = page.locator(".report-dialog");
    await expect(report).toBeVisible({ timeout: 15_000 });
    await expect(report).toContainText("Stage tested");
    const details = report.locator(".report-collection-details");
    await expect(details).toHaveJSProperty("open", false);
    await expect(report.locator(".report-narrative")).toBeVisible();
    await expect(details.locator(".report-narrative")).toHaveCount(0);
    await expect(report.locator(".turn-movement")).toContainText("This turn");
    await expect(report.locator(".turn-movement .effect-list")).toBeVisible();
    await expect(details.locator(".turn-movement")).toHaveCount(0);
    await details.locator("summary").click();
    await expect(details.locator(".result-roll")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

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

test("early reference controls remain usable and expand after two checks without findings", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  let game = setHypothesis({ ...newGame(0, "training", () => 0), injectDeck: [] }, "identity");
  const first = proceduresFor(game).find(source => availableIn(game, source.id) === 0)!;
  game = playTurn(game, first.id, 1);
  await openWithSave(page, game, true, { voice: false });
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.getByRole("button", { name: /^Investigate/ }).first().click();
  const reference = page.locator(".reference-fold");
  await expect(reference).toHaveJSProperty("open", false);
  await reference.locator(":scope > summary").focus();
  await reference.locator(":scope > summary").press("Enter");
  await expect(reference.locator(":scope > summary")).toBeFocused();
  await expect(page.locator(".infrastructure-console")).toBeVisible();
  await expect(page.locator(".theory-guide")).toHaveJSProperty("open", false);
  await page.locator(".theory-guide > summary").click();
  await expect(page.locator(".case-theory button").first()).toBeVisible();
  const second = proceduresFor(game).find(source => availableIn(game, source.id) === 0)!;
  game = playTurn(game, second.id, 1);
  if (game.pendingSetPiece) game = resolveSetPiece(game, "a");
  expect(game.evidence).toHaveLength(0);
  await openWithSave(page, game, true, { voice: false });
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.getByRole("button", { name: /^Investigate/ }).first().click();
  await expect(reference).toHaveJSProperty("open", true);
});

test("guidance-off and Expert retain the expanded desktop reference", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const expert of [false, true]) {
    const game = newGame(0, "training", () => 0);
    await openWithSave(page, expert ? { ...game, mode: "expert" } : game, expert, { voice: false });
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await page.getByRole("button", { name: /^Investigate/ }).first().click();
    await expect(page.locator(".reference-fold")).toHaveJSProperty("open", true);
    await expect(page.locator(".training-prompt")).toHaveCount(0);
  }
});

test("the simplified opening remains usable in the longer pseudo-locale", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await openWithSave(page, newGame(0, "training", () => 0), true, { voice: false }, "/play?locale=en-XA");
  await page.locator(".phone-quick-start .primary-button").click();
  await page.keyboard.press("Escape");
  await page.locator(".workspace-tabs button").nth(1).click();
  const reference = page.locator(".reference-fold");
  await expect(page.locator(".training-prompt")).toBeVisible();
  await expect(reference).toHaveJSProperty("open", false);
  await reference.locator(":scope > summary").click();
  await expect(page.locator(".infrastructure-console")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

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
