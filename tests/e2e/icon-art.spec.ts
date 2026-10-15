import { expect, test } from "@playwright/test";
import { newGame, setHypothesis } from "../../lib/advanced-game";
import { openWithSave, twoStagesGame } from "./fixtures";

const widths = [320, 375, 430, 768, 810, 820, 834, 1024, 1080, 1194, 1280];

for (const [index, width] of widths.entries()) {
  test(`field-kit art stays beside readable controls at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await openWithSave(page, setHypothesis(newGame(index % 10, "training", () => 0), "identity"));
    const emblems = page.locator(".specialist-roster .specialist-name");
    await expect(emblems).toHaveCount(6);
    expect(await emblems.evaluateAll(elements => new Set(elements.map(element => getComputedStyle(element, "::after").backgroundPosition)).size)).toBe(6);
    await expect.poll(() => page.evaluate(() => performance.getEntriesByType("resource").some(entry => entry.name.endsWith("/art/icons/field-kit.webp")))).toBe(true);
    await page.locator(".specialist-roster").screenshot({ path: info.outputPath("specialist-emblems.png") });
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    const icons = page.locator(".procedure-code");
    await expect(icons).toHaveCount(12);
    await expect(icons.first()).toBeVisible();
    expect(await icons.evaluateAll(elements => new Set(elements.map(element => getComputedStyle(element).backgroundPosition)).size)).toBe(12);
    await expect(icons.first()).toHaveAttribute("aria-hidden", "true");
    await page.locator(".procedure-grid").screenshot({ path: info.outputPath("procedure-art.png") });
    const choice = page.locator(".procedure-card:not(:disabled)").first();
    const procedure = await choice.getAttribute("data-procedure");
    await choice.click();
    await expect(page.locator(".action-sheet")).toHaveAttribute("data-procedure", procedure!);
    await expect(page.getByRole("button", { name: "Run procedure", exact: true })).toBeVisible();
    await page.locator(".action-sheet").screenshot({ path: info.outputPath("action-art.png") });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("source miniatures follow completed collection sources and leave findings readable", async ({ page }, info) => {
  await openWithSave(page, twoStagesGame());
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  const findings = page.locator(".evidence-cards button");
  await expect(findings.first()).toBeAttached();
  expect(await findings.count()).toBeGreaterThanOrEqual(2);
  for (const finding of await findings.all()) {
    await expect(finding).toHaveAttribute("data-source", /.+/);
    await expect(finding.locator("strong")).not.toBeEmpty();
    expect(await finding.evaluate(element => getComputedStyle(element, "::before").backgroundImage)).toContain("field-kit.webp");
  }
  await page.locator(".evidence-cards").screenshot({ path: info.outputPath("source-miniatures.png") });
});

test("phone cooldown text does not overlap procedure art", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await openWithSave(page, twoStagesGame());
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page.locator(".procedure-card.cooling").first()).toBeVisible();
  for (const card of await page.locator(".procedure-card.cooling").all()) {
    const icon = await card.locator(".procedure-code").boundingBox();
    const badge = await card.locator(".procedure-badge").boundingBox();
    expect(icon!.x + icon!.width <= badge!.x || badge!.x + badge!.width <= icon!.x).toBe(true);
  }
});

test("an unavailable atlas leaves procedure selection usable", async ({ page }) => {
  await page.route("**/art/icons/field-kit.webp", route => route.abort());
  await openWithSave(page, setHypothesis(newGame(0, "training", () => 0), "identity"));
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.locator(".procedure-card:not(:disabled)").first().click();
  await expect(page.getByRole("button", { name: "Run procedure", exact: true })).toBeVisible();
});
