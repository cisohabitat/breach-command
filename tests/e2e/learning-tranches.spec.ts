import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { attackVector, attacks, getBeginnerReview, newGame, playTurn, procedures, resolveDecision, resolveResponse, responseOptionsFor, setHypothesis } from "../../lib/advanced-game";
import { serialiseSession } from "../../lib/session";
import { practiceCases } from "../../lib/practice";
import { lessonIds, recommendPractice } from "../../lib/learning";
import { openWithSave, responsePhaseGame } from "./fixtures";
const axe = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");

for (const lesson of lessonIds) test(`practice ${lesson} completes, records first choices and leaves the operation alone`, async ({ page }) => {
  const save = serialiseSession(newGame(0, "training", () => 0), true, false);
  await page.addInitScript(save => { if (!localStorage.getItem("breach-command.session")) localStorage.setItem("breach-command.session", save); }, save);
  await page.goto(`/practice?lesson=${lesson}`, { waitUntil: "networkidle" });
  const choices = practiceCases[lesson];
  for (let index = 0; index < 3; index++) {
    await expect(page.getByText(`Decision ${index + 1} of 3`, { exact: true })).toBeVisible();
    await page.getByRole("radio").nth(choices[index].correct).check();
    await page.getByRole("button", { name: "Check judgment", exact: true }).click();
    await expect(page.locator(".practice-feedback").getByText("Supported by the facts shown.", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    await page.getByRole("button", { name: index === 2 ? "Finish exercise" : "Next decision", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "Exercise complete", exact: true })).toBeVisible();
  const stored = await page.evaluate(() => ({ session: localStorage.getItem("breach-command.session"), record: JSON.parse(localStorage.getItem("breach-command.learning")!) }));
  expect(stored.session).toBe(save);
  expect(stored.record.attempts).toHaveLength(1);
  expect(stored.record.attempts[0].answers).toEqual(choices.map(q => q.correct));
  await page.getByText("Practice history and confidence reflections", { exact: true }).click();
  await page.getByText("Review the latest five exercises", { exact: true }).click();
  await expect(page.getByText(/Your first choice:/).first()).toBeVisible();
  await page.addScriptTag({ content: axe });
  expect(await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ["violations"] })).violations)).toEqual([]);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("Practice history and confidence reflections", { exact: true }).click();
  await expect(page.getByText("Exercises completed: 1; supported first choices: 3 of 3.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Clear learning record", exact: true }).click();
  await page.getByRole("button", { name: "Keep history", exact: true }).click();
  await expect(page.getByRole("button", { name: "Clear learning record", exact: true })).toBeFocused();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("breach-command.learning")!).attempts.length)).toBe(1);
  await page.getByRole("button", { name: "Clear learning record", exact: true }).click();
  await page.getByRole("button", { name: "Clear learning history", exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem("breach-command.session"))).toBe(save);
  await expect(page.getByText("Learning history cleared.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Clear learning record", exact: true })).toBeFocused();
});

test("keyboard-only practice keeps focus through choices, feedback and completion", async ({ page }) => {
  await page.goto("/practice?lesson=signal", { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Return to the incident desk", exact: true })).toBeFocused();
  for (const [index, question] of practiceCases.signal.entries()) {
    await page.keyboard.press("Tab");
    await expect(page.getByRole("radio").first()).toBeFocused();
    await page.keyboard.press("Space");
    for (let step = 0; step < question.correct; step++) await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Check judgment", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: index === 2 ? "Finish exercise" : "Next decision", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  }
  await expect(page.getByRole("heading", { name: "Exercise complete", exact: true })).toBeVisible();
});

test("response confidence is optional, snapshots public evidence and survives Resume without changing outcomes", async ({ page }) => {
  const initial = responsePhaseGame();
  await page.addInitScript(save => {
    if (!localStorage.getItem("breach-command.session")) localStorage.setItem("breach-command.session", save);
    localStorage.setItem("breach-command.tutorial-complete", "true");
    localStorage.setItem("breach-command.preferences", JSON.stringify({ sound: false, voice: false, music: false, reflection: true }));
  }, serialiseSession(initial, false, false));
  await page.goto("/play", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  const key = await page.evaluate(() => JSON.parse(localStorage.getItem("breach-command.session")!).learningId);
  expect(key).toBeTruthy();
  const panel = page.locator(".response-panel");
  await panel.getByText("Optional confidence reflection", { exact: true }).first().click();
  await panel.getByRole("radio", { name: "High", exact: true }).check();
  await page.addScriptTag({ content: axe });
  expect(await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ["violations"] })).violations)).toEqual([]);
  const choice = responseOptionsFor(initial).containment[0].id;
  const expected = resolveResponse(initial, choice);
  await panel.locator(".response-options > button").first().click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("breach-command.learning") ?? "{}").reflections?.length)).toBe(1);
  const row = await page.evaluate(() => JSON.parse(localStorage.getItem("breach-command.learning")!).reflections[0]);
  expect(row).toMatchObject({ operation: key, phase: 0, confidence: "high", confirmed: initial.revealed.length, findings: initial.evidence.length, impact: initial.impact, continuity: initial.continuity });
  expect(Object.keys(row).sort()).toEqual(["operation", "phase", "confidence", "choice", "confirmed", "findings", "strong", "impact", "continuity"].sort());
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("breach-command.session")!));
  expect(saved.game).toEqual(expected);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("breach-command.session")!).learningId)).toBe(key);
  await panel.locator(".response-options > button").first().click();
  if (await panel.isVisible()) {
    await panel.getByText("Optional confidence reflection", { exact: true }).first().click();
    await panel.getByRole("radio", { name: "Low", exact: true }).check();
    await panel.locator(".response-options > button").first().click();
  }
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("breach-command.learning")!).operations.length)).toBe(1);
  await page.getByRole("button", { name: /Open after-action review|Review the record|Review the drill/ }).click();
  await page.getByText("Your confidence at the decision", { exact: true }).click();
  await expect(page.getByText("Response decision 1: High", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Practise this lesson", exact: true })).toBeVisible();
  let finished = expected;
  for (const phase of ["assurance", "recovery"] as const) if (finished.status === "response") finished = resolveResponse(finished, responseOptionsFor(finished)[phase][0].id);
  await expect(page.getByRole("link", { name: "Practise this lesson", exact: true })).toHaveAttribute("href", new RegExp(`lesson=${recommendPractice(finished, getBeginnerReview(finished).next)}&`));
});

