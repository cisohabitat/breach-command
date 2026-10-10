import { expect, test } from "@playwright/test";
import { pseudo } from "../../lib/i18n/index.ts";
import { openWithSave, responsePhaseGame, twoStagesGame } from "./fixtures";

// The pseudo-locale makes every catalogued string a third longer, as German
// runs, so a layout that would break in a longer language breaks here first:
// no page scrolls sideways and the workspace tabs stay on one line.
const widths = [320, 390, 820, 1280];

test("the catalogued interface holds its layout with strings a third longer", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "measured in Chromium");
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  for (const width of widths) {
    await page.setViewportSize({ width, height: 844 });
    await openWithSave(page, null, false, null, "/?locale=en-XA");
    await expect(page.locator(".topbar")).toContainText("[Fîéld güîdé");
    expect(await overflow(), `assignment at ${width}`).toBeLessThanOrEqual(0);

    await openWithSave(page, twoStagesGame(), false, null, "/?locale=en-XA");
    await page.getByRole("button", { name: pseudo("Resume"), exact: true }).click();
    await page.waitForTimeout(400);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await expect(page.locator(".workspace-tabs")).toContainText("[Îñvéštîgáté");
    expect(await overflow(), `investigate at ${width}`).toBeLessThanOrEqual(0);
    const tabs = await page.locator(".workspace-tabs > button").evaluateAll(buttons => buttons.map(button => Math.round(button.getBoundingClientRect().top)));
    expect(new Set(tabs).size, `tabs on one line at ${width}`).toBe(1);

    await openWithSave(page, responsePhaseGame(), false, null, "/?locale=en-XA");
    await page.getByRole("button", { name: pseudo("Resume"), exact: true }).click();
    await page.waitForTimeout(400);
    for (let phase = 0; phase < 3; phase++) {
      await page.locator(".response-options > button").first().click();
      await page.waitForTimeout(250);
    }
    await expect(page.locator(".share-result")).toContainText("[Çöpý réšült");
    expect(await overflow(), `ending at ${width}`).toBeLessThanOrEqual(0);
  }
});
