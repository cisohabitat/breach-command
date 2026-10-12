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

// The review prints whole. An open dialog clips the page to the window to
// lock its scroll, and the review printed one page and stopped there.
test("the after-action review prints every section, open, not just its first page", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "PDF output is Chromium's");
  await openWithSave(page, responsePhaseGame());
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.waitForLoadState("networkidle");
  for (let phase = 0; phase < 3; phase++) {
    await page.locator(".response-options > button").first().click();
    await page.waitForTimeout(300);
  }
  await page.getByRole("button", { name: /Open after-action review/ }).click();
  await expect(page.getByRole("button", { name: "Print review" })).toBeVisible();
  await page.emulateMedia({ media: "print" });
  const review = page.locator(".debrief-dialog");
  const height = await review.evaluate(element => element.scrollHeight);
  expect(height).toBeGreaterThan(1200);
  // Nothing between the review and the page clips it short.
  const clippedBy = await review.evaluate(element => {
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      if (style.overflowY !== "visible" && parent.clientHeight < element.scrollHeight) return parent.tagName;
    }
    return element.clientHeight < element.scrollHeight ? "the review itself" : null;
  });
  expect(clippedBy).toBeNull();
  const pdf = (await page.pdf({ format: "A4", printBackground: false })).toString("latin1");
  expect((pdf.match(/\/Type\s*\/Page[^s]/g) ?? []).length).toBeGreaterThanOrEqual(2);
  // On paper a fold cannot be opened, so every fold prints open, and the
  // ones that were closed close again after printing.
  const folds = review.locator("details");
  const closedBefore = await folds.evaluateAll(list => list.filter(fold => !(fold as HTMLDetailsElement).open).length);
  expect(closedBefore).toBeGreaterThan(0);
  await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
  expect(await folds.evaluateAll(list => list.every(fold => (fold as HTMLDetailsElement).open))).toBe(true);
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  expect(await folds.evaluateAll(list => list.filter(fold => !(fold as HTMLDetailsElement).open).length)).toBe(closedBefore);
});