for (const scenario of [1, 8]) test(`recorded decisions carry into later Command and Briefing in sector ${scenario}`, async ({ page }) => {
  let game = { ...newGame(scenario, "training", () => 0), injectDeck: [] as number[] };
  const stage = attacks.find(a => a.id === game.chain[0])!;
  game = setHypothesis(game, attackVector(stage.id));
  game = playTurn(game, stage.detect.find(id => procedures.some(p => p.id === id))!, 20);
  game = resolveDecision(game, "contain");
  await openWithSave(page, game, false, { voice: false, music: false, sound: false });
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  for (const tab of ["Command", "Briefing"]) {
    await page.getByRole("button", { name: new RegExp(`^${tab}`) }).first().click();
    const carry = page.locator(".decision-carry:visible");
    await carry.locator("summary").click();
    await expect(carry).toContainText("Latest recorded call in each category");
    await expect(carry.locator("strong").first()).toBeVisible();
    await expect(carry.locator(".effect-list")).toBeVisible();
    await page.addScriptTag({ content: axe });
    expect(await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ["violations"] })).violations)).toEqual([]);
  }
});

for (const width of [320, 375, 430, 768, 810, 820, 834, 1024, 1080, 1194, 1280]) test(`practice is accessible and fits ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/practice?lesson=confidence", { waitUntil: "networkidle" });
  await page.addScriptTag({ content: axe });
  expect(await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ["violations"] })).violations)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("practice remains usable when local storage is blocked", async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw Error("blocked"); }; });
  await page.goto("/practice?lesson=signal", { waitUntil: "networkidle" });
  for (let index = 0; index < 3; index++) {
    await page.getByRole("radio").first().check();
    await page.getByRole("button", { name: "Check judgment", exact: true }).click();
    await page.getByRole("button", { name: index === 2 ? "Finish exercise" : "Next decision", exact: true }).click();
  }
  await expect(page.getByText(/The learning record could not be saved/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Exercise complete", exact: true })).toBeVisible();
});

test("confidence is off by default and the explicit opt-in survives a reload", async ({ page }) => {
  await page.addInitScript(save => {
    if (!localStorage.getItem("breach-command.session")) localStorage.setItem("breach-command.session", save);
    if (!localStorage.getItem("breach-command.preferences")) localStorage.setItem("breach-command.preferences", JSON.stringify({ sound: false, voice: false, music: false }));
    localStorage.setItem("breach-command.tutorial-complete", "true");
  }, serialiseSession(responsePhaseGame(), false, false));
  await page.goto("/play", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page.getByText("Optional confidence reflection", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Game settings" }).click();
  await expect(page.locator("#reflection-setting")).toHaveAttribute("aria-checked", "false");
  await page.locator("#reflection-setting").click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("breach-command.preferences")!).reflection)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByText("Optional confidence reflection", { exact: true }).first()).toBeVisible();
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page.getByText("Optional confidence reflection", { exact: true }).first()).toBeVisible();
});

test("practice supports longer locale text and stored high contrast", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.addInitScript(() => localStorage.setItem("breach-command.preferences", JSON.stringify({ highContrast: true })));
  await page.goto("/practice?lesson=containment&locale=en-XA", { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveClass(/high-contrast/);
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText("Choose a containment boundary");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.addScriptTag({ content: axe });
  expect(await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ["violations"] })).violations)).toEqual([]);
});

test.describe("practice offline", () => {
test.use({ serviceWorkers: "allow" });
test("visited practice and lesson queries work offline", async ({ page, context, browserName }) => {
  test.skip(browserName === "webkit", "Playwright WebKit cannot reload offline through its service worker; preserve the native Safari manual check");
  await page.goto("/practice?lesson=signal", { waitUntil: "networkidle" });
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await expect.poll(() => page.evaluate(async () => {
    const cache = await caches.open((await caches.keys()).find(key => key.startsWith("breach-command-"))!);
    const shell = await cache.match("/practice");
    if (!shell) return false;
    const paths = [...new Set((await shell.text()).match(/\/_next\/static\/[^"'\s)\\]+/g) ?? [])];
    return (await Promise.all(paths.map(path => cache.match(path)))).every(Boolean);
  })).toBe(true);
  await context.setOffline(true);
  await page.goto("/practice?lesson=confidence&locale=en-XA", { waitUntil: "load" });
  await expect(page.getByRole("radio")).toHaveCount(3);
  await page.getByRole("radio").first().check();
  await expect(page.getByRole("button", { name: /./ }).first()).toBeVisible();
});
});
