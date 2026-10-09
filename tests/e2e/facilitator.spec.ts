import { expect, test } from "@playwright/test";
import { attackMitre } from "../../lib/advanced-game";
import { openWithSave, responsePhaseGame } from "./fixtures";

// The facilitator sheet is never on screen, and printed it fits one or two
// pages at A4 and at Letter. Chromium is the engine that prints to PDF here.
test("the facilitator sheet prints alone, on one or two pages at A4 and Letter", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "PDF output is Chromium's");
  const game = responsePhaseGame();
  await openWithSave(page, game);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.waitForLoadState("networkidle");
  for (let phase = 0; phase < 3; phase++) {
    await page.locator(".response-options > button").first().click();
    await page.waitForTimeout(300);
  }
  await page.getByRole("button", { name: /Open after-action review/ }).click();
  await expect(page.getByRole("button", { name: "Print facilitator sheet" })).toBeVisible();
  await expect(page.locator(".facilitator-sheet")).toBeHidden();
  await expect(page.locator(".facilitator-offer")).toContainText("It gives the answer away");

  await page.evaluate(() => document.documentElement.classList.add("print-facilitator"));
  await page.emulateMedia({ media: "print" });
  const sheet = page.locator(".facilitator-sheet");
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText("Form BC-320");
  for (const id of game.chain) await expect(sheet).toContainText(attackMitre[id][0]);
  await expect(page.locator(".debrief-actions")).toBeHidden();
  // A print that is blank or shifted off the page still counts its pages; the
  // sheet has to start on the page, where the reader will see it.
  const box = (await sheet.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.height).toBeGreaterThan(300);

  for (const format of ["A4", "Letter"]) {
    const pdf = (await page.pdf({ format, printBackground: false })).toString("latin1");
    const pages = (pdf.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    expect(pages, `${format} pages`).toBeGreaterThanOrEqual(1);
    expect(pages, `${format} pages`).toBeLessThanOrEqual(2);
  }
});
