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
  // The artwork loads lazily and fades in once it has, so both captures wait
  // for every image to arrive and show: under a loaded machine one of them
  // could otherwise be taken mid-fade, and the comparison failed on timing.
  await page.evaluate(async () => {
    const images = [...document.images];
    for (const image of images) image.loading = "eager";
    await Promise.all(images.map(image => image.decode().catch(() => undefined)));
  });
  // A scene that fades in is shown once the page has marked it loaded; before
  // hydration it carries no mark at all, and counting that as shown let a
  // capture catch the case's scene still transparent. One that failed to load
  // stays empty, and a portrait does not fade.
  await page.waitForFunction(() => [...document.images].every(image => image.complete && (image.naturalWidth === 0 || !image.matches(".story-art, .sector-illustration") || image.dataset.loaded === "true")));
  // A complete, shown image decoded off the main thread could still miss the
  // frame the screenshot took (one capture in ten under load, the scene's
  // frame empty), so the images decode with the page and two frames pass.
  await page.evaluate(async () => {
    const images = [...document.images];
    for (const image of images) image.decoding = "sync";
    await Promise.all(images.map(image => image.decode().catch(() => undefined)));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  // And, as toHaveScreenshot does, the capture is the first that matches the
  // one before it, so a frame painted without its image is never the one kept.
  let shot = await page.screenshot({ fullPage: true, animations: "disabled", caret: "hide" });
  for (let attempt = 0; attempt < 5; attempt++) {
    const next = await page.screenshot({ fullPage: true, animations: "disabled", caret: "hide" });
    if (next.equals(shot)) break;
    shot = next;
  }
  return shot;
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
        shots.push(await capture(page, "/play", blocked, storage));
        await page.close();
      }
      expect(shots[0].equals(shots[1]), "a rule in the game's stylesheet reaches the assignment screen").toBe(true);
    });
  }
}

// A route outside the game never loads the game's sheet, so a rule it needs
// must reach it some other way. The educator pack imports its own
// (app/educators/educators.css); after the split it was briefly left in the
// game's, and the page showed as unstyled text.
test("the educator pack is styled without the game", async ({ page }) => {
  await page.goto("/educators", { waitUntil: "networkidle" });
  const style = await page.locator(".educator-pack").evaluate(element => {
    const computed = getComputedStyle(element);
    return { maxWidth: computed.maxWidth, background: computed.backgroundColor };
  });
  expect(style).toEqual({ maxWidth: "760px", background: "rgb(239, 233, 220)" });
});
