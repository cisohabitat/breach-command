import { expect, test, type Page } from "@playwright/test";
import { LAST_OPERATION_KEY } from "../../lib/last-operation";
import { msg } from "../../lib/i18n/message";

// The assignment screen paints with the stylesheet the page links, before the
// game's own (components/game/game.css, loaded with the game bundle) arrives,
// and must look the same once it has: a rule in the game's sheet that styled
// the assignment screen would change it when the bundle warms. Each screen is
// captured with every other stylesheet and script refused, then normally, and
// the two must match pixel for pixel.
async function capture(page: Page, path: string, blocked: boolean, storage: Record<string, string>) {
  if (blocked) {
    const html = await (await page.request.get(path)).text();
    const linked = new Set(html.match(/\/_next\/static\/[^"'\s)\\]+\.(?:css|js)/g) ?? []);
    await page.route(/\/_next\/static\/.+\.(css|js)$/, route => linked.has(new URL(route.request().url()).pathname) ? route.continue() : route.abort());
  }
  await page.addInitScript(values => { localStorage.clear(); for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value); }, storage);
  await page.goto(path, { waitUntil: "networkidle" });
  await page.waitForTimeout(blocked ? 300 : 1500);
  return page.screenshot({ fullPage: true, animations: "disabled", caret: "hide" });
}

const returning = {
  "breach-command.tutorial-complete": "true",
  [LAST_OPERATION_KEY]: JSON.stringify({ scenario: 0, difficulty: "training", outcome: "won", ending: msg("record.endingStoodDown"), score: 82, endedAt: Date.UTC(2026, 9, 1), next: { scenario: 1, difficulty: "operational", title: msg("engine.reads.untested"), reason: msg("record.clearedOperational", { score: 82 }) } }),
};

for (const width of [390, 1280]) {
  for (const [name, storage] of [["first visit", {}], ["returning", returning]] as const) {
    test(`the assignment screen at ${width}, ${name}, looks the same before and after the game's styles load`, async ({ browser, browserName }) => {
      test.skip(browserName !== "chromium", "compared in Chromium");
      const shots: Buffer[] = [];
      for (const blocked of [true, false]) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        shots.push(await capture(page, "/", blocked, storage));
        await page.close();
      }
      expect(shots[0].equals(shots[1]), "a rule in the game's stylesheet reaches the assignment screen").toBe(true);
    });
  }
}
