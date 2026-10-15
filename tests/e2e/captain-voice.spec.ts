import { expect, test, type Page } from "@playwright/test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { getOutcome, newGame, playTurn, resolveResponse } from "../../lib/advanced-game";
import { captainVoiceMessages } from "../../lib/i18n/en/captain-voice";
import { captainDebriefFor } from "../../lib/captain-debrief";
import { openWithSave, pendingDecisionGame, responsePhaseGame, twoStagesGame } from "./fixtures";

declare global {
  interface Window {
    captainSpeechProbe: { lines: string[]; cancellations: number; refuse: boolean; finish: () => void };
  }
}

async function mockSpeech(page: Page, available = true) {
  const lines = Object.fromEntries(Object.entries(captainVoiceMessages).map(([key, text]) => [key.replace("captainVoice.", ""), text]));
  await page.addInitScript(({ available, lines }) => {
    window.captainSpeechProbe = { lines: [], cancellations: 0, refuse: false, finish: () => {} };
    class Audio {
      src: string;
      volume = 1;
      onplaying: (() => void) | null = null;
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(src: string) { this.src = src; }
      play() {
        if (!available || window.captainSpeechProbe.refuse) return Promise.reject(new Error("playback refused"));
        const cue = this.src.split("/").at(-1)!.replace(".mp3", "");
        window.captainSpeechProbe.lines.push(lines[cue]);
        window.captainSpeechProbe.finish = () => this.onended?.();
        this.onplaying?.();
        return Promise.resolve();
      }
      pause() { window.captainSpeechProbe.cancellations++; }
      removeAttribute() {}
      load() {}
    }
    Object.defineProperty(window, "Audio", { configurable: true, value: Audio });
  }, { available, lines });
}

const voicePreferences = { voice: true, music: false, sound: false, haptics: false };
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");

