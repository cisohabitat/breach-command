import { expect, test, type Page } from "@playwright/test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolveResponse } from "../../lib/advanced-game";
import { captainVoiceMessages } from "../../lib/i18n/en/captain-voice";
import { openWithSave, pendingDecisionGame, responsePhaseGame } from "./fixtures";

declare global {
  interface Window {
    captainSpeechProbe: { lines: string[]; cancellations: number; refuse: boolean };
  }
}

async function mockSpeech(page: Page, local = true) {
  await page.addInitScript(localVoice => {
    const events = new EventTarget();
    window.captainSpeechProbe = { lines: [], cancellations: 0, refuse: false };
    class Utterance {
      text: string;
      constructor(text: string) { this.text = text; }
    }
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: Utterance });
    const voice = { name: "Test voice", voiceURI: "test", lang: "en-US", localService: localVoice, default: true };
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
      getVoices: () => [voice],
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events),
      speak: (utterance: SpeechSynthesisUtterance) => {
        if (window.captainSpeechProbe.refuse) throw new Error("speech refused");
        window.captainSpeechProbe.lines.push(utterance.text);
        utterance.onstart?.({} as SpeechSynthesisEvent);
      },
      cancel: () => { window.captainSpeechProbe.cancellations++; },
    } });
  }, local);
}

const voicePreferences = { voice: true, music: false, sound: false, haptics: false };
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");

test("voice defaults off, can be enabled independently, and survives reload", async ({ page }) => {
  await mockSpeech(page);
  await page.addInitScript(() => {
    if (localStorage.getItem("captain-test-seeded")) return;
    localStorage.clear();
    localStorage.setItem("breach-command.tutorial-complete", "true");
    localStorage.setItem("captain-test-seeded", "true");
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Game settings" }).click();
  await expect(page.locator("#voice-setting")).toHaveAttribute("aria-checked", "false");
  await page.locator("#voice-setting").click();
  await page.keyboard.press("Escape");
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Game settings" }).click();
  await expect(page.locator("#voice-setting")).toHaveAttribute("aria-checked", "true");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("breach-command.preferences") ?? "{}").voice)).toBe(true);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /Begin investigation/i }).first().click();
  const voice = page.getByRole("region", { name: "Incident Captain" });
  await expect(voice).toContainText(captainVoiceMessages["captainVoice.opening"]);
  await expect.poll(() => page.evaluate(() => window.captainSpeechProbe.lines)).toEqual([captainVoiceMessages["captainVoice.opening"]]);
  await voice.getByRole("button", { name: "Skip voice" }).focus();
  await page.keyboard.press("Enter");
  await expect(voice.getByRole("button", { name: "Skip voice" })).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.captainSpeechProbe.cancellations)).toBeGreaterThan(0);
  await expect(voice.getByRole("button", { name: "Listen" })).toHaveAttribute("aria-disabled", "false");
  await voice.getByRole("button", { name: "Listen" }).click();
  await expect.poll(() => page.evaluate(() => window.captainSpeechProbe.lines.length)).toBe(2);
  await page.getByRole("button", { name: "Assume command", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.captainSpeechProbe.cancellations)).toBe(2);
});

test("findings have matching text, skip works, and M mutes voice", async ({ page }) => {
  await mockSpeech(page);
  await openWithSave(page, pendingDecisionGame(), true, voicePreferences);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  const voice = page.getByRole("region", { name: "Incident Captain" });
  await expect(voice).toContainText(captainVoiceMessages["captainVoice.firstFinding"]);
  await expect.poll(() => page.evaluate(() => window.captainSpeechProbe.lines.at(-1))).toBe(captainVoiceMessages["captainVoice.firstFinding"]);
  await page.keyboard.press("m");
  await expect(voice).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("breach-command.preferences") ?? "{}").voice)).toBe(false);
  await expect.poll(() => page.evaluate(() => window.captainSpeechProbe.cancellations)).toBeGreaterThan(0);
});

