import { expect, test, type Locator } from "@playwright/test";
import { adversaryProfiles } from "../../lib/advanced-game";
import { CAMPAIGN_KEY, defaultCampaign } from "../../lib/campaign";
import { openWithSave, pendingDecisionGame, responsePhaseGame } from "./fixtures";

async function loaded(image: Locator) {
  await image.scrollIntoViewIfNeeded();
  await expect(image).toHaveAttribute("alt", "");
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0 && element.dataset.loaded === "true")).toBe(true);
}

for (const width of [320, 390, 820, 1280]) {
  test(`the new art fits its real surfaces at ${width}px`, async ({ page }, info) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width, height: 900 });
    for (const source of ["network", "firewall", "dns", "server", "cloud", "forensic", "intel", "hunt"]) {
      const game = pendingDecisionGame();
      // The artwork keys on collection source, not the finding it displays.
      game.turns = game.turns.map(turn => ({ ...turn, procedure: source }));
      await openWithSave(page, game);
      await page.getByRole("button", { name: /^Resume “.+”$/ }).click();
      const image = page.locator(".discovery > .story-art");
      await loaded(image);
      await expect(image).toHaveAttribute("src", `/art/findings/${source}.webp`);
      await page.locator(".discovery").screenshot({ path: info.outputPath(`evidence-${source}.png`) });
    }
    for (const profile of Object.keys(adversaryProfiles)) {
      await openWithSave(page, { ...responsePhaseGame(), adversaryProfile: profile as keyof typeof adversaryProfiles });
      await page.getByRole("button", { name: /^Resume “.+”$/ }).click();
      for (let phase = 0; phase < 3; phase++) await page.locator(".response-options > button").first().click();
      await page.getByRole("button", { name: /Open after-action review|Review the record|Review the drill/ }).click();
      await page.locator(".debrief-detail-fold > summary").click();
      const image = page.locator(".story-art-adversaries");
      await loaded(image);
      await expect(image).toHaveAttribute("src", `/art/adversaries/${profile}.webp`);
      await expect(image).toHaveCSS("width", "48px");
      await image.locator("..").screenshot({ path: info.outputPath(`adversary-${profile}.png`) });
    }
    const endings = [
      { id: "resilience", leadershipTrust: 80, readiness: 80, unresolvedThreads: 0 },
      { id: "foothold", leadershipTrust: 80, readiness: 80, unresolvedThreads: 4 },
      { id: "fractured", leadershipTrust: 30, readiness: 50, unresolvedThreads: 0 },
      { id: "stability", leadershipTrust: 50, readiness: 50, unresolvedThreads: 0 },
    ];
    for (const { id, ...conditions } of endings) {
      await page.addInitScript(([key, campaign]) => {
        localStorage.clear();
        localStorage.setItem(key, campaign);
        localStorage.setItem("breach-command.tutorial-complete", "true");
      }, [CAMPAIGN_KEY, JSON.stringify({ ...defaultCampaign, completed: Array.from({ length: 10 }, (_, i) => i), ...conditions })]);
      await page.goto("/play", { waitUntil: "networkidle" });
      const image = page.locator(".campaign-ending > .story-art");
      await loaded(image);
      await expect(image).toHaveAttribute("src", `/art/campaign/ending-${id}.webp`);
      await expect(image).toHaveCSS("height", width <= 600 ? "120px" : "180px");
      // The half-size copy where the scene is narrower than it, never stretched wider.
      const shown = await image.evaluate((element: HTMLImageElement) => ({ src: element.currentSrc, width: element.getBoundingClientRect().width }));
      if (shown.width <= 400) expect(shown.src).toContain("-480.webp");
      if (shown.width > 480) expect(shown.src).not.toContain("-480.webp");
      await page.locator(".campaign-ending").screenshot({ path: info.outputPath(`campaign-${id}.png`) });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  });
}

test("missing artwork keeps the operation and result download usable", async ({ page }) => {
  await page.route("**/art/**", route => route.abort());
  await openWithSave(page, responsePhaseGame());
  await expect(page.locator(".brand-name")).toHaveText("Breach Command");
  await expect(page.getByRole("link", { name: "Breach Command home", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /^Resume “.+”$/ }).click();
  for (let phase = 0; phase < 3; phase++) await page.locator(".response-options > button").first().click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save image" }).click();
  expect((await download).suggestedFilename()).toBe("breach-command-result.png");
  await expect(page.locator(".share-result")).toContainText("Result image saved.");
});
