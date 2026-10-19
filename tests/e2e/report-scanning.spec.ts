import { expect, test } from "@playwright/test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { availableIn, newGame, playTurn, proceduresFor, setHypothesis, sourceSeesReading } from "../../lib/advanced-game";
import { seededRoll } from "../../lib/phase8";
import { openWithSave, pendingDecisionGame } from "./fixtures";

const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");

for (const width of [320, 375, 430, 768, 810, 820, 834, 1024, 1080, 1194, 1280]) {
  test(`the report exposes every response without committing it at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 320 ? 720 : width >= 1024 ? 757 : 900 });
    await openWithSave(page, { ...pendingDecisionGame(), difficulty: "training" }, true, { voice: true, sound: false, music: false });
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    const report = page.locator(".report-dialog");
    const index = report.getByRole("navigation", { name: "Find a command response" });
    const finding = report.locator(".discovery");
    await expect(finding.getByRole("heading", { level: 3 })).toBeVisible();
    const findingBox = (await finding.boundingBox())!;
    const indexBox = (await index.boundingBox())!;
    expect(findingBox.y + findingBox.height).toBeLessThanOrEqual(indexBox.y);
    await expect(index.getByRole("link")).toHaveCount(5);
    await expect(index).toBeInViewport({ ratio: 1 });
    await expect(report.locator(".report-fields")).toContainText("Stage tested");
    await expect(report.locator(".report-fields")).toContainText("Stage 1: Initial compromise");
    // The narrowest form still keeps the result's word intact.
    const resultLines = await report.locator(".report-fields dd.confirmed").evaluate(element => {
      const text = element.firstChild!;
      const range = document.createRange();
      range.setStart(text, "Stage ".length);
      range.setEnd(text, text.textContent!.length);
      return range.getClientRects().length;
    });
    expect(resultLines).toBe(1);
    const details = report.locator(".report-collection-details");
    await expect(details).toHaveJSProperty("open", false);
    const assessment = report.locator(".evidence-assessment");
    await expect(assessment).toContainText("Signal: strong");
    await expect(assessment).toContainText("Confidence: weak");
    await expect(assessment.locator("small")).toBeVisible();
    const basis = assessment.locator("details");
    await expect(basis).toHaveJSProperty("open", false);
    await basis.locator("summary").click();
    await expect(basis.locator("p")).toBeVisible();
    await basis.locator("summary").click();

    // The index only navigates. Keyboard activation lands on the actual choice
    // above the sticky footer, with no decision committed by the jump itself.
    const lastLink = index.getByRole("link").last();
    await lastLink.focus();
    await page.keyboard.press("Enter");
    const lastChoice = report.locator("button[data-response]").last();
    await expect(lastChoice).toBeFocused();
    await expect(lastChoice).toBeInViewport({ ratio: 0.95 });
    await expect(lastChoice.getByText("Uncertainty:", { exact: true })).toBeVisible();
    await expect(lastChoice.locator(".effect-list")).toContainText(/benefit|cost|unchanged/);
    await expect(report.locator("button[data-response]")).toHaveCount(5);
    const rationale = report.locator(".choice-rationale").last();
    await expect(rationale).toHaveJSProperty("open", false);
    await rationale.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(rationale.locator("p").first()).toBeVisible();
    await expect(report.locator("button[data-response]")).toHaveCount(5);
    await expect(lastChoice.locator(".decision-effect")).toBeVisible();
    await rationale.locator("summary").press("Enter");
    await lastChoice.focus();

    const covered = await lastChoice.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return !hit || !element.contains(hit);
    });
    expect(covered).toBe(false);
    await details.locator("summary").click();
    await expect(details.locator(".result-roll")).toBeVisible();
    await expect(details).toContainText("Rolled 20 on the d20");
    if (width === 1024) {
      await details.locator("summary").click();
      await report.evaluate(element => { element.scrollTop = 0; });
      await report.locator(".options-below").click();
      await expect(lastChoice).toBeFocused();
      await expect(lastChoice).toBeInViewport({ ratio: 0.95 });
    }
    await page.addScriptTag({ content: axeSource });
    const violations = await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ["violations"] })).violations);
    expect(violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

for (const mode of ["campaign", "expert"] as const) for (const width of [375, 1180]) {
  test(`a failed check preserves uncertainty and ${mode} source guidance at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1180 ? 757 : 812 });
    let seed = 1;
    while (seededRoll(seed, 0) !== 2) seed++;
    const game = { ...setHypothesis(newGame(0, "training", () => 0, { mode }), "identity"), seed, injectDeck: [] as number[] };
    const result = playTurn(game, "identity");
    expect(result.turns[0].success).toBe(false);
    const expected = proceduresFor(result).filter(procedure => availableIn(result, procedure.id) === 0 && sourceSeesReading(result, procedure.id) === true).map(procedure => procedure.title);
    await openWithSave(page, game, false, { voice: false, sound: false, music: false });
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await page.locator('[data-procedure="identity"]').click();
    await page.getByRole("button", { name: "Run procedure", exact: true }).click();
    const report = page.locator(".report-dialog");
    await expect(report.locator(".report-inconclusive")).toContainText("rules out no route or source");
    await expect(report.locator(".report-standing")).toHaveCount(0);
    const sources = report.locator(".report-available-sources");
    if (mode === "expert") await expect(sources).toHaveCount(0);
    else {
      expect(expected.length).toBeGreaterThan(0);
      await expect(sources.locator("li")).toHaveText(expected);
      await expect(sources).toBeInViewport({ ratio: 1 });
      await expect(sources).not.toContainText("Identity audit");
    }
    await expect(report.getByRole("button", { name: "Continue investigation", exact: true })).toBeVisible();
    if (mode === "campaign" && width === 1180) {
      await report.locator(".report-collection-details > summary").click();
      await report.getByRole("button", { name: "Continue investigation", exact: true }).click();
      await page.locator(".procedure-card:not(:disabled)").first().click();
      await page.getByRole("button", { name: "Run procedure", exact: true }).click();
      await expect(page.locator(".report-collection-details")).toHaveJSProperty("open", false);
    }
  });
}
