import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  attackVector, availableIn, newGame, nextEvidenceSource, playTurn, procedures,
  resolveCommand, resolveDecision, resolveSetPiece, setHypothesis, type Game,
} from "../../lib/advanced-game";
import { SESSION_KEY, serialiseSession } from "../../lib/session";

type AuditState = {
  decision: boolean;
  containment: boolean;
  assurance: boolean;
  recovery: boolean;
  debrief: boolean;
};

declare global {
  interface Window {
    __breachResponsiveAudit?: AuditState;
  }
}

const viewports = [
  { label: "phone 320", width: 320, height: 720 },
  { label: "phone 375", width: 375, height: 812 },
  { label: "phone 430", width: 430, height: 932 },
  { label: "iPad portrait 768", width: 768, height: 1024 },
  { label: "iPad portrait 810", width: 810, height: 1080 },
  { label: "iPad portrait 820", width: 820, height: 1180 },
  { label: "iPad portrait 834", width: 834, height: 1112 },
  { label: "iPad landscape 1024", width: 1024, height: 768 },
  { label: "iPad landscape 1080", width: 1080, height: 810 },
  { label: "iPad landscape 1194", width: 1194, height: 834 },
  { label: "desktop 1280", width: 1280, height: 900 },
] as const;

async function installDeterministicAudit(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      localStorage.setItem("breach-command.tutorial-complete", "true");
    } catch {}

    Object.defineProperty(Crypto.prototype, "getRandomValues", {
      configurable: true,
      value(array: ArrayBufferView) {
        if (array instanceof Uint32Array) array.fill(17);
        else new Uint8Array(array.buffer, array.byteOffset, array.byteLength).fill(17);
        return array;
      },
    });

    const audit: AuditState = {
      decision: false,
      containment: false,
      assurance: false,
      recovery: false,
      debrief: false,
    };
    window.__breachResponsiveAudit = audit;
    const scan = () => {
      const text = document.body?.innerText ?? "";
      audit.decision ||= text.includes("OPERATIONAL DECISION REQUIRED");
      audit.containment ||= text.includes("CONTAINMENT DECISION");
      audit.assurance ||= text.includes("ASSURANCE GATE");
      audit.recovery ||= text.includes("RECOVERY DECISION");
      audit.debrief ||= text.includes("AFTER-ACTION REVIEW");
    };
    const observe = () => {
      scan();
      new MutationObserver(scan).observe(document.documentElement, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", observe, { once: true });
    else observe();
  });
}

async function expectNoHorizontalOverflow(page: Page, surface: string) {
  const overflow = await page.evaluate(() => Math.max(
    document.documentElement.scrollWidth - document.documentElement.clientWidth,
    document.body.scrollWidth - document.body.clientWidth,
  ));
  expect(overflow, surface + " should fit without horizontal page overflow").toBeLessThanOrEqual(1);
}

async function expectReachableTarget(page: Page, target: Locator, label: string) {
  await expect(target, label + " should be visible").toBeVisible();
  await target.scrollIntoViewIfNeeded();
  const [box, viewport] = await Promise.all([target.boundingBox(), Promise.resolve(page.viewportSize())]);
  expect(box, label + " should have a rendered hit area").not.toBeNull();
  expect(viewport, "the responsive test requires an explicit viewport").not.toBeNull();
  if (!box || !viewport) return;
  expect(box.height, label + " should be at least 40px high").toBeGreaterThanOrEqual(39.5);
  expect(box.x, label + " should not be clipped on the left").toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width, label + " should not be clipped on the right").toBeLessThanOrEqual(viewport.width + 1);
}

async function enablePracticeRun(page: Page) {
  await expect(page.locator(".briefing-screen")).toBeVisible();
  const training = page.getByRole("button", { name: /^Training/ });
  if (await training.getAttribute("aria-pressed") !== "true") await training.click();

  const advanced = page.locator("details.advanced-setup > summary");
  await expectReachableTarget(page, advanced, "Advanced operation settings");
  await advanced.click();

  for (const name of ["Fast resolution", "Bot commander"]) {
    const control = page.getByRole("switch", { name });
    if (await control.getAttribute("aria-checked") !== "true") await control.click();
  }

  const start = page.getByRole("button", { name: /Begin investigation/i });
  await expectReachableTarget(page, start, "Begin investigation");
  await start.click();

  const assumeCommand = page.getByRole("button", { name: /Assume command/i });
  await expectReachableTarget(page, assumeCommand, "Assume command");
  await assumeCommand.click();
  await expect(page.getByRole("region", { name: "Bot commander status" })).toBeVisible();
}