for (const cue of ["opening", "confidenceStrengthened"]) test(`the bundled Captain ${cue} recording decodes and plays in the browser`, async ({ page }) => {
  await openWithSave(page, null, false, voicePreferences);
  await page.evaluate(cue => {
    const audio = new Audio(`/audio/captain/${cue}.mp3`);
    audio.id = "captain-real-audio";
    const button = document.createElement("button");
    button.textContent = "Play Captain test recording";
    button.onclick = () => { void audio.play(); };
    document.body.append(audio, button);
  }, cue);
  await page.getByRole("button", { name: "Play Captain test recording" }).click();
  await expect.poll(() => page.locator("#captain-real-audio").evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeGreaterThan(0);
  const duration = await page.locator("#captain-real-audio").evaluate((audio: HTMLAudioElement) => { audio.pause(); return audio.duration; });
  expect(duration).toBeGreaterThan(8);
  expect(duration).toBeLessThan(15);
});

async function compareFindings(page: Page, assessment: "causal" | "coincidental" = "causal") {
  const reference = page.locator(".reference-fold");
  if (!(await reference.evaluate(element => (element as HTMLDetailsElement).open))) await reference.locator(":scope > summary").click();
  await page.locator(".evidence-detail").evaluate(element => { (element as HTMLDetailsElement).open = true; });
  const findings = page.locator(".evidence-cards button").filter({ has: page.locator('[data-signal="strong"]') });
  await findings.nth(0).click();
  await findings.nth(1).click();
  await page.getByRole("button", { name: assessment === "causal" ? "Causal sequence" : "Coincidental overlap", exact: true }).click();
  await page.getByRole("button", { name: "Test assessment", exact: true }).click();
}

for (const width of [320, 375, 430, 768, 810, 820, 834, 1024, 1080, 1194, 1280]) test(`confidence feedback explains and narrates the actual gain at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 });
  await mockSpeech(page);
  await openWithSave(page, twoStagesGame(), false, voicePreferences);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page.locator(".confidence-change")).toHaveCount(0);
  await compareFindings(page);
  const notice = page.locator(".confidence-change");
  await expect(notice).toContainText("2 findings changed from weak to strong confidence");
  await expect(notice).toContainText("Supporting sources:");
  await expect(notice).toContainText("Signal strength is unchanged");
  await expect(page.locator(".confidence-strengthened")).toHaveCount(2);
  expect(await page.locator(".confidence-strengthened").first().evaluate(element => getComputedStyle(element).animationName)).toBe("none");
  await expect.poll(() => page.evaluate(() => window.captainSpeechProbe.lines)).toContain(captainVoiceMessages["captainVoice.confidenceStrengthened"]);
  await page.evaluate(() => window.captainSpeechProbe.finish());
  await notice.getByRole("button", { name: "Listen", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.captainSpeechProbe.lines.length)).toBe(2);
  await notice.getByRole("button", { name: "Skip voice", exact: true }).click();
  await notice.screenshot({ path: info.outputPath("confidence-feedback.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.addScriptTag({ content: axeSource });
  const violations = await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ["violations"] })).violations);
  expect(violations).toEqual([]);
  const resumed = await page.context().newPage();
  await resumed.goto("/", { waitUntil: "networkidle" });
  await resumed.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(resumed.locator(".evidence-cards [data-confidence=strong]")).toHaveCount(2);
  await expect(resumed.locator(".confidence-change")).toHaveCount(0);
  await resumed.close();
});

test("confidence gain animates when motion is allowed and stays visible with voice off", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await mockSpeech(page);
  await openWithSave(page, twoStagesGame(), false, { ...voicePreferences, voice: false });
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await compareFindings(page);
  await expect(page.locator(".confidence-change")).toContainText("Confidence strengthened");
  expect(await page.locator(".confidence-strengthened").first().evaluate(element => getComputedStyle(element).animationName)).toBe("confidence-strengthened");
  await page.keyboard.press("Tab");
  await page.locator(".confidence-strengthened").first().focus();
  expect(await page.locator(".confidence-strengthened").first().evaluate(element => element.matches(":focus-visible") && getComputedStyle(element).outlineStyle === "solid")).toBe(true);
  await expect(page.locator(".confidence-change .captain-voice")).toHaveCount(0);
  expect(await page.evaluate(() => window.captainSpeechProbe.lines)).toEqual([]);
});

test("an unsupported assessment never announces a confidence gain", async ({ page }) => {
  await mockSpeech(page);
  await openWithSave(page, twoStagesGame(), false, voicePreferences);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await compareFindings(page, "coincidental");
  await expect(page.locator(".correlation-results")).toContainText("Assessment challenged");
  await expect(page.locator(".confidence-change")).toHaveCount(0);
  await expect(page.locator(".confidence-strengthened")).toHaveCount(0);
  expect(await page.evaluate(() => window.captainSpeechProbe.lines)).toEqual([]);
});

test("voice defaults on, explicit opt-out survives reload, and recordings can be replayed", async ({ page }) => {
  await mockSpeech(page);
  await page.addInitScript(() => {
    if (localStorage.getItem("captain-test-seeded")) return;
    localStorage.clear();
    localStorage.setItem("breach-command.tutorial-complete", "true");
    localStorage.setItem("captain-test-seeded", "true");
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Game settings" }).click();
  await expect(page.locator("#voice-setting")).toHaveAttribute("aria-checked", "true");
  await page.locator("#voice-setting").click();
  await page.keyboard.press("Escape");
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Game settings" }).click();
  await expect(page.locator("#voice-setting")).toHaveAttribute("aria-checked", "false");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("breach-command.preferences") ?? "{}").voice)).toBe(false);
  await page.locator("#voice-setting").click();
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

test("routine findings wait during a decision, Listen works, and M mutes voice", async ({ page }) => {
  await mockSpeech(page);
  await openWithSave(page, pendingDecisionGame(), true, voicePreferences);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  const voice = page.getByRole("region", { name: "Incident Captain" });
  await expect(voice).toContainText(captainVoiceMessages["captainVoice.firstFinding"]);
  await page.waitForTimeout(2000);
  expect(await page.evaluate(() => window.captainSpeechProbe.lines)).toEqual([]);
  await voice.getByRole("button", { name: "Listen", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.captainSpeechProbe.lines.at(-1))).toBe(captainVoiceMessages["captainVoice.firstFinding"]);
  await page.keyboard.press("m");
  await expect(voice).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("breach-command.preferences") ?? "{}").voice)).toBe(false);
  await expect.poll(() => page.evaluate(() => window.captainSpeechProbe.cancellations)).toBeGreaterThan(0);
});

test("an urgent pressure warning speaks even while an evidence decision is pending", async ({ page }) => {
  await mockSpeech(page);
  const game = pendingDecisionGame();
  game.impact = 76;
  game.turns.at(-1)!.impactChange = 8;
  await openWithSave(page, game, true, voicePreferences);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page.locator(".report-gate")).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.captainSpeechProbe.lines)).toEqual([captainVoiceMessages["captainVoice.pressure"]]);
  await page.getByRole("button", { name: "Skip voice", exact: true }).click();
  await page.locator(".evidence-decision button").first().click();
  await expect(page.locator(".report-gate")).toHaveCount(0);
});

test("a deferred finding speaks after its decision is resolved", async ({ page }) => {
  await mockSpeech(page);
  await openWithSave(page, pendingDecisionGame(), true, voicePreferences);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.getByRole("button", { name: "Skip voice", exact: true }).waitFor();
  expect(await page.evaluate(() => window.captainSpeechProbe.lines)).toEqual([]);
  await page.locator(".evidence-decision button").first().click();
  await expect.poll(() => page.evaluate(() => window.captainSpeechProbe.lines)).toEqual([captainVoiceMessages["captainVoice.firstFinding"]]);
});

test("unavailable recordings leaves the text and game controls usable", async ({ page }) => {
  await mockSpeech(page, false);
  await openWithSave(page, pendingDecisionGame(), true, voicePreferences);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  const voice = page.getByRole("region", { name: "Incident Captain" });
  await voice.getByRole("button", { name: "Listen", exact: true }).click();
  await expect(voice.getByRole("status")).toContainText("Voice is unavailable");
  expect(await page.evaluate(() => window.captainSpeechProbe.lines)).toEqual([]);
  await expect(voice).toContainText(captainVoiceMessages["captainVoice.firstFinding"]);
  await expect(page.locator(".evidence-decision button").first()).toBeEnabled();
  await page.locator(".evidence-decision button").first().click();
  await expect(page.locator(".report-gate")).toHaveCount(0);
});

test("a browser that refuses audio playback still accepts the evidence decision", async ({ page }) => {
  await mockSpeech(page);
  await openWithSave(page, pendingDecisionGame(), true, voicePreferences);
  await page.evaluate(() => { window.captainSpeechProbe.refuse = true; });
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.getByRole("button", { name: "Listen", exact: true }).click();
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

test("an unavailable optional voice download never blocks the operation", async ({ page }) => {
  await openWithSave(page, null, false, { voice: false, music: false, sound: false, haptics: false });
  await page.getByRole("button", { name: "Game settings" }).click();
  await page.locator("#voice-setting").click();
  await page.keyboard.press("Escape");
  // The game is now loaded; the optional voice player is the next script.
  await page.route("**/_next/static/**/*.js", route => route.abort());
  await page.getByRole("button", { name: /Begin investigation/i }).first().click();
  await expect(page.getByRole("status").filter({ hasText: "Captain voice is unavailable" })).toBeVisible();
  await page.getByRole("button", { name: "Assume command", exact: true }).click();
  await expect(page.locator(".game-screen")).toBeVisible();
});

test("response guidance waits for Listen while closing assessments play once", async ({ page }) => {
  await mockSpeech(page);
  await openWithSave(page, responsePhaseGame(), false, voicePreferences);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.waitForTimeout(2000);
  expect(await page.evaluate(() => window.captainSpeechProbe.lines)).toEqual([]);
  await page.getByRole("button", { name: "Listen", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.captainSpeechProbe.lines.at(-1))).toBe(captainVoiceMessages["captainVoice.response"]);
  await page.locator(".response-options > button").first().click();
  await page.getByRole("button", { name: "Listen", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.captainSpeechProbe.lines.at(-1))).toBe(captainVoiceMessages["captainVoice.assurance"]);
  await page.locator(".response-options > button").first().click();
  await page.getByRole("button", { name: "Listen", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.captainSpeechProbe.lines.at(-1))).toBe(captainVoiceMessages["captainVoice.recovery"]);
  await page.locator(".response-options > button").first().click();
  await expect(page.locator(".resolution")).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.captainSpeechProbe.lines.length)).toBe(4);
  await page.locator(".end-banner button").click();
  await expect.poll(() => page.evaluate(() => window.captainSpeechProbe.lines.length)).toBe(5);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => window.captainSpeechProbe.lines.length)).toBe(5);
});

test("spoken debrief follows the result, plays three segments, and respects skip and replay", async ({ page }) => {
  const initial = responsePhaseGame();
  const finished = ["isolate", "preserve", "rebuild"].reduce((game, choice) => resolveResponse(game, choice), initial);
  const lines = captainDebriefFor(finished, getOutcome(finished).grade).map(cue => captainVoiceMessages[`captainVoice.${cue}` as keyof typeof captainVoiceMessages]);
  await mockSpeech(page);
  await openWithSave(page, initial, false, voicePreferences);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  for (let phase = 0; phase < 3; phase++) await page.locator(".response-options > button").first().click();
  await page.locator(".end-banner button").click();
  const voice = page.getByRole("dialog").getByRole("region", { name: "Incident Captain" });
  await expect(voice).toContainText(lines.join(" "));
  await expect.poll(() => page.evaluate(() => window.captainSpeechProbe.lines.at(-1))).toBe(lines[0]);
  await page.evaluate(() => window.captainSpeechProbe.finish());
  await expect.poll(() => page.evaluate(() => window.captainSpeechProbe.lines.at(-1))).toBe(lines[1]);
  await voice.getByRole("button", { name: "Skip voice" }).click();
  await page.evaluate(() => window.captainSpeechProbe.finish());
  expect(await page.evaluate(() => window.captainSpeechProbe.lines.at(-1))).toBe(lines[1]);
  await voice.getByRole("button", { name: "Listen" }).click();
  await expect.poll(() => page.evaluate(() => window.captainSpeechProbe.lines.at(-1))).toBe(lines[0]);
  await page.evaluate(() => window.captainSpeechProbe.finish());
  await page.evaluate(() => window.captainSpeechProbe.finish());
  await expect.poll(() => page.evaluate(() => window.captainSpeechProbe.lines.at(-1))).toBe(lines[2]);
  await page.evaluate(() => window.captainSpeechProbe.finish());
  await expect(voice.getByRole("button", { name: "Listen" })).toHaveAttribute("aria-disabled", "false");
  const count = await page.evaluate(() => window.captainSpeechProbe.lines.length);
  await page.keyboard.press("Escape");
  await page.locator(".end-banner button").click();
  await page.waitForTimeout(1100);
  expect(await page.evaluate(() => window.captainSpeechProbe.lines.length)).toBe(count);
});

test("all cases receive matching voiced findings and their own opening", async ({ page }) => {
  test.setTimeout(90_000);
  await mockSpeech(page);
  const other = { ...pendingDecisionGame(), scenario: 1 };
  await openWithSave(page, other, true, voicePreferences);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.getByRole("button", { name: "Listen", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.captainSpeechProbe.lines.at(-1))).toBe(captainVoiceMessages["captainVoice.firstFinding"]);
  for (let scenario = 0; scenario < 10; scenario++) {
    await openWithSave(page, null, false, voicePreferences);
    await page.locator(".mission-selector button").nth(scenario).click();
    await page.getByRole("button", { name: /Begin investigation/i }).first().click();
    const key = scenario === 0 ? "captainVoice.opening" : `captainVoice.opening${scenario}` as keyof typeof captainVoiceMessages;
    await expect.poll(() => page.evaluate(() => window.captainSpeechProbe.lines.at(-1))).toBe(captainVoiceMessages[key]);
  }
});

test("an unsuccessful investigation check gets guidance without blocking another action", async ({ page }) => {
  const opening = { ...newGame(0, "training", () => 0), injectDeck: [] };
  const failed = playTurn(opening, "dns", 1);
  expect(failed.turns.at(-1)?.success).toBe(false);
  await mockSpeech(page);
  await openWithSave(page, failed, false, voicePreferences);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  // Reopen the latest report from the investigation record.
  await page.getByRole("button", { name: /^Briefing/ }).first().click();
  await page.locator(".log-entry").first().click();
  await expect.poll(() => page.evaluate(() => window.captainSpeechProbe.lines.at(-1))).toBe(captainVoiceMessages["captainVoice.failedCheck"]);
});

test("voice controls and captions fit phones and tablets", async ({ page }) => {
  test.setTimeout(90_000);
  await mockSpeech(page);
  const finished = ["isolate", "preserve", "rebuild"].reduce((game, choice) => resolveResponse(game, choice), responsePhaseGame());
  // Finished saves are deliberately not resumable, so exercise the closing
  // surface by completing a response fixture in the browser instead.
  expect(finished.status).toBe("won");
  await openWithSave(page, responsePhaseGame(), false, voicePreferences, "/?locale=en-XA");
  await page.locator(".resume-card button").first().click();
  for (const surface of ["response", "debrief"]) {
    if (surface === "debrief") {
      for (let phase = 0; phase < 3; phase++) await page.locator(".response-options > button").first().click();
      await page.locator(".end-banner button").click();
    }
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
    if (width === 375 || width === 1280) await page.screenshot({ path: test.info().outputPath(`voice-${surface}-${width}.png`), fullPage: true });
    }
  }
});
