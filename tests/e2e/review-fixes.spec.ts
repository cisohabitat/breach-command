import { expect, test } from "@playwright/test";
import { CAMPAIGN_KEY } from "../../lib/campaign";
import { SESSION_KEY } from "../../lib/session";
import { mapOfferGame, openWithSave, pendingDecisionGame } from "./fixtures";

// The game review of 25 October 2026: leaving an operation cost nothing, a
// reload during the die's reveal drew the roll again, and Discard deleted a
// saved operation in one click.

const trust = (page: import("@playwright/test").Page) => page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? "{}").leadershipTrust ?? 50, CAMPAIGN_KEY);

test("Discard asks first, and a played operation is recorded as a loss", async ({ page }) => {
  await openWithSave(page, pendingDecisionGame());
  await page.getByRole("button", { name: "Discard", exact: true }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("recorded as a loss");
  await dialog.getByRole("button", { name: "Keep the saved operation" }).click();
  expect(await page.evaluate(key => localStorage.getItem(key), SESSION_KEY)).not.toBeNull();
  expect(await trust(page)).toBe(50);
  await page.getByRole("button", { name: "Discard", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Discard it" }).click();
  await expect(page.getByRole("button", { name: /^Resume “/ })).toHaveCount(0);
  expect(await page.evaluate(key => localStorage.getItem(key), SESSION_KEY)).toBeNull();
  expect(await trust(page)).toBe(42);
});

test("leaving an operation in play through New incident costs a loss", async ({ page }) => {
  await openWithSave(page, mapOfferGame());
  await page.getByRole("button", { name: /^Resume “/ }).click();
  await page.getByRole("button", { name: "New incident" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("recorded as a loss");
  await dialog.getByRole("button", { name: "Choose a new incident" }).click();
  await expect(page.locator(".briefing-screen")).toBeVisible();
  expect(await trust(page)).toBe(42);
});

test("a resolved roll is saved before its die is shown", async ({ page }) => {
  const game = mapOfferGame();
  await openWithSave(page, game);
  await page.getByRole("button", { name: /^Resume “/ }).click();
  await page.locator(".procedure-card:not(:disabled)").first().click();
  await expect(page.locator(".action-sheet")).toBeVisible();
  const time = new Date("2030-01-01T00:00:00Z");
  await page.clock.install({ time });
  await page.clock.pauseAt(new Date(time.getTime() + 1000));
  await page.getByRole("button", { name: "Run procedure", exact: true }).click();
  await page.clock.runFor(1450);
  // The die has its face; the report has not opened. A reload now must find
  // the turn already taken, not the operation before the roll.
  await expect(page.locator(".report-dialog")).toHaveCount(0);
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).game.turns.length, SESSION_KEY);
  expect(saved).toBe(game.turns.length + 1);
});

test("an Ironman operation left open is recorded on the next visit", async ({ page }) => {
  await page.addInitScript(() => {
    try {
      if (sessionStorage.getItem("seeded")) return;
      localStorage.clear();
      localStorage.setItem("breach-command.tutorial-complete", "true");
      localStorage.setItem("breach-command.ironman-open", JSON.stringify({ scenario: 0, seed: null }));
      sessionStorage.setItem("seeded", "1");
    } catch {}
  });
  await page.goto("/play", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".storage-notice")).toContainText("An Ironman operation left unfinished");
  expect(await trust(page)).toBe(42);
  expect(await page.evaluate(() => localStorage.getItem("breach-command.ironman-open"))).toBeNull();
  await page.reload();
  await expect(page.locator(".briefing-screen")).toBeVisible();
  expect(await trust(page)).toBe(42);
});