// The response sequence only opens once all four stages are confirmed, and a
// bot run under a stubbed random source reaches that on the dice alone — it used
// to, and an engine change flipped it, taking eleven tests with it. This builds
// the same state from the engine instead: perfect rolls against the source that
// exposes the next stage. An operation can still end early in an authorised
// exercise, so it retries until one reaches the response phase.
function responsePhaseGame(): Game {
  for (let attempt = 0; attempt < 50; attempt++) {
    let game = newGame(0, "training");
    for (let guard = 0; guard < 60 && game.status === "playing"; guard++) {
      if (game.pendingDecision) { game = resolveDecision(game, "act"); continue; }
      if (game.pendingCommand) { game = resolveCommand(game, "a"); continue; }
      if (game.pendingSetPiece) { game = resolveSetPiece(game, "a"); continue; }
      const unrevealed = game.chain.find(id => !game.revealed.includes(id));
      if (unrevealed) game = setHypothesis(game, attackVector(unrevealed));
      const wanted = nextEvidenceSource(game)?.id;
      const procedure = wanted && availableIn(game, wanted) === 0
        ? wanted
        : procedures.find(item => availableIn(game, item.id) === 0)?.id;
      if (!procedure) break;
      game = playTurn(game, procedure, 20);
    }
    if (game.status === "response") return game;
  }
  throw new Error("could not build an operation that reaches the response phase");
}

test.describe("responsive interaction audit", () => {
  for (const viewport of viewports) {
    test("plays " + viewport.label + " from assignment through debrief", async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await installDeterministicAudit(page);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: /Find the breach/i })).toBeVisible();
      await expectNoHorizontalOverflow(page, viewport.label + " assignment");

      await enablePracticeRun(page);
      const pause = page.getByRole("button", { name: "Pause Bot Commander" });
      await expectReachableTarget(page, pause, "Pause Bot Commander");
      await pause.click();
      await expect(page.getByText("Bot commander paused", { exact: true })).toBeVisible();

      const investigate = page.getByRole("button", { name: /Investigate/ }).first();
      await expectReachableTarget(page, investigate, "Investigate workspace");
      await investigate.click();
      await expect(page.locator(".investigation-dashboard")).toBeVisible();
      await expectNoHorizontalOverflow(page, viewport.label + " investigation");

      const resume = page.getByRole("button", { name: "Resume Bot Commander" });
      await expectReachableTarget(page, resume, "Resume Bot Commander");
      await resume.click();

      const resolution = page.locator("[data-resolution]");
      await expect(resolution).toBeVisible({ timeout: 90_000 });
      await expectNoHorizontalOverflow(page, viewport.label + " resolution");

      // A bot-run operation opens the review itself once it ends, and it may do so
      // a beat after the resolution renders. Close it whenever it appears so the
      // resolution screen behind it is the surface being audited, then open the
      // review the way a player does. Checking and closing in one retried step
      // avoids racing the bot's own timer.
      const openDebrief = page.getByRole("dialog").filter({ hasText: "AFTER-ACTION REVIEW" });
      const review = page.getByRole("button", { name: /Open after-action review|Review the record|Review the drill/i });
      await expect(async () => {
        if (await openDebrief.count()) await page.keyboard.press("Escape");
        await expect(review).toBeVisible({ timeout: 1_000 });
      }).toPass({ timeout: 30_000 });

      await expectReachableTarget(page, review, "Open review");
      await review.click();
      await expect(page.getByText("AFTER-ACTION REVIEW", { exact: true })).toBeVisible();
      await expectNoHorizontalOverflow(page, viewport.label + " debrief");

      const audit = await page.evaluate(() => window.__breachResponsiveAudit);
      // Whether a bot run wins is the engine's business, so this test audits only
      // the surfaces every finished operation passes through. The response
      // sequence is audited from a saved operation below, where reaching it does
      // not depend on the dice.
      expect(audit?.decision, viewport.label + " should have reached an evidence decision").toBe(true);
      expect(audit?.debrief, viewport.label + " should have reached the review").toBe(true);
    });

    test("walks the response sequence at " + viewport.label, async ({ page }) => {
      test.setTimeout(60_000);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await installDeterministicAudit(page);
      const session = serialiseSession(responsePhaseGame(), false, true);
      await page.addInitScript(([key, value]) => {
        try { localStorage.setItem(key, value); } catch {}
      }, [SESSION_KEY, session] as const);
      await page.goto("/", { waitUntil: "domcontentloaded" });

      const resume = page.getByRole("button", { name: "Resume", exact: true });
      await expectReachableTarget(page, resume, "Resume saved operation");
      await resume.click();

      for (const stage of ["CONTAINMENT DECISION", "ASSURANCE GATE", "RECOVERY DECISION"] as const) {
        await expect(page.getByText(stage, { exact: true })).toBeVisible();
        await expectNoHorizontalOverflow(page, viewport.label + " " + stage.toLowerCase());
        const choice = page.locator(".response-options > button").first();
        await expectReachableTarget(page, choice, stage + " first option");
        await choice.click();
      }

      const audit = await page.evaluate(() => window.__breachResponsiveAudit);
      expect(audit, viewport.label + " should record the response surfaces").toMatchObject({
        containment: true,
        assurance: true,
        recovery: true,
      });
    });
  }

  test("hands a phone-sized practice run back to the player", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await installDeterministicAudit(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await enablePracticeRun(page);

    await page.getByRole("button", { name: "Pause Bot Commander" }).click();
    const takeControl = page.getByRole("button", { name: /Take control/i });
    await expectReachableTarget(page, takeControl, "Take control");
    await takeControl.click();

    await expect(page.getByText("Manual control resumed", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Pause Bot Commander" })).toHaveCount(0);
    await expectNoHorizontalOverflow(page, "phone manual takeover");
  });
});
