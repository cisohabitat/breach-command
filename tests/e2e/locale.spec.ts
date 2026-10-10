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

// Every word on a seeded screen is one the pseudo-locale wrote: the catalogue
// and the content overlay bracket what they give, so once the brackets are
// taken out no word is left but a specialist's callsign (a code name) and the
// build's id. A word left over is English that no locale could replace.
test("every word on the seeded screens comes from the catalogue or the content overlay", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "read in Chromium");
  const { namedSpecialists } = await import("../../lib/phase8.ts");
  const allowed = new Set([...Object.values(namedSpecialists).map(specialist => specialist.callsign), "local"]);
  const leftOver = async (where: string) => {
    let text = await page.locator("body").innerText();
    for (let previous = ""; previous !== text;) { previous = text; text = text.replace(/\[[^[\]]*\]/g, " "); }
    const words = [...new Set(text.match(/[A-Za-z]{4,}/g) ?? [])].filter(word => !allowed.has(word));
    expect(words, `${where}: English outside the pseudo-locale`).toEqual([]);
  };
  await page.setViewportSize({ width: 1280, height: 900 });
  await openWithSave(page, null, false, null, "/?locale=en-XA");
  await leftOver("assignment");
  await openWithSave(page, twoStagesGame(), false, null, "/?locale=en-XA");
  await page.getByRole("button", { name: pseudo("Resume"), exact: true }).click();
  await page.waitForTimeout(400);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  for (const [index, tab] of ["command", "investigate", "briefing"].entries()) {
    await page.locator(".workspace-tabs > button").nth(index).click();
    await page.waitForTimeout(300);
    await leftOver(tab);
  }
  await openWithSave(page, responsePhaseGame(), false, null, "/?locale=en-XA");
  await page.getByRole("button", { name: pseudo("Resume"), exact: true }).click();
  await page.waitForTimeout(400);
  for (let phase = 0; phase < 3; phase++) {
    await page.locator(".response-options > button").first().click();
    await page.waitForTimeout(250);
  }
  await leftOver("ending");
  await page.getByRole("button", { name: pseudo("Open after-action review") }).first().click();
  await expect(page.locator("[role=dialog]")).toBeVisible();
  await page.waitForTimeout(500);
  await leftOver("review");
});
