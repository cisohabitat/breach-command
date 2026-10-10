import { expect, test } from "@playwright/test";
import { newGame, recommendNext, getLossReason } from "../../lib/advanced-game";
import { LAST_OPERATION_KEY } from "../../lib/last-operation";

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

test("the last operation reads in the player's language", async ({ page }) => {
  const panel = await open(page, record, "/?locale=en-XA");
  await expect(panel).toContainText("[thé îñvéštîgátîöñ wîñdöw çlöšéd");
  await expect(panel, "the date in the locale too").toContainText("öñ 1 Öçtöbér");
  await expect(panel).toContainText("[Thé wîñdöw çlöšéd");
  await expect(panel, "no key shows in place of its words").not.toContainText(/record\.|engine\./);
});

test("an older record of sentences reads as it was", async ({ page }) => {
  const older = { ...record, ending: "The investigation window closed", next: { ...next, title: "Case 5, A terminal under watch, at Operational", reason: "The window closed with 0 of 4 stages confirmed." } };
  const panel = await open(page, older, "/");
  await expect(panel).toContainText("the investigation window closed");
  await expect(panel).toContainText("Case 5, A terminal under watch, at Operational");
  await expect(panel).toContainText("The window closed with 0 of 4 stages confirmed.");
});
