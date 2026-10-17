import { expect, test, type Page } from "@playwright/test";
import { newGame, setHypothesis, type Game } from "../../lib/advanced-game";
import { serialiseSession, SESSION_KEY } from "../../lib/session";
import { twoStagesGame } from "./fixtures";

declare global {
  interface Window {
    diceProbe: { starts: number[]; ended: number; cancelled: number; oscillators: number; running: boolean; energy: number; rollSeen: boolean; audio?: { state: string; time: number } };
  }
}

async function prepare(page: Page, sound = true, fast = false, game: Game | null = setHypothesis(newGame(0, "training", () => 0), "identity")) {
  await page.addInitScript(() => {
    window.diceProbe = { starts: [], ended: 0, cancelled: 0, oscillators: 0, running: false, energy: 0, rollSeen: false };
    // Observe native Web Audio; do not replace its synthesis or playback.
    const prototype = AudioContext.prototype;
    const bufferSource = prototype.createBufferSource;
    prototype.createBufferSource = function () {
      Object.defineProperty(window.diceProbe, "audio", { configurable: true, enumerable: true, get: () => ({ state: this.state, time: this.currentTime }) });
      const source = bufferSource.call(this);
      const start = source.start.bind(source);
      const stop = source.stop.bind(source);
      source.addEventListener("ended", () => { window.diceProbe.ended++; window.diceProbe.running ||= this.state === "running"; });
      source.start = (...args: Parameters<AudioBufferSourceNode["start"]>) => {
        window.diceProbe.starts.push(args[0] ?? 0);
        window.diceProbe.running ||= this.state === "running";
        window.diceProbe.energy = Math.max(window.diceProbe.energy, ...source.buffer!.getChannelData(0).map(Math.abs));
        start(...args);
      };
      source.stop = (...args: Parameters<AudioBufferSourceNode["stop"]>) => { if (!args.length) window.diceProbe.cancelled++; stop(...args); };
      return source;
    };
    const oscillator = prototype.createOscillator;
    prototype.createOscillator = function () { window.diceProbe.oscillators++; return oscillator.call(this); };
  });
  await page.addInitScript(([key, save, enabled]) => {
    localStorage.clear();
    if (save) localStorage.setItem(key, save);
    localStorage.setItem("breach-command.tutorial-complete", "true");
    localStorage.setItem("breach-command.preferences", JSON.stringify({ sound: enabled, music: false, voice: false, haptics: false }));
  }, [SESSION_KEY, game ? serialiseSession(game, true, fast) : "", sound] as const);
  await page.goto("/play", { waitUntil: "networkidle" });
  if (game) {
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    if (!fast) await page.locator(".procedure-card:not(:disabled)").first().click();
  }
}

async function holdRoll(page: Page) {
  // Hold the game's 850 ms result timer so a busy runner cannot miss the roll
  // or press mute after it ended. Native AudioContext time still runs normally.
  const time = new Date("2030-01-01T00:00:00Z");
  await page.clock.install({ time });
  await page.clock.pauseAt(new Date(time.getTime() + 1000));
}

test("a visible roll plays real buffered impacts before its result", async ({ page }) => {
  await prepare(page);
  // Observe the short-lived dialog in the page, where a busy runner cannot
  // miss it between protocol calls. Keep both game and audio clocks real here.
  await page.evaluate(() => new MutationObserver(() => {
    if (document.querySelector(".roll-dialog")) window.diceProbe.rollSeen = true;
  }).observe(document.documentElement, { childList: true, subtree: true }));
  await page.getByRole("button", { name: "Run procedure", exact: true }).click();
  await expect(page.locator(".report-dialog")).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.diceProbe.ended)).toBeGreaterThan(0);
  const probe = await page.evaluate(() => window.diceProbe);
  expect(probe.rollSeen).toBe(true);
  expect(probe.starts.length).toBeGreaterThanOrEqual(2);
  expect(probe.starts.length).toBeLessThanOrEqual(9);
  expect(probe.starts.at(-1)! - probe.starts[0]).toBeLessThan(0.85);
  expect(probe.running).toBe(true);
  expect(probe.energy).toBeGreaterThan(0.5);
});

test("Sound off keeps the roll and result silent", async ({ page }) => {
  await prepare(page, false);
  await page.getByRole("button", { name: "Run procedure", exact: true }).click();
  await expect(page.locator(".report-dialog")).toBeVisible();
  expect(await page.evaluate(() => window.diceProbe.starts.length)).toBe(0);
  expect(await page.evaluate(() => window.diceProbe.oscillators)).toBe(0);
});

test("muting during the roll cancels its impacts and silences the result", async ({ page }) => {
  await prepare(page);
  await holdRoll(page);
  await page.getByRole("button", { name: "Run procedure", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.diceProbe.starts.length)).toBeGreaterThan(0);
  await page.keyboard.press("m");
  await expect.poll(() => page.evaluate(() => window.diceProbe.cancelled)).toBeGreaterThan(0);
  await page.clock.runFor(900);
  await expect(page.locator(".report-dialog")).toBeVisible();
  expect(await page.evaluate(() => window.diceProbe.oscillators)).toBe(0);
});

test("leaving the tab cancels the remaining roll impacts", async ({ page }) => {
  await prepare(page);
  await holdRoll(page);
  await page.getByRole("button", { name: "Run procedure", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.diceProbe.starts.length)).toBeGreaterThan(0);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => page.evaluate(() => window.diceProbe.cancelled)).toBeGreaterThan(0);
});

test("a fast-resolution turn has no dice rattle", async ({ page }) => {
  const game = twoStagesGame();
  await prepare(page, true, true, game);
  await page.locator(".procedure-card:not(:disabled)").first().click();
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)!).game.turns.length, SESSION_KEY)).toBe(game.turns.length + 1);
  await expect(page.locator(".roll-dialog")).toHaveCount(0);
  expect(await page.evaluate(() => window.diceProbe.starts.length)).toBe(0);
});

test("Bot Commander practice adds no dice rattle", async ({ page }) => {
  await prepare(page, true, false, null);
  await page.locator(".advanced-setup > summary").click();
  await page.locator("#bot-start").click();
  await page.getByRole("button", { name: /Begin investigation/i }).first().click();
  await page.getByRole("button", { name: "Assume command", exact: true }).click();
  await expect(page.locator(".bot-control")).toBeVisible();
  await expect.poll(() => page.locator(".workspace-tabs").textContent()).toMatch(/Briefing\s*[1-9]/);
  expect(await page.evaluate(() => window.diceProbe.starts.length)).toBe(0);
});
