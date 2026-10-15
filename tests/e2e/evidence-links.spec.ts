import { expect, test } from "@playwright/test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { correlateEvidence, getEvidenceSpecialist } from "../../lib/advanced-game";
import { msg } from "../../lib/i18n/message";
import { namedSpecialists } from "../../lib/command-systems";
import { openWithSave, twoStagesGame } from "./fixtures";

const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");

async function openEvidence(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  const reference = page.locator(".reference-fold");
  if (!(await reference.evaluate(element => (element as HTMLDetailsElement).open))) await reference.locator(":scope > summary").click();
  await page.locator(".evidence-detail").evaluate(element => { (element as HTMLDetailsElement).open = true; });
}

for (const width of [320, 375, 430, 768, 810, 820, 834, 1024, 1080, 1194, 1280]) {
  test(`links and source portraits stay readable at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const game = twoStagesGame();
    await openWithSave(page, game);
    await openEvidence(page);
    const links = page.getByRole("region", { name: "Linked evidence", exact: true });
    await expect(links.locator("li")).toHaveCount(0);
    const findings = page.locator(".evidence-cards button");
    for (const [index, item] of game.evidence.entries()) {
      const specialist = getEvidenceSpecialist(game, item);
      await expect(findings.nth(index).locator(".source-analyst")).toContainText(namedSpecialists[specialist].name);
      await expect(findings.nth(index).locator(".source-analyst img")).toHaveAttribute("src", `/art/portraits/${specialist}.webp`);
      await expect(findings.nth(index).locator(".source-analyst img")).toHaveAttribute("alt", "");
    }
    await findings.nth(0).click();
    await findings.nth(1).click();
    await expect(links.locator('[data-relationship="untested"]')).toContainText("Untested connection");
    await expect(links.locator('[data-relationship="supported"]')).toHaveCount(0);
    await links.screenshot({ path: info.outputPath("untested-link.png") });
    await page.getByRole("button", { name: "Causal sequence", exact: true }).click();
    await page.getByRole("button", { name: "Test assessment", exact: true }).click();
    await expect(links.locator('[data-relationship="supported"]')).toContainText("Supported causal link");
    await expect(links.locator('[data-relationship="untested"]')).toHaveCount(0);
    await links.screenshot({ path: info.outputPath("supported-link.png") });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await links.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.addScriptTag({ content: axeSource });
    expect(await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ["violations"] })).violations)).toEqual([]);
    await findings.nth(0).click();
    await findings.nth(1).click();
    await page.getByRole("button", { name: "Causal sequence", exact: true }).click();
    await expect(page.getByRole("button", { name: "Test assessment", exact: true })).toBeDisabled();
    await expect(page.locator(".relationship-helper")).toContainText("This pair is already tested");
  });
}

for (const assessment of ["causal", "coincidental"] as const) {
  test(`saved ${assessment} comparisons preserve disputed and unrelated relationships`, async ({ page }) => {
    const game = twoStagesGame();
    const second = game.evidence[1];
    const bounded = { ...game, evidence: [game.evidence[0], { ...second, supports: null, title: msg("engine.evidence.emptyTitle", { source: second.source }) }] };
    const compared = correlateEvidence(bounded, [bounded.evidence[0].id, second.id], assessment);
    await openWithSave(page, compared);
    await openEvidence(page);
    const links = page.locator(".evidence-links");
    await expect(links.locator(assessment === "causal" ? '[data-relationship="disputed"]' : '[data-relationship="unrelated"]')).toHaveCount(1);
    await expect(links).toContainText(assessment === "causal" ? "Causal link disputed" : "No causal link");
    await expect(links.locator('[data-relationship="untested"]')).toHaveCount(0);
  });
}

test("missing portraits preserve complete source-review attribution", async ({ page }) => {
  await page.route("**/art/portraits/**", route => route.abort());
  const game = twoStagesGame();
  await openWithSave(page, game);
  await openEvidence(page);
  const first = page.locator(".evidence-cards button").first();
  await expect(first.locator(".source-analyst")).toContainText(namedSpecialists[getEvidenceSpecialist(game, game.evidence[0])].name);
  await first.click();
  await expect(first).toHaveAttribute("aria-pressed", "true");
});
