import { expect, test } from "@playwright/test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { attacks, correlateEvidence, getEvidenceSpecialist, scenarios, signed } from "../../lib/advanced-game";
import { msg, say } from "../../lib/i18n/message";
import { namedSpecialists } from "../../lib/command-systems";
import { openWithSave, pendingDecisionGame, responsePhaseGame, twoStagesGame } from "./fixtures";

const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");

async function openEvidence(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  const reference = page.locator(".reference-fold");
  if (!(await reference.evaluate(element => (element as HTMLDetailsElement).open))) await reference.locator(":scope > summary").click();
  await page.locator(".evidence-detail").evaluate(element => { (element as HTMLDetailsElement).open = true; });
}

for (const width of [320, 375, 430, 768, 810, 820, 834, 1024, 1080, 1194, 1280]) {
  test(`links and source portraits stay readable at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const game = twoStagesGame();
    await openWithSave(page, game);
    await openEvidence(page);
    const links = page.getByRole("region", { name: "Linked evidence", exact: true });
    await expect(links.locator("li")).toHaveCount(0);
    const findings = page.locator(".evidence-cards button");
    for (const [index, item] of game.evidence.entries()) {
      const specialist = getEvidenceSpecialist(game, item);
      await expect(findings.nth(index).locator(".source-analyst")).toContainText(namedSpecialists[specialist].name);
      await expect(findings.nth(index).locator(".source-analyst img")).toHaveAttribute("src", `/art/portraits/${specialist}.webp`);
      await expect(findings.nth(index).locator(".source-analyst img")).toHaveAttribute("alt", "");
    }
    await findings.nth(0).click();
    await findings.nth(1).click();
    await expect(links.locator('[data-relationship="untested"]')).toContainText("Untested connection");
    await expect(links.locator('[data-relationship="supported"]')).toHaveCount(0);
    for (const [index, item] of game.evidence.slice(0, 2).entries()) {
      const node = links.locator(".evidence-link-node").nth(index);
      await expect(node.locator("small")).toContainText(say(item.source));
      await expect(node.locator(".evidence-axes")).toContainText("Signal: strong");
      await expect(node.locator(".evidence-axes")).toContainText("Confidence: weak");
    }
    const untestedColour = await links.locator(".evidence-link-connector").evaluate(element => getComputedStyle(element).color);
    const axes = findings.first().locator(".evidence-axes > span");
    expect(await axes.nth(0).evaluate(element => getComputedStyle(element).color)).not.toBe(await axes.nth(1).evaluate(element => getComputedStyle(element).color));
    await links.screenshot({ path: info.outputPath("untested-link.png") });
    await page.getByRole("button", { name: "Causal sequence", exact: true }).click();
    await page.getByRole("button", { name: "Test assessment", exact: true }).click();
    await expect(links.locator('[data-relationship="supported"]')).toContainText("Supported causal link");
    await expect(links.locator('[data-relationship="untested"]')).toHaveCount(0);
    const supportedColour = await links.locator(".evidence-link-connector").evaluate(element => getComputedStyle(element).color);
    expect(supportedColour).not.toBe(untestedColour);
    expect(await axes.nth(1).evaluate(element => getComputedStyle(element).color)).toBe(supportedColour);
    await links.screenshot({ path: info.outputPath("supported-link.png") });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await links.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.addScriptTag({ content: axeSource });
    expect(await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ["violations"] })).violations)).toEqual([]);
    await findings.nth(0).click();
    await findings.nth(1).click();
    await page.getByRole("button", { name: "Causal sequence", exact: true }).click();
    await expect(page.getByRole("button", { name: "Test assessment", exact: true })).toBeDisabled();
    await expect(page.locator(".relationship-helper")).toContainText("This pair is already tested");
    await page.getByRole("button", { name: /^Command/ }).first().click();
    expect(await page.locator(".chain-sheet li").evaluateAll(rows => rows.every(row => {
      const text = document.createRange();
      text.selectNodeContents(row.querySelector(".chain-stage")!);
      const stage = text.getBoundingClientRect();
      const status = row.querySelector(".chain-status")!.getBoundingClientRect();
      return stage.right <= status.left || stage.bottom <= status.top || status.bottom <= stage.top;
    }))).toBe(true);
  });
}

test("current stage follows confirmed findings and ignores unrevealed techniques", async ({ page }) => {
  const game = twoStagesGame();
  const texts: string[] = [];
  const alternate = { ...game, chain: game.chain.map(id => {
    if (game.revealed.includes(id)) return id;
    const stage = attacks.find(item => item.id === id)!.stage;
    return scenarios[game.scenario].choices[stage].find(candidate => candidate !== id) ?? id;
  }) };
  for (const fixture of [game, alternate]) {
    await openWithSave(page, fixture);
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await page.getByRole("button", { name: /^Command/ }).first().click();
    const chain = page.locator(".chain-sheet");
    await expect(chain.locator('[aria-current="step"]')).toHaveCount(1);
    await expect(chain.locator('[aria-current="step"] .chain-no')).toHaveText("3");
    await expect(chain.locator('[aria-current="step"]')).toContainText("Investigating now");
    await expect(chain.locator(".confirmed")).toHaveCount(2);
    texts.push(await chain.innerText());
  }
  expect(texts[0]).toBe(texts[1]);
});

for (const width of [320, 375, 430, 768, 810, 820, 834, 1024, 1080, 1194, 1280]) {
  test(`review milestones and complete check log at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const game = responsePhaseGame();
    await openWithSave(page, game, false, { voice: false });
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await expect(page.locator('.chain-sheet [aria-current="step"]')).toHaveCount(0);
    for (let phase = 0; phase < 3; phase++) await page.locator(".response-options > button").first().click();
    await page.getByRole("button", { name: /Open after-action review|Review the record|Review the drill/ }).click();
    await page.locator(".debrief-index").getByRole("button", { name: "Timeline", exact: true }).click();
    const timeline = page.locator("#debrief-timeline");
    await timeline.evaluate(element => element.scrollIntoView({ behavior: "instant", block: "start" }));
    await expect.poll(() => timeline.evaluate(element => {
      const heading = element.querySelector(":scope > details > summary")!.getBoundingClientRect();
      const index = document.querySelector(".debrief-index")!.getBoundingClientRect();
      return heading.top - index.bottom;
    })).toBeGreaterThanOrEqual(0);
    const log = timeline.locator(".complete-check-log");
    await expect(log).not.toHaveAttribute("open", "");
    await expect(timeline.locator(":scope > details > div")).toHaveCount(game.turns.filter(turn => turn.revealed || turn.injectReveal).length);
    await expect(timeline).toContainText("Response:");
    await timeline.screenshot({ path: info.outputPath("review-milestones.png") });
    await timeline.locator(".milestone-effects summary").first().click();
    await expect(timeline.locator(".milestone-effects .effect-list").first()).toBeVisible();
    const firstFinding = game.turns.flatMap(turn => [turn.revealed, turn.injectReveal]).find(id => game.decisions.some(record => record.stage === id));
    const decision = game.decisions.find(record => record.stage === firstFinding)!;
    await expect(timeline.locator(".milestone-effects .effect-list").first().locator("b")).toHaveText([decision.impactChange, decision.continuityChange, decision.sectorChange, decision.objectiveChange].map(signed));
    await log.locator("summary").click();
    await expect(log.locator(":scope > div")).toHaveCount(game.turns.length);
    await expect(log.locator(".effect-list").first()).toContainText("Business impact");
    expect(await timeline.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.addScriptTag({ content: axeSource });
    expect(await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ["violations"] })).violations)).toEqual([]);
  });
}

