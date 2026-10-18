import { expect, test, type Page } from "@playwright/test";
import { attacks, infrastructureTopologies, newGame, type Game } from "../../lib/advanced-game";
import { openWithSave, twoStagesGame } from "./fixtures";

async function openMap(page: Page, game: Game = twoStagesGame()) {
  await openWithSave(page, game, false, { voice: false, sound: false });
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.getByRole("button", { name: /^Investigate/ }).first().click();
  const reference = page.locator(".reference-fold");
  if (!(await reference.evaluate(element => (element as HTMLDetailsElement).open))) await reference.locator(":scope > summary").click();
  await page.locator(".topology-detail > summary").click();
  await page.locator(".map-intel-detail > summary").click();
  return page.locator(".infrastructure-console");
}

for (const width of [320, 1280]) {
  for (let scenario = 0; scenario < infrastructureTopologies.length; scenario++) {
    test(`sector ${scenario + 1} keeps complete map names at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const map = await openMap(page, newGame(scenario, "operational", () => 0));
      await expect(map.locator(".topology-nodes strong")).toHaveText(infrastructureTopologies[scenario].nodes.map(node => node.label));
      await expect(map.locator(".map-intel dd").first()).toHaveText(infrastructureTopologies[scenario].criticalRule);
      const clipped = await map.locator(".route-source, .route-target, .route-relation, .topology-nodes button").evaluateAll(nodes => nodes.filter(node => node.scrollWidth > node.clientWidth + 1).map(node => node.textContent));
      expect(clipped).toEqual([]);
    });
  }
}

for (const width of [320, 375, 430, 768, 810, 820, 834, 1024, 1080, 1194, 1280]) {
  test(`map labels remain readable without inventing compromise at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const game = twoStagesGame();
    const map = await openMap(page, game);
    await expect(map.locator(".map-intel dt")).toHaveText(["Critical dependency", "Confirmed techniques", "Map controls"]);
    await expect(map.locator(".map-intel dd").nth(1)).toHaveText(game.revealed.map(id => attacks.find(attack => attack.id === id)!.title).join(", "));
    // Two techniques found does not prove an ordinal system or path compromised.
    await expect(map.locator(".topology-nodes button em")).toContainText(infrastructureTopologies[0].nodes.map(() => "Unassessed"));
    await expect(map.locator(".topology-nodes")).not.toContainText(/affected|exposed|clear/i);
    await expect(map.locator(".route-status")).toHaveText(infrastructureTopologies[0].edges.map(() => "Unassessed"));
    await expect(map.locator(".node-findings").first()).toBeVisible();
    const overflow = await map.evaluate(element => {
      const bounds = element.getBoundingClientRect();
      return [...element.querySelectorAll(".topology-nodes button, .topology-routes > div, .route-source, .route-target, .route-relation, .map-intel dt, .map-intel dd")].filter(node => {
        const rect = node.getBoundingClientRect();
        return rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || node.scrollWidth > node.clientWidth + 1;
      }).map(node => node.textContent);
    });
    expect(overflow).toEqual([]);
  });
}

test("map controls keep their state and findings when selected", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const map = await openMap(page);
  const node = map.locator(".topology-nodes button").first();
  await node.focus();
  await page.keyboard.press("Enter");
  await expect(node).toHaveAttribute("aria-pressed", "true");
  await expect(node.locator("em")).toContainText("Selected, Unassessed");
  await map.getByRole("button", { name: /^Monitor/ }).click();
  await expect(node.locator("em")).toContainText("Selected, monitored");
  await expect(node.locator(".lucide-eye")).toBeVisible();
  await expect(map.getByRole("button", { name: /^Monitor/ })).toBeDisabled();
  await map.getByRole("button", { name: /^Isolate/ }).click();
  await expect(node.locator("em")).toContainText("Selected, isolated");
  await expect(node.locator(".lucide-shield-off")).toBeVisible();
  await expect(map.locator(".route-blocked").first()).toContainText("Blocked");
  await expect(map.getByRole("button", { name: /^Isolate/ })).toBeDisabled();
});