test("unavailable or refused speech leaves the text and game controls usable", async ({ page }) => {
  await mockSpeech(page, false);
  await openWithSave(page, pendingDecisionGame(), true, voicePreferences);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  const voice = page.getByRole("region", { name: "Incident Captain" });
  await expect(voice.getByRole("status")).toContainText("Voice is unavailable");
  expect(await page.evaluate(() => window.captainSpeechProbe.lines)).toEqual([]);
  await expect(voice).toContainText(captainVoiceMessages["captainVoice.firstFinding"]);
  await expect(page.locator(".evidence-decision button").first()).toBeEnabled();
  await page.locator(".evidence-decision button").first().click();
  await expect(page.locator(".report-gate")).toHaveCount(0);
});

test("a platform that refuses speech still accepts the evidence decision", async ({ page }) => {
  await mockSpeech(page);
  await openWithSave(page, pendingDecisionGame(), true, voicePreferences);
  await page.evaluate(() => { window.captainSpeechProbe.refuse = true; });
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page.locator(".captain-voice-status")).toContainText("Voice is unavailable");
  await page.locator(".evidence-decision button").first().click();
  await expect(page.locator(".report-gate")).toHaveCount(0);
});

test("Bot Commander practice does not speak", async ({ page }) => {
  await mockSpeech(page);
  await openWithSave(page, null, false, voicePreferences);
  await page.locator(".advanced-setup > summary").click();
  await page.locator("#bot-start").click();
  await page.getByRole("button", { name: /Begin investigation/i }).first().click();
  await expect(page.getByRole("button", { name: "Assume command", exact: true })).toBeVisible();
  await expect(page.locator(".captain-voice")).toHaveCount(0);
  expect(await page.evaluate(() => window.captainSpeechProbe.lines)).toEqual([]);
});

test("response and closing assessments play once and do not overlap", async ({ page }) => {
  await mockSpeech(page);
  await openWithSave(page, responsePhaseGame(), false, voicePreferences);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.captainSpeechProbe.lines.at(-1))).toBe(captainVoiceMessages["captainVoice.response"]);
  for (let phase = 0; phase < 3; phase++) await page.locator(".response-options > button").first().click();
  await expect(page.locator(".resolution")).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.captainSpeechProbe.lines.length)).toBe(2);
  await page.locator(".end-banner button").click();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => window.captainSpeechProbe.lines.length)).toBe(2);
});

test("other cases retain their existing presentation", async ({ page }) => {
  await mockSpeech(page);
  const other = { ...pendingDecisionGame(), scenario: 1 };
  await openWithSave(page, other, true, voicePreferences);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page.getByRole("region", { name: "Incident Captain" })).toHaveCount(0);
});

test("voice controls and captions fit phones and tablets", async ({ page }) => {
  await mockSpeech(page);
  const finished = ["isolate", "preserve", "rebuild"].reduce((game, choice) => resolveResponse(game, choice), responsePhaseGame());
  // Finished saves are deliberately not resumable, so exercise the closing
  // surface by completing a response fixture in the browser instead.
  expect(finished.status).toBe("won");
  await openWithSave(page, responsePhaseGame(), false, voicePreferences, "/?locale=en-XA");
  await page.locator(".resume-card button").first().click();
  for (const width of [320, 375, 430, 768, 810, 820, 834, 1024, 1080, 1194, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const voice = page.locator(".captain-voice");
    await expect(voice).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    for (const button of await voice.getByRole("button").all()) {
      const box = await button.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(24);
      expect(box!.height).toBeGreaterThanOrEqual(24);
    }
    await page.addScriptTag({ content: axeSource });
    const violations = await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ["violations"] })).violations);
    expect(violations, `voice surface at ${width}px`).toEqual([]);
    if (width === 375 || width === 1280) await page.screenshot({ path: test.info().outputPath(`voice-${width}.png`), fullPage: true });
  }
});