for (const assessment of ["causal", "coincidental"] as const) {
  test(`saved ${assessment} comparisons preserve disputed and unrelated relationships`, async ({ page }) => {
    const game = twoStagesGame();
    const second = game.evidence[1];
    const bounded = { ...game, evidence: [game.evidence[0], { ...second, supports: null, title: msg("engine.evidence.emptyTitle", { source: second.source }) }] };
    const compared = correlateEvidence(bounded, [bounded.evidence[0].id, second.id], assessment);
    await openWithSave(page, compared);
    await openEvidence(page);
    const links = page.locator(".evidence-links");
    await expect(links.locator(assessment === "causal" ? '[data-relationship="disputed"]' : '[data-relationship="unrelated"]')).toHaveCount(1);
    await expect(links).toContainText(assessment === "causal" ? "Causal link disputed" : "No causal link");
    await expect(links.locator('[data-relationship="untested"]')).toHaveCount(0);
  });
}

test("missing portraits preserve complete source-review attribution", async ({ page }) => {
  await page.route("**/art/portraits/**", route => route.abort());
  const game = twoStagesGame();
  await openWithSave(page, game);
  await openEvidence(page);
  const first = page.locator(".evidence-cards button").first();
  await expect(first.locator(".source-analyst")).toContainText(namedSpecialists[getEvidenceSpecialist(game, game.evidence[0])].name);
  await first.click();
  await expect(first).toHaveAttribute("aria-pressed", "true");
});

test("continuity and impact colours follow the existing labelled thresholds", async ({ page }) => {
  const colours: string[] = [];
  for (const [continuity, impact, status] of [[76, 39, "Stable"], [75, 40, "Degraded"], [45, 70, "At risk"]] as const) {
    await openWithSave(page, { ...twoStagesGame(), continuity, impact }, false, { voice: false });
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    const meter = page.locator(".continuity-meter");
    await expect(meter.locator("small")).toHaveText(status);
    const colour = await meter.locator("strong").evaluate(element => getComputedStyle(element).color);
    expect(await meter.locator("small").evaluate(element => getComputedStyle(element).color)).toBe(colour);
    expect(await meter.locator('[data-slot="progress-indicator"]').evaluate(element => getComputedStyle(element).backgroundColor)).toBe(colour);
    colours.push(colour);
    await expect(page.locator(".impact-meter small")).toHaveText(impact < 40 ? "Contained" : impact < 70 ? "Rising" : "Critical");
  }
  expect(new Set(colours).size).toBe(3);
});

for (const highContrast of [false, true]) test(`confidence inks stay readable on paper with high contrast ${highContrast}`, async ({ page }) => {
  await openWithSave(page, pendingDecisionGame(), true, { highContrast, voice: false });
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  const assessment = page.getByRole("dialog").locator(".evidence-assessment");
  await expect(assessment).toContainText("Signal: strong");
  await expect(assessment).toContainText("Confidence: weak");
  await page.addScriptTag({ content: axeSource });
  expect(await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ["violations"] })).violations)).toEqual([]);
  await page.emulateMedia({ forcedColors: "active" });
  await expect(assessment).toContainText("Signal: strong");
  await expect(assessment).toContainText("Confidence: weak");
  await expect(page.locator(".evidence-decision button").first()).toBeEnabled();
});