for (const [width, height] of [[844, 390], [1024, 600], [1280, 700]]) {
  test(`short screen keeps the workspace close and controls usable at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openMap(page, { ...twoStagesGame(), sectorHealth: 28 });
    const tabs = page.locator(".workspace-tabs");
    const heading = page.locator(".game-heading");
    const tallBottom = await heading.evaluate(element => element.getBoundingClientRect().bottom + scrollY);
    await page.setViewportSize({ width, height });
    expect((await page.locator(".topbar").boundingBox())!.height).toBeLessThanOrEqual(64);
    for (const button of await page.locator(".top-actions button").all()) {
      const rect = await button.boundingBox();
      expect(rect!.height).toBeGreaterThanOrEqual(44);
      expect(await button.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
    await expect.poll(() => heading.evaluate(element => element.getBoundingClientRect().bottom + scrollY)).toBeLessThan(tallBottom - 20);
    await expect(heading.locator(".sector-alert")).toBeVisible();
    const [headerBox, alertBox] = await Promise.all([heading.boundingBox(), heading.locator(".sector-alert").boundingBox()]);
    expect(alertBox!.width).toBeGreaterThan(headerBox!.width * 0.9);
    for (const button of await tabs.getByRole("button").all()) {
      const rect = await button.boundingBox();
      expect(rect!.height).toBeGreaterThanOrEqual(44);
      expect(rect!.height).toBeLessThanOrEqual(46);
    }
    for (const workspace of [/^Command/, /^Briefing/, /^Investigate/]) {
      await tabs.getByRole("button", { name: workspace }).first().click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await expect(page.locator(".procedure-card").first()).toBeVisible();
  });
}

for (const [width, height] of [[1024, 768], [1080, 810], [1194, 834]]) {
  test(`iPad landscape toolbar keeps labels and readouts usable at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await openMap(page);
    expect((await page.locator(".topbar").boundingBox())!.height).toBeLessThanOrEqual(64);
    const tabs = page.locator(".workspace-tabs");
    for (const button of await page.locator(".top-actions button, .workspace-tabs button").all()) {
      const rect = await button.boundingBox();
      expect(rect!.height).toBeGreaterThanOrEqual(44);
      expect(await button.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
    await page.locator(".map-intel").scrollIntoViewIfNeeded();
    await expect(tabs.locator(".pinned-readouts")).toBeVisible();
    expect(await tabs.locator(".pinned-readouts").evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await tabs.getByRole("button", { name: /^Briefing/ }).click();
    await expect(tabs.getByRole("button", { name: /^Briefing/ })).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("expanded map returns to a readable Briefing at 820×1180", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await openMap(page);
  await page.locator(".map-intel").scrollIntoViewIfNeeded();
  const tabs = page.locator(".workspace-tabs");
  await expect(tabs.locator(".pinned-readouts")).toBeVisible();
  const briefing = await tabs.getByRole("button", { name: /^Briefing/ }).boundingBox();
  expect(briefing).not.toBeNull();
  expect(briefing!.x).toBeGreaterThanOrEqual(0);
  expect(briefing!.x + briefing!.width).toBeLessThanOrEqual(820);
  expect(briefing!.y).toBeGreaterThanOrEqual(0);
  expect(briefing!.y + briefing!.height).toBeLessThanOrEqual(1180);
  await page.mouse.click(briefing!.x + briefing!.width / 2, briefing!.y + briefing!.height / 2);
  await expect(tabs.getByRole("button", { name: /^Briefing/ })).toHaveAttribute("aria-pressed", "true");
  await expect(tabs.locator(".pinned-readouts")).toBeVisible();
  await expect.poll(() => page.locator(".captain-label").evaluate(element => {
    const heading = element.getBoundingClientRect();
    const readouts = document.querySelector(".pinned-readouts")!.getBoundingClientRect();
    return heading.top >= readouts.bottom && heading.bottom <= innerHeight;
  })).toBe(true);
  // Someone who deliberately returned to the page top keeps that position.
  await page.evaluate(() => window.scrollTo({ top: 0 }));
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await tabs.getByRole("button", { name: /^Command/ }).click();
  await expect(tabs.getByRole("button", { name: /^Command/ })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});
