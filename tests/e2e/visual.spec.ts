import { expect, test, type Page } from "@playwright/test";
import { sectorSetPieces } from "../../lib/phase8";
import { commandEvents } from "../../lib/advanced-game";
import { defaultCampaign, CAMPAIGN_KEY } from "../../lib/campaign";
import { openWithSave, pendingDecisionGame, responsePhaseGame, twoStagesGame } from "./fixtures";

// Pixel baselines for the screens a player spends the game on, at the four
// widths the layout sweep checks. Most of what visual reviews found (an
// effects column stranded mid-row, three figures at three heights, two rules
// twenty pixels apart) was a regression a diff would have caught before merge.
// Baselines are Chromium on a GitHub runner, recorded by the "Record visual
// baselines" workflow after a deliberate visual change and reviewed image by
// image before they are brought in. A developer's machine renders text with
// slightly different anti-aliasing (about one per cent of a phone screen), so
// outside CI the comparison allows three per cent: enough for glyph edges, not
// for a moved column or a missing rule.
const widths = [[320, 720], [390, 844], [820, 1180], [1280, 800]] as const;

// The incident variant previewed on the assignment is drawn fresh on each
// load, so its line is masked rather than allowed to fail every run.
// The build line changes with every commit.
const masked = (page: Page) => [page.locator(".variant-brief"), page.locator(".build-version")];

async function resume(page: Page) {
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.waitForTimeout(600);
}

// The artwork loads lazily, so whether a scene behind a dialog had arrived
// when the screenshot was taken depended on timing. Every image is loaded and
// decoded first, so a baseline shows the screen as a player sees it settled.
async function imagesSettled(page: Page) {
  await page.evaluate(async () => {
    const images = [...document.images];
    for (const image of images) image.loading = "eager";
    await Promise.all(images.map(image => image.decode().catch(() => undefined)));
  });
}

async function snap(page: Page, name: string, fullPage = false) {
  await imagesSettled(page);
  await expect(page).toHaveScreenshot(name, { fullPage, mask: masked(page), animations: "disabled", caret: "hide", maxDiffPixelRatio: process.env.CI ? 0.01 : 0.03 });
}

async function snapLinks(page: Page, name: string) {
  await imagesSettled(page);
  await expect(page.locator(".evidence-links")).toHaveScreenshot(name, { animations: "disabled", maxDiffPixelRatio: process.env.CI ? 0.01 : 0.03 });
}

// A campaign part-way through, and one finished with its conclusion: the
// assignment then carries a record, a mastery tally on the case strip, an act
// and a conclusion with their art, which a new player's screen never shows.
// A whole page fails on any change of height, so the figures avoid a line
// that wraps on one machine and not another: a four-digit experience left
// "Your command record" a pixel from wrapping at 320.
const midCampaign = { ...defaultCampaign, completed: [0, 2, 4], xp: 300, operations: 6, mastery: { 0: 1, 2: 3, 4: 5 }, bestScores: { 0: 81, 2: 74, 4: 66 }, unresolvedThreads: 2, routeHistory: ["watchtower", "breakwater"] };
const finishedCampaign = { ...midCampaign, completed: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], xp: 960, operations: 14, leadershipTrust: 80, readiness: 80, unresolvedThreads: 0, commandPosture: { observe: 9, act: 6 }, mastery: { 0: 2, 1: 1, 2: 3, 3: 1, 4: 5, 5: 2, 6: 1, 7: 1, 8: 2, 9: 1 }, routeHistory: ["watchtower", "breakwater", "convergence"] };

async function openCampaign(page: Page, campaign: object) {
  await page.addInitScript(([key, value]) => {
    try {
      localStorage.clear();
      localStorage.setItem("breach-command.tutorial-complete", "true");
      localStorage.setItem(key, value);
    } catch {}
  }, [CAMPAIGN_KEY, JSON.stringify(campaign)] as const);
  await page.goto("/play", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".career-card")).toBeVisible();
  await page.waitForLoadState("networkidle");
  // A whole-page capture leaves the sticky start where the first screen put
  // it, over whatever is there in the page; in its own place it shows the
  // panel as it is laid out.
  await page.addStyleTag({ content: ".start-button { position: static !important; }" });
}

