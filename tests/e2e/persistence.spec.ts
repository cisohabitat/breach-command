import { expect, test } from "@playwright/test";
import { newGame, type Game } from "../../lib/advanced-game";
import { PARKED_SESSION_KEY, SESSION_KEY, SESSION_VERSION, serialiseSession } from "../../lib/session";

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
      sound: false, music: false, haptics: false, highContrast: true, shortcuts: true,
    });
    // High contrast is applied, not merely remembered — on the document root as
    // well, where the dialogs and sheets rendered outside the shell inherit it.
    await expect(page.locator(".app-shell.high-contrast")).toBeVisible();
    await expect(page.locator("html")).toHaveClass(/high-contrast/);
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
    await page.goto("/", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Game settings" }).click();
    const toggle = page.getByRole("switch").first();
    await expect(toggle).toBeVisible();
    const before = await toggle.getAttribute("aria-checked");
    await toggle.click();
    const after = await toggle.getAttribute("aria-checked");
    expect(after).not.toEqual(before);

    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Game settings" }).click();
    await expect(page.getByRole("switch").first()).toHaveAttribute("aria-checked", after ?? "false");
  });

  test("a finished operation is not offered for resume", async ({ page }) => {
    const finished = { ...newGame(0, "operational", () => 0), status: "lost", turns: [] } as Game;
    await page.addInitScript(([key, value]) => {
      try {
        if (localStorage.getItem("breach-command.seeded")) return;
        localStorage.clear();
        localStorage.setItem("breach-command.tutorial-complete", "true");
        localStorage.setItem(key, value);
        localStorage.setItem("breach-command.seeded", "1");
      } catch {}
    }, [SESSION_KEY, serialiseSession(finished, true, false)] as const);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".briefing-screen")).toBeVisible();
    await page.waitForTimeout(500);
    await expect(page.getByRole("button", { name: "Resume", exact: true })).toHaveCount(0);
    expect(await page.evaluate(key => localStorage.getItem(key), SESSION_KEY), "an ended operation's save is cleared").toBeNull();
  });

  test("a save from a newer build is left in place", async ({ page }) => {
    const newer = JSON.stringify({ version: SESSION_VERSION + 1, savedAt: new Date().toISOString(), game: newGame(0, "operational", () => 0), guided: true, fastResolve: false });
    await page.addInitScript(([key, value]) => {
      try {
        if (localStorage.getItem("breach-command.seeded")) return;
        localStorage.clear();
        localStorage.setItem("breach-command.tutorial-complete", "true");
        localStorage.setItem(key, value);
        localStorage.setItem("breach-command.seeded", "1");
      } catch {}
    }, [SESSION_KEY, newer] as const);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/written by a newer version/)).toBeVisible();
    expect(await page.evaluate(key => localStorage.getItem(key), SESSION_KEY), "a newer build's save is not deleted").toEqual(newer);
  });

  test("a newer build's save is parked, not overwritten, when an operation begins", async ({ page }) => {
    const newer = JSON.stringify({ version: SESSION_VERSION + 1, savedAt: new Date().toISOString(), game: newGame(0, "operational", () => 0), guided: true, fastResolve: false });
    await page.addInitScript(([key, value]) => {
      try {
        if (localStorage.getItem("breach-command.seeded")) return;
        localStorage.clear();
        localStorage.setItem("breach-command.tutorial-complete", "true");
        localStorage.setItem(key, value);
        localStorage.setItem("breach-command.seeded", "1");
      } catch {}
    }, [SESSION_KEY, newer] as const);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/written by a newer version/)).toBeVisible();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /Begin investigation/ }).click();
    await page.getByRole("button", { name: /Assume command/ }).click();
    await page.waitForTimeout(300);
    const [parked, current] = await page.evaluate(([parkedKey, sessionKey]) => [localStorage.getItem(parkedKey), localStorage.getItem(sessionKey)], [PARKED_SESSION_KEY, SESSION_KEY] as const);
    expect(parked, "the newer save is kept aside").toEqual(newer);
    expect(current, "and the new operation has the save slot").not.toEqual(newer);
  });

  test("a parked save this build can read is offered again", async ({ page }) => {
    const inProgress = serialiseSession(newGame(0, "operational", () => 0), true, false);
    await page.addInitScript(([key, value]) => {
      try {
        if (localStorage.getItem("breach-command.seeded")) return;
        localStorage.clear();
        localStorage.setItem("breach-command.tutorial-complete", "true");
        localStorage.setItem(key, value);
        localStorage.setItem("breach-command.seeded", "1");
      } catch {}
    }, [PARKED_SESSION_KEY, inProgress] as const);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Resume", exact: true })).toBeVisible();
    expect(await page.evaluate(key => localStorage.getItem(key), PARKED_SESSION_KEY), "it leaves the parking slot").toBeNull();
  });
  test("the first operation's record survives a reload and travels in the backup", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});
    await page.addInitScript(() => {
      try {
        if (localStorage.getItem("breach-command.seeded")) return;
        localStorage.clear();
        localStorage.setItem("breach-command.tutorial-complete", "true");
        localStorage.setItem("breach-command.balance", JSON.stringify({ operationsStarted: 1, turns: 3, revisions: 1, firstSession: { startedAt: 1000, firstProcedureAt: 81000, firstRevisionAt: 141000, endedAt: null, outcome: null } }));
        localStorage.setItem("breach-command.seeded", "1");
      } catch {}
    });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Game settings" }).click();
    const record = page.getByRole("list", { name: "First operation on this device" });
    await expect(record).toContainText("First procedure ran 1 min 20 s after the first operation began.");
    await expect(record).toContainText("The first operation has not ended.");
    await page.getByRole("button", { name: "Export" }).click();
    const backup = JSON.parse(await page.getByRole("textbox", { name: "Progress backup" }).inputValue());
    expect(backup.telemetry.firstSession.firstProcedureAt).toBe(81000);
  });
});

