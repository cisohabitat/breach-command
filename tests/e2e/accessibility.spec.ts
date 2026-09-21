import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

type AxeViolation = { id: string; impact: string | null; help: string; nodes: { target: string[]; failureSummary?: string }[] };

declare global {
  interface Window {
    axe: { run: (context: unknown, options: unknown) => Promise<{ violations: AxeViolation[] }> };
  }
}

// axe is injected into the page rather than pulled in through a wrapper, so the
// audit adds one dependency and no second test runner.
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");

// The narrow widths matter most: below 431px the topbar drops its button labels,
// so any control that leans on visible text alone loses its accessible name
// there and nowhere else.
const widths = [320, 375, 430, 768, 1024, 1280] as const;

async function openGame(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      localStorage.setItem("breach-command.tutorial-complete", "true");
    } catch {}
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".briefing-screen")).toBeVisible();
}

async function expectNoViolations(page: Page, surface: string) {
  await page.addScriptTag({ content: axeSource });
  const violations = await page.evaluate(async () => {
    const result = await window.axe.run(document, { resultTypes: ["violations"] });
    return result.violations.map(violation => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      targets: violation.nodes.map(node => node.target.join(" ")),
    }));
  });
  const report = violations.map(v => `${v.impact} · ${v.id}: ${v.help} → ${v.targets.join(", ")}`).join("\n");
  expect(violations, `${surface} should report no accessibility violations\n${report}`).toEqual([]);
}

test.describe("accessibility audit", () => {
  for (const width of widths) {
    test(`assignment screen at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openGame(page);
      await expectNoViolations(page, `assignment ${width}`);
    });
  }

  test("overlays and the command workspace at a phone width", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await openGame(page);

    await page.getByRole("button", { name: "Field guide" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expectNoViolations(page, "field guide");
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Game settings" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expectNoViolations(page, "settings");
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: /Begin investigation/i }).click();
    await expect(page.locator(".game-screen")).toBeVisible();
    await expectNoViolations(page, "command workspace");
  });

  // The after-action review is the longest surface in the game and gained a
  // section index and a per-turn ledger, so it is audited in its own right.
  test("the after-action review", async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await openGame(page);
    await page.locator("details.advanced-setup > summary").click();
    for (const name of ["Fast resolution", "Bot commander"]) {
      const control = page.getByRole("switch", { name });
      if (await control.getAttribute("aria-checked") !== "true") await control.click();
    }
    await page.getByRole("button", { name: /Begin investigation/i }).click();
    await page.getByRole("button", { name: /Assume command/i }).click();
    await expect(page.locator("[data-resolution]")).toBeVisible({ timeout: 90_000 });
    // The bot opens the review itself a beat after the operation resolves, so
    // either the click gets there first or the bot does. Retrying the whole step
    // keeps a lost race from failing the audit.
    const heading = page.getByText("AFTER-ACTION REVIEW", { exact: true });
    const openReview = page.getByRole("button", { name: /Open after-action review|Review the record|Review the drill/i });
    await expect(async () => {
      if (await heading.isVisible()) return;
      await openReview.click({ timeout: 2_000 });
      await expect(heading).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 30_000 });
    await expectNoViolations(page, "after-action review");

    // The section index has to actually reach its sections.
    const index = page.getByRole("navigation", { name: "Review sections" });
    await expect(index).toBeVisible();
    await index.getByRole("button", { name: "Hypothesis" }).click();
    await expect(page.locator("#debrief-hypothesis")).toBeVisible();
    await expect(page.locator("#debrief-hypothesis").getByText(/HYPOTHESIS ACCURACY/)).toBeVisible();
  });

  // Every topbar control keeps a name at the width where its label is hidden.
  test("topbar controls keep their names when labels are hidden", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await openGame(page);
    for (const name of ["Field guide", "Game settings"]) {
      await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
    }
  });
});