test.describe("visual baselines", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "baselines are recorded in Chromium");

  for (const [width, height] of widths) {
    test(`decision reaction at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      // Keep playback deterministic while checking the real caption and controls.
      await page.addInitScript(() => {
        Object.defineProperty(window, "Audio", { configurable: true, value: class {
          src = "";
          volume = 1;
          onplaying: (() => void) | null = null;
          onended: (() => void) | null = null;
          onerror: (() => void) | null = null;
          play() { this.onplaying?.(); return Promise.resolve(); }
          pause() {}
          removeAttribute() {}
          load() {}
        } });
      });
      await openWithSave(page, pendingDecisionGame(), false, { voice: true, music: false, sound: false, haptics: false });
      await page.getByRole("button", { name: "Resume", exact: true }).click();
      await page.locator(".evidence-decision button").first().click();
      const voice = page.getByRole("region", { name: "Incident Captain" });
      await expect(voice).toContainText("Observation recorded.");
      await voice.getByRole("button", { name: "Skip voice", exact: true }).click();
      await expect(voice.getByRole("button", { name: "Listen", exact: true })).toHaveAttribute("aria-disabled", "false");
      await expect(voice).toHaveScreenshot(`${width}-decision-reaction.png`, { animations: "disabled", maxDiffPixelRatio: process.env.CI ? 0.01 : 0.03 });
    });

    test(`title at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/", { waitUntil: "networkidle" });
      await snap(page, `${width}-title.png`);
    });

    test(`screens at ${width}`, async ({ page }) => {
      // The assignment previews the day's incident variant, whose line can wrap
      // to two and move everything below it, so the clock is the day the
      // baselines were recorded: they passed on 11 October and failed on the 12th.
      await page.clock.setFixedTime(new Date("2026-10-11T12:00:00Z"));
      await page.setViewportSize({ width, height });

      // Keep the established silent presentation baselines. The Captain suite
      // separately covers the default-on presentation at every supported width.
      await openWithSave(page, null, false, { voice: false });
      await snap(page, `${width}-assignment.png`);

      await openWithSave(page, twoStagesGame(), false, { voice: false });
      await resume(page);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
      await snap(page, `${width}-investigate.png`);

      const reference = page.locator(".reference-fold");
      if (!(await reference.evaluate(element => (element as HTMLDetailsElement).open))) await reference.locator(":scope > summary").click();
      await page.locator(".evidence-detail").evaluate(element => { (element as HTMLDetailsElement).open = true; });
      await page.locator(".evidence-cards button").nth(0).click();
      await page.locator(".evidence-cards button").nth(1).click();
      await snapLinks(page, `${width}-links-untested.png`);
      await page.getByRole("button", { name: "Causal sequence", exact: true }).click();
      await page.getByRole("button", { name: "Test assessment", exact: true }).click();
      await snapLinks(page, `${width}-links-supported.png`);

      await openWithSave(page, pendingDecisionGame(), false, { voice: false });
      await resume(page);
      await snap(page, `${width}-report.png`);

      const sector = twoStagesGame();
      await openWithSave(page, { ...sector, pendingSetPiece: sectorSetPieces[sector.scenario].id }, false, { voice: false });
      await resume(page);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
      await snap(page, `${width}-sector-decision.png`);

      await openWithSave(page, { ...sector, pendingCommand: Object.keys(commandEvents)[0] as keyof typeof commandEvents }, false, { voice: false });
      await resume(page);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
      await snap(page, `${width}-command-event.png`);

      await openWithSave(page, responsePhaseGame(), false, { voice: false });
      await resume(page);
      await snap(page, `${width}-response.png`);

      for (let phase = 0; phase < 3; phase++) {
        await page.locator(".response-options > button").first().click();
        await page.waitForTimeout(300);
      }
      await snap(page, `${width}-ending.png`);

      await page.getByRole("button", { name: /Open after-action review|Review the record|Review the drill/ }).click();
      await page.waitForTimeout(600);
      await snap(page, `${width}-review.png`);
    });
  }

  // Whole pages, because what changes in a campaign is below the first screen.
  for (const [width, height] of widths) {
    test(`campaign at ${width}`, async ({ page }) => {
      await page.clock.setFixedTime(new Date("2026-10-11T12:00:00Z"));
      await page.setViewportSize({ width, height });
      await openCampaign(page, midCampaign);
      await snap(page, `${width}-campaign-mid.png`, true);
    });
    test(`finished campaign at ${width}`, async ({ page }) => {
      await page.clock.setFixedTime(new Date("2026-10-11T12:00:00Z"));
      await page.setViewportSize({ width, height });
      await openCampaign(page, finishedCampaign);
      await expect(page.locator(".campaign-ending")).toBeVisible();
      await snap(page, `${width}-campaign-finished.png`, true);
    });
  }
});
