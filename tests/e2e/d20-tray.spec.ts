import { expect, test } from "@playwright/test";
import { newGame, setHypothesis } from "../../lib/advanced-game";
import { serialiseSession, SESSION_KEY } from "../../lib/session";

for (const width of [320, 375, 390, 430, 768, 810, 820, 834, 1024, 1080, 1194, 1280]) test(`d20 tray settles on the game result at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(([key, save]) => {
    localStorage.clear();
    localStorage.setItem(key, save);
    localStorage.setItem("breach-command.tutorial-complete", "true");
    localStorage.setItem("breach-command.preferences", JSON.stringify({ sound: false, music: false, voice: false, haptics: false }));
  }, [SESSION_KEY, serialiseSession(setHypothesis(newGame(0, "training", () => 0), "identity"), true, false)]);
  await page.goto("/play", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.locator(".procedure-card:not(:disabled)").first().click();
  const time = new Date("2030-01-01T00:00:00Z");
  await page.clock.install({ time });
  await page.clock.pauseAt(new Date(time.getTime() + 1000));
  await page.getByRole("button", { name: "Run procedure", exact: true }).click();
  await page.clock.runFor(100);
  await expect(page.locator(".die-face")).toHaveCount(20);
  // Inspect the real native throw, then advance to the session's settlement.
  await page.locator(".die-shell").evaluate(el => { const animation = el.getAnimations()[0]; animation.pause(); animation.currentTime = 440; });
  expect(await page.locator(".die-shell").evaluate(el => getComputedStyle(el).transform)).toContain("matrix3d");
  await page.clock.runFor(750);
  await expect(page.locator(".die")).not.toHaveClass(/rolling/);
  await expect(page.locator(".die-face").first()).toHaveText((await page.locator(".die strong").textContent())!);
  expect(await page.locator(".die-face").allTextContents()).toHaveLength(20);
  expect(new Set(await page.locator(".die-face").allTextContents()).size).toBe(20);
  expect(await page.locator(".die-shell").evaluate(el => el.getAnimations().length)).toBe(0);
  expect(await page.locator(".roll-dialog").evaluate(el => el.getBoundingClientRect().width)).toBeLessThanOrEqual(width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
});
