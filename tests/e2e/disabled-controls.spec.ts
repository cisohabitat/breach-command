import { expect, test, type Locator, type Page } from "@playwright/test";
import { commandEvents, infrastructureTopologies, resolveMapAction } from "../../lib/advanced-game";
import { openWithSave, responsePhaseGame, twoStagesGame } from "./fixtures";

// Axe exempts disabled controls. Check the contrast players actually see,
// including opacity inherited from a control or one of its containing panels.
async function expectReadable(control: Locator) {
  const readings = await control.evaluateAll(roots => {
    const rgba = (value: string) => {
      const values = value.match(/[\d.]+/g)?.map(Number) ?? [];
      return [values[0] ?? 0, values[1] ?? 0, values[2] ?? 0, values[3] ?? 1];
    };
    const blend = (front: number[], back: number[], alpha = front[3]) => front.slice(0, 3).map((value, i) => value * alpha + back[i] * (1 - alpha));
    const luminance = (rgb: number[]) => rgb.map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0);
    const nodes = [...new Set(roots.flatMap(root => [root, ...root.querySelectorAll("*")]))];
    return nodes.filter(node => node.getBoundingClientRect().width && [...node.childNodes].some(child => child.nodeType === Node.TEXT_NODE && child.textContent?.trim())).map(node => {
      const chain: Element[] = [];
      for (let parent: Element | null = node; parent; parent = parent.parentElement) chain.unshift(parent);
      let surface = [17, 20, 23];
      let opacity = 1;
      for (const parent of chain) {
        const style = getComputedStyle(parent);
        surface = blend(rgba(style.backgroundColor), surface);
        opacity *= Number(style.opacity);
      }
      const style = getComputedStyle(node);
      const ink = rgba(style.webkitTextFillColor || style.color);
      const foreground = luminance(blend(ink, surface, ink[3] * opacity));
      const background = luminance(surface);
      return { text: node.textContent?.trim(), ratio: (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05) };
    });
  });
  expect(readings.length, "visible explanations must be included in the audit").toBeGreaterThan(0);
  for (const reading of readings) expect(reading.ratio, reading.text).toBeGreaterThanOrEqual(4.5);
}

async function unfoldReference(page: Page) {
  const fold = page.locator(".reference-fold");
  if (!(await fold.evaluate(element => (element as HTMLDetailsElement).open))) await fold.locator(":scope > summary").click();
}

for (const [width, highContrast] of [
  ...[320, 375, 430, 768, 810, 820, 834, 1024, 1080, 1194, 1280].map(width => [width, false] as const),
  [375, true], [1280, true],
] as const) {
  test(`unavailable actions remain readable at ${width}, high contrast ${highContrast}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    let game = twoStagesGame();
    const node = infrastructureTopologies[game.scenario].nodes[0];
    game = resolveMapAction(game, node.id, "isolate");
    await openWithSave(page, game, false, { voice: false, sound: false, highContrast });
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    const cooling = page.locator(".procedure-card.cooling");
    await expect(cooling.first()).toBeDisabled();
    await expect(cooling.first().locator(".procedure-bottom")).toHaveText("On cooldown");
    await expect(cooling.first().locator(".procedure-bottom")).toBeVisible();
    await expectReadable(cooling);
    await unfoldReference(page);
    const mapActions = page.locator(".map-command-bar > button");
    await expect(mapActions.nth(0)).toBeDisabled();
    await expect(mapActions.nth(1)).toBeDisabled();
    await expectReadable(mapActions);
    const comparison = page.getByRole("button", { name: "Test assessment", exact: true });
    await expect(comparison).toBeDisabled();
    await expectReadable(comparison);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

for (const width of [375, 1280]) {
  test(`unavailable workspace remains readable at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openWithSave(page, responsePhaseGame(), false, { voice: false, sound: false });
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    const investigate = page.getByRole("button", { name: /^Investigate/ }).first();
    await expect(investigate).toBeDisabled();
    await expectReadable(investigate);
  });

  test(`required decisions keep locked choices readable at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    // The command locks theory; once resolved, the missing reading locks procedures.
    const game = { ...twoStagesGame(), hypothesis: null, pendingCommand: Object.keys(commandEvents)[0] as keyof typeof commandEvents };
    await openWithSave(page, game, false, { voice: false, sound: false });
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await page.getByRole("button", { name: /^Investigate/ }).first().click();
    await unfoldReference(page);
    await page.locator(".theory-guide").evaluate(element => { (element as HTMLDetailsElement).open = true; });
    const choices = page.locator(".case-theory button");
    for (const choice of await choices.all()) await expect(choice).toBeDisabled();
    await expectReadable(choices);
    await page.getByRole("button", { name: /^Command/ }).first().click();
    await page.locator(".command-options > button").first().click();
    await page.getByRole("button", { name: /^Investigate/ }).first().click();
    await expect(page.locator(".procedure-card").first()).toBeDisabled();
    await expectReadable(page.locator(".procedure-card:disabled"));
  });
}
