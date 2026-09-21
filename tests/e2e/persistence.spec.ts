import { expect, test } from "@playwright/test";

const PREFERENCES = "breach-command.preferences";

// Two effects run on mount: one reads the stored settings, one writes them. For
// a long time the write went first and put the defaults straight over whatever
// the player had chosen, so nothing ever survived a reload. These check the
// order from the outside, where the bug actually showed.
test.describe("local persistence", () => {
  test("stored settings survive a page load", async ({ page }) => {
    await page.addInitScript(() => {
      try {
        if (localStorage.getItem("breach-command.seeded")) return;
        localStorage.clear();
        localStorage.setItem("breach-command.tutorial-complete", "true");
        localStorage.setItem("breach-command.preferences", JSON.stringify({ sound: false, music: false, haptics: false, highContrast: true }));
        localStorage.setItem("breach-command.seeded", "1");
      } catch {}
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".briefing-screen")).toBeVisible();
    await page.waitForTimeout(500);

    const stored = await page.evaluate(key => localStorage.getItem(key), PREFERENCES);
    expect(JSON.parse(stored ?? "{}"), "the page must not overwrite settings it has not read yet").toEqual({
      sound: false, music: false, haptics: false, highContrast: true,
    });
    // High contrast is applied, not merely remembered.
    await expect(page.locator(".app-shell.high-contrast")).toBeVisible();
  });

  test("a changed setting is still set after a reload", async ({ page }) => {
    await page.addInitScript(() => {
      try {
        if (localStorage.getItem("breach-command.seeded")) return;
        localStorage.clear();
        localStorage.setItem("breach-command.tutorial-complete", "true");
        localStorage.setItem("breach-command.seeded", "1");
      } catch {}
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Game settings" }).click();
    const toggle = page.getByRole("switch").first();
    await expect(toggle).toBeVisible();
    const before = await toggle.getAttribute("aria-checked");
    await toggle.click();
    const after = await toggle.getAttribute("aria-checked");
    expect(after).not.toEqual(before);

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Game settings" }).click();
    await expect(page.getByRole("switch").first()).toHaveAttribute("aria-checked", after ?? "false");
  });
});
