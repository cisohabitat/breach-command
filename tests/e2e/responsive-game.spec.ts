import { expect, test, type Locator, type Page } from "@playwright/test";

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

      const review = page.getByRole("button", { name: /Open after-action review|Review the record|Review the drill/i });
      await expectReachableTarget(page, review, "Open review");
      await review.click();
      await expect(page.getByText("AFTER-ACTION REVIEW", { exact: true })).toBeVisible();
      await expectNoHorizontalOverflow(page, viewport.label + " debrief");

      const audit = await page.evaluate(() => window.__breachResponsiveAudit);
      expect(audit, viewport.label + " should record the exercised surfaces").toEqual({
        decision: true,
        containment: true,
        assurance: true,
        recovery: true,
        debrief: true,
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
