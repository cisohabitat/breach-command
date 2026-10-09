import { expect, test, type Page } from "@playwright/test";
import { sectorSetPieces } from "../../lib/phase8";
import { commandEvents } from "../../lib/advanced-game";
import { openWithSave, pendingDecisionGame, responsePhaseGame, twoStagesGame } from "./fixtures";

// Pixel baselines for the screens a player spends the game on, at the four
// widths the layout sweep checks. Most of what visual reviews found (an
// effects column stranded mid-row, three figures at three heights, two rules
// twenty pixels apart) was a regression a diff would have caught before merge.
// Baselines are Chromium on a GitHub runner, recorded by the "Record visual
// baselines" workflow after a deliberate visual change and reviewed image by
// image before they are brought in. A developer's machine renders text with
// slightly different anti-aliasing (about one per cent of a phone screen), so
// outside CI the comparison allows three per cent: enough for glyph edges, not
// for a moved column or a missing rule.
const widths = [[320, 720], [390, 844], [820, 1180], [1280, 800]] as const;

// The incident variant previewed on the assignment is drawn fresh on each
// load, so its line is masked rather than allowed to fail every run.
const masked = (page: Page) => [page.locator(".variant-brief")];

async function resume(page: Page) {
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.waitForTimeout(600);
}

async function snap(page: Page, name: string) {
  await expect(page).toHaveScreenshot(name, { mask: masked(page), animations: "disabled", caret: "hide", maxDiffPixelRatio: process.env.CI ? 0.01 : 0.03 });
}

test.describe("visual baselines", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "baselines are recorded in Chromium");

  for (const [width, height] of widths) {
    test(`screens at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height });

      await openWithSave(page, null);
      await snap(page, `${width}-assignment.png`);

      await openWithSave(page, twoStagesGame());
      await resume(page);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
      await snap(page, `${width}-investigate.png`);

      await openWithSave(page, pendingDecisionGame());
      await resume(page);
      await snap(page, `${width}-report.png`);

      const sector = twoStagesGame();
      await openWithSave(page, { ...sector, pendingSetPiece: sectorSetPieces[sector.scenario].id });
      await resume(page);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
      await snap(page, `${width}-sector-decision.png`);

      await openWithSave(page, { ...sector, pendingCommand: Object.keys(commandEvents)[0] as keyof typeof commandEvents });
      await resume(page);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
      await snap(page, `${width}-command-event.png`);

      await openWithSave(page, responsePhaseGame());
      await resume(page);
      await snap(page, `${width}-response.png`);

      for (let phase = 0; phase < 3; phase++) {
        await page.locator(".response-options > button").first().click();
        await page.waitForTimeout(300);
      }
      await snap(page, `${width}-ending.png`);

      await page.getByRole("button", { name: /Open after-action review|Review the record|Review the drill/ }).click();
      await page.waitForTimeout(600);
      await snap(page, `${width}-review.png`);
    });
  }
});
