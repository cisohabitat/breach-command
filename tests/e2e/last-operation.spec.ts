import { expect, test } from "@playwright/test";
import { newGame, recommendNext, getLossReason } from "../../lib/advanced-game";
import { LAST_OPERATION_KEY } from "../../lib/last-operation";
import { SESSION_KEY, serialiseSession } from "../../lib/session";

// The assignment screen meets a returning player with the last operation and
// what the review suggested, before the game's own script has loaded. A record
// holds messages, so it reads in the player's language; one written before it
// did holds English sentences, which read as they were.
const lost = { ...newGame(4, "crisis", () => 0), status: "lost" as const };
const next = recommendNext(lost, 7);
const record = { scenario: 4, difficulty: "crisis", outcome: "lost", ending: getLossReason(lost).title, score: 41, endedAt: Date.UTC(2026, 9, 1, 12), next };

async function open(page: import("@playwright/test").Page, stored: unknown, path: string) {
  await page.addInitScript(([key, value]) => {
    try { localStorage.clear(); localStorage.setItem("breach-command.tutorial-complete", "true"); localStorage.setItem(key, value); } catch {}
  }, [LAST_OPERATION_KEY, JSON.stringify(stored)] as const);
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  return page.locator(".last-operation").first();
}

for (const width of [375, 1280]) {
  test(`a first campaign loss offers Training in the review and returning desk at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const game = { ...newGame(0, "crisis", () => 0), chain: ["phish", "spray", "task", "https"], impact: 99, injectDeck: [] };
    // Seed once; a real reload must retain what the operation wrote.
    await page.addInitScript(([key, save]) => {
      if (sessionStorage.getItem("first-loss-fixture")) return;
      sessionStorage.setItem("first-loss-fixture", "true");
      localStorage.clear();
      localStorage.setItem("breach-command.tutorial-complete", "true");
      localStorage.setItem("breach-command.preferences", JSON.stringify({ voice: false, sound: false }));
      localStorage.setItem(key, save);
    }, [SESSION_KEY, serialiseSession(game, true, false)] as const);
    await page.goto("/play", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /^Resume “.+”$/ }).click();
    await page.getByRole("button", { name: /^Cloud control-plane abuse/ }).click();
    await page.locator('[data-procedure="cloud"]').click();
    await page.getByRole("button", { name: "Run procedure", exact: true }).click();
    const report = page.locator(".report-dialog");
    await expect(report).toContainText("The operation is lost.");
    await expect(report.locator(".turn-movement")).toContainText(/Business impact\s*\+1/);
    await page.getByRole("button", { name: "Open debrief", exact: true }).click();
    await expect(page.locator(".debrief-dialog")).toContainText("Case 1, The quiet intrusion, at Training");
    await expect(page.locator(".debrief-dialog")).toContainText("You can still choose another difficulty");
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator(".last-operation").first()).toContainText("Try this case at Training");
    await page.getByRole("button", { name: "Set up the suggestion", exact: true }).first().click();
    await expect(page.getByRole("button", { name: /^Training/ })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: /^Crisis/ })).toHaveAttribute("aria-pressed", "false");
  });
}

test("the last operation reads in the player's language", async ({ page }) => {
  const panel = await open(page, record, "/play?locale=en-XA");
  await expect(panel).toContainText("[thé îñvéštîgátîöñ wîñdöw çlöšéd");
  await expect(panel, "the date in the locale too").toContainText("öñ 1 Öçtöbér");
  await expect(panel).toContainText("[Thé wîñdöw çlöšéd");
  await expect(panel, "no key shows in place of its words").not.toContainText(/record\.|engine\./);
});

test("an older record of sentences reads as it was", async ({ page }) => {
  const older = { ...record, ending: "The investigation window closed", next: { ...next, title: "Case 5, A terminal under watch, at Operational", reason: "The window closed with 0 of 4 stages confirmed." } };
  const panel = await open(page, older, "/play");
  await expect(panel).toContainText("the investigation window closed");
  await expect(panel).toContainText("Case 5, A terminal under watch, at Operational");
  await expect(panel).toContainText("The window closed with 0 of 4 stages confirmed.");
});
