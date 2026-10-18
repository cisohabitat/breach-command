import { expect, test, type Page } from "@playwright/test";
import { newGame, setHypothesis, type Game } from "../../lib/advanced-game";
import { serialiseSession, SESSION_KEY } from "../../lib/session";
import { twoStagesGame } from "./fixtures";

declare global {
  interface Window {
    diceProbe: { starts: number[]; ended: number; cancelled: number; oscillators: number; running: boolean; energy: number; rollSeen: boolean; tumbles: number; audio?: { state: string; time: number } };
  }
}

async function prepare(page: Page, sound = true, fast = false, game: Game | null = setHypothesis(newGame(0, "training", () => 0), "identity")) {
  await page.addInitScript(() => {
    window.diceProbe = { starts: [], ended: 0, cancelled: 0, oscillators: 0, running: false, energy: 0, rollSeen: false, tumbles: 0 };
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (frames, options) {
      if (this.classList.contains("die-shell")) window.diceProbe.tumbles++;
      return animate.call(this, frames, options);
    };
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
  // Hold the game's roll/reveal timers so a busy runner cannot miss the roll
  // or press mute after it ended. Native AudioContext time still runs normally.
  const time = new Date("2030-01-01T00:00:00Z");
  await page.clock.install({ time });
  await page.clock.pauseAt(new Date(time.getTime() + 1000));
}

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test(`the throw lasts 1400 ms and the result stays for 900 ms (${reducedMotion})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await prepare(page, false);
    await holdRoll(page);
    await page.getByRole("button", { name: "Run procedure", exact: true }).click();
    await page.clock.runFor(100);
    const shell = page.locator(".die-shell");
    await expect(shell).toHaveAttribute("aria-hidden", "true");
    expect(await page.evaluate(() => window.diceProbe.tumbles)).toBe(reducedMotion === "reduce" ? 0 : 1);
    if (reducedMotion === "reduce") await expect(page.locator(".die strong")).toHaveText("—");
    await page.clock.runFor(1299);
    await expect(page.locator(".roll-dialog .die")).toHaveClass(/rolling/);
    await expect(page.locator(".report-dialog")).toHaveCount(0);
    await page.clock.runFor(1);
    const die = page.locator(".roll-dialog .die");
    await expect(die).toBeVisible();
    await expect(die).not.toHaveClass(/rolling/);
    expect(await shell.evaluate(element => element.getAnimations().length)).toBe(0);
    const number = await die.locator("strong").textContent();
    await expect(page.locator(".report-dialog")).toHaveCount(0);
    await page.clock.runFor(899);
    await expect(die.locator("strong")).toHaveText(number!);
    await expect(page.locator(".report-dialog")).toHaveCount(0);
    await page.clock.runFor(1);
    await expect(page.locator(".report-dialog")).toBeVisible();
    await expect(page.locator(".report-dialog")).toBeFocused();
    await expect(page.locator(".report-dialog")).not.toHaveClass(/zoom-in/);
    // Let the closed Radix dialog finish its exit animation on the held clock.
    await page.clock.runFor(300);
    await expect(page.locator(".roll-dialog")).toHaveCount(0);
    const turns = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).game.turns, SESSION_KEY);
    expect(turns).toHaveLength(1);
    expect(String(turns[0].raw)).toBe(number);
  });
}

test("the used procedure gets a brief receipt after the report closes", async ({ page }) => {
  await prepare(page, false);
  await page.evaluate(() => {
    crypto.getRandomValues = <T extends ArrayBufferView | null>(array: T): T => {
      if (array instanceof Uint32Array) array.fill(0);
      return array;
    };
  });
  await holdRoll(page);
  await page.getByRole("button", { name: "Run procedure", exact: true }).click();
  await page.clock.runFor(2300);
  const report = page.locator(".report-dialog");
  await expect(report).toBeVisible();
  await page.keyboard.press("Escape");
  await page.clock.runFor(300);
  await expect(report).toHaveCount(0);
  const used = page.locator(".procedure-card[data-last-used=true]");
  await expect(used).toHaveCount(1);
  await expect.poll(() => used.evaluate(element => (element as HTMLElement).style.boxShadow)).toContain("inset");
  await page.clock.runFor(2000);
  await expect.poll(() => used.evaluate(element => (element as HTMLElement).style.boxShadow)).toBe("");
});

test("enabling reduced motion during a roll cancels its tumble and number cycling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await prepare(page, false);
  await holdRoll(page);
  await page.getByRole("button", { name: "Run procedure", exact: true }).click();
  await page.clock.runFor(100);
  expect(await page.evaluate(() => window.diceProbe.tumbles)).toBe(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => page.locator(".die-shell").evaluate(element => element.getAnimations().length)).toBe(0);
  await page.clock.runFor(80);
  await expect(page.locator(".die strong")).toHaveText("—");
  await page.clock.runFor(2120);
  await expect(page.locator(".report-dialog")).toBeVisible();
});

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
  expect(probe.starts.at(-1)! - probe.starts[0]).toBeLessThan(1.4);
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
  await page.clock.runFor(2300);
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
