import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { getShareCard, attacks } from "../../lib/advanced-game";
import { openWithSave, responsePhaseGame } from "./fixtures";

// The result image is drawn on the device in every engine the game supports,
// and it is drawn from the share card alone, which names no technique.
test("the result image is drawn and saved, and its card names no technique", async ({ page }) => {
  const game = { ...responsePhaseGame(), seed: 424242 };
  await openWithSave(page, game);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.waitForLoadState("networkidle");
  for (let phase = 0; phase < 3; phase++) {
    await page.locator(".response-options > button").first().click();
    await page.waitForTimeout(300);
  }
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save image" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("breach-command-result.png");
  const bytes = await readFile((await file.path())!);
  expect([...bytes.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
  expect(bytes.length).toBeGreaterThan(8000);
  await expect(page.locator(".share-result")).toContainText("Result image saved.");

  const card = Object.values(getShareCard(game)).filter(value => typeof value === "string").join(" ").toLowerCase();
  for (const attack of attacks) expect(card).not.toContain(attack.title.toLowerCase());
});