test.describe("replayability records", () => {
  test("the ladder, the personal record and the weekly code survive a reload and travel in the backup", async ({ page }) => {
    const entry = { at: 1_790_000_000_000, scenario: 0, difficulty: "operational", mode: "campaign", outcome: "won", score: 74, hypothesis: 6, stages: 4, turns: 8, code: null };
    await page.addInitScript(([recorded]) => {
      try {
        if (localStorage.getItem("breach-command.seeded")) return;
        localStorage.clear();
        localStorage.setItem("breach-command.tutorial-complete", "true");
        localStorage.setItem("breach-command.campaign", JSON.stringify({ completed: [0], xp: 90, ladder: { "0": ["crisis", "expert"] } }));
        localStorage.setItem("breach-command.ledger", JSON.stringify([recorded, { ...recorded, at: recorded.at + 1, hypothesis: 8 }]));
        localStorage.setItem("breach-command.seeded", "1");
      } catch {}
    }, [entry] as const);
    await page.goto("/", { waitUntil: "networkidle" });
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: /^The quiet intrusion/ }).click();
    await expect(page.locator(".slip-ladder")).toContainText("Mastery ladder, 2 of 5: won at Crisis, won in Expert.");
    const record = page.getByRole("region", { name: "Your record" });
    await expect(record).toContainText("2 operations recorded");
    await expect(record).toContainText("over the last 2: 7 of 10");

    await page.getByText("Advanced operation settings").click();
    await page.getByRole("button", { name: /^Weekly operation/ }).click();
    const code = await page.locator(".challenge-console code").innerText();
    expect(code).toMatch(/^BC\d+-\d+-1-5-/);
    await page.reload({ waitUntil: "networkidle" });
    await page.getByText("Advanced operation settings").click();
    await page.getByRole("button", { name: /^Weekly operation/ }).click();
    await expect(page.locator(".challenge-console code")).toHaveText(code);

    await page.getByRole("button", { name: "Game settings" }).click();
    await page.getByRole("button", { name: "Export" }).click();
    const text = await page.getByRole("textbox", { name: "Progress backup" }).inputValue();
    const backup = JSON.parse(text);
    expect(backup.ledger).toHaveLength(2);
    expect(backup.campaign.ladder["0"]).toEqual(["crisis", "expert"]);

    await page.evaluate(() => { localStorage.removeItem("breach-command.ledger"); localStorage.setItem("breach-command.campaign", JSON.stringify({ completed: [] })); });
    await page.getByRole("textbox", { name: "Progress backup" }).fill(text);
    await page.getByRole("button", { name: "Restore backup" }).click();
    await page.getByRole("button", { name: "Replace this device’s progress" }).click();
    expect(JSON.parse(await page.evaluate(() => localStorage.getItem("breach-command.ledger") ?? "[]"))).toHaveLength(2);
    expect(JSON.parse(await page.evaluate(() => localStorage.getItem("breach-command.campaign") ?? "{}")).ladder["0"]).toEqual(["crisis", "expert"]);
  });
});
