import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { newGame } from "../../lib/advanced-game";
import { serialiseSession, SESSION_KEY } from "../../lib/session";

for (const [width, height, image] of [[375, 844, "portrait"], [820, 1180, "portrait"], [1280, 800, "landscape"]] as const) {
  test(`title selects one poster and opens the desk by keyboard at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const posters: string[] = [];
    page.on("request", request => { if (request.url().includes("/art/title/")) posters.push(request.url()); });
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Breach Command", exact: true })).toHaveCount(1);
    await expect(page.locator(".title-art img")).toHaveJSProperty("complete", true);
    expect(await page.locator(".title-art img").evaluate((img: HTMLImageElement) => img.currentSrc)).toContain(`${image}.jpg`);
    expect(posters).toHaveLength(1);
    const start = page.getByRole("link", { name: "Stop the Breach", exact: true });
    await expect(start).toBeInViewport({ ratio: 1 });
    const build = page.locator(".title-build");
    await expect(build).toHaveText(/^v\d+\.\d+\.\d+ · Build (?:[a-f0-9]{7}|local)$/);
    await expect(build).toBeInViewport({ ratio: 1 });
    const labelBox = (await build.boundingBox())!;
    const stageBox = (await page.locator(".title-stage").boundingBox())!;
    const startBox = (await start.boundingBox())!;
    expect(labelBox.x).toBeGreaterThanOrEqual(stageBox.x);
    expect(labelBox.x + labelBox.width).toBeLessThanOrEqual(stageBox.x + stageBox.width);
    expect(labelBox.y + labelBox.height).toBeLessThanOrEqual(stageBox.y + stageBox.height);
    expect(labelBox.y).toBeGreaterThan(startBox.y + startBox.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.keyboard.press("Tab");
    await expect(start).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/play$/);
    await expect(page.locator(".briefing-screen")).toBeVisible();
  });
}

test("title preserves saved progress and locale through the title entry", async ({ page }) => {
  const save = serialiseSession(newGame(2, "training", () => 0), true, false);
  await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [SESSION_KEY, save]);
  await page.goto("/?locale=en-XA", { waitUntil: "networkidle" });
  expect(await page.evaluate(key => localStorage.getItem(key), SESSION_KEY)).toBe(save);
  await expect(page.locator(".title-start")).toHaveAttribute("href", "/play?locale=en-XA");
  await page.locator(".title-start").click();
  await expect(page.locator(".resume-card")).toBeVisible();
  await expect(page.locator(".briefing-screen")).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), SESSION_KEY)).toBe(save);
});

test("the title entry remains usable without artwork and title has no axe violations", async ({ page }) => {
  await page.route("**/art/title/**", route => route.abort());
  await page.goto("/", { waitUntil: "networkidle" });
  const require = createRequire(import.meta.url);
  await page.addScriptTag({ content: readFileSync(require.resolve("axe-core/axe.min.js"), "utf8") });
  const violations = await page.evaluate(async () => (await window.axe.run(document, {})).violations);
  expect(violations).toEqual([]);
  await page.getByRole("link", { name: "Stop the Breach", exact: true }).click();
  await expect(page.locator(".briefing-screen")).toBeVisible();
});
