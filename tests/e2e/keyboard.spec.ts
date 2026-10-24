import { expect, test, type Page } from "@playwright/test";
import { attacks } from "../../lib/advanced-game";
import { mapOfferGame, openWithSave, pendingDecisionGame, responsePhaseGame, twoStagesGame } from "./fixtures";

// Keyboard play from the outside: where focus lands when an overlay opens, where
// it goes when the control just pressed is replaced, and whether the single-key
// shortcuts can be turned off. Every operation here is built from the engine with
// forced rolls, so nothing depends on the dice.

const focusedRole = (page: Page) => page.evaluate(() => document.activeElement?.getAttribute("role") ?? document.activeElement?.tagName.toLowerCase());
const focusedText = (page: Page) => page.evaluate(() => document.activeElement?.textContent ?? "");

test.describe("keyboard play", () => {
  for (const width of [390, 820, 1280]) {
    test(`mission context stays above the pinned command button at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await openWithSave(page, null);
      await page.locator(".start-button").click();
      const brief = page.locator(".cinematic-briefing");
      await expect(brief).toBeFocused();
      const context = brief.locator(".briefing-more > summary");
      // Reach the context through the actual tab order, with no focus/scroll
      // shortcut that could hide the pinned footer's obstruction.
      for (let stop = 0; stop < 12 && !(await context.evaluate(node => node === document.activeElement)); stop++) {
        await page.keyboard.press("Tab");
      }
      await expect(context).toBeFocused();
      await expect(brief.getByRole("region", { name: "Incident Captain" })).toBeVisible();
      await expect.poll(async () => {
        const summary = await context.boundingBox();
        const button = await brief.locator(".primary-button").boundingBox();
        return !!summary && !!button && summary.y >= 0 && summary.y + summary.height <= button.y;
      }, { message: "Tab scrolls the whole context control above Assume command" }).toBe(true);
      await page.keyboard.press("Enter");
      await expect(brief.locator(".briefing-more")).toHaveJSProperty("open", true);
    });
  }

  test("the captain's report opens on the report, not on a decision", async ({ page }) => {
    await openWithSave(page, pendingDecisionGame());
    await page.getByRole("button", { name: /^Resume “.+”$/ }).click();
    const report = page.getByRole("dialog");
    await expect(report).toBeVisible();
    await expect(report.getByText("Operational decision required")).toBeVisible();
    expect(await focusedRole(page), "focus lands on the report itself").toBe("dialog");
    // Space scrolls a dialog and Enter is pressed to read on; neither may commit a choice.
    await page.keyboard.press("Space");
    await page.keyboard.press("Enter");
    await expect(report.getByText("Operational decision required")).toBeVisible();
    await expect(report.getByText(/This report stays open until the choice is recorded/)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(report).toBeVisible();
    await expect(report.locator("button[data-response]")).toHaveCount(5);
  });

  test("settings open on the dialog, not on the sound switch", async ({ page }) => {
    await openWithSave(page, null);
    await page.getByRole("button", { name: "Game settings" }).click();
    const sound = page.locator("#sound-setting");
    await expect(sound).toBeVisible();
    const before = await sound.getAttribute("aria-checked");
    expect(await focusedRole(page)).toBe("dialog");
    await page.keyboard.press("Space");
    await expect(sound).toHaveAttribute("aria-checked", before ?? "true");
  });

  test("focus follows the response sequence instead of dropping to the page", async ({ page }) => {
    await openWithSave(page, responsePhaseGame());
    await page.getByRole("button", { name: /^Resume “.+”$/ }).click();
    for (const next of ["Assurance gate", "Recovery decision"]) {
      const option = page.locator(".response-options > button").first();
      await option.focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("heading", { name: next })).toBeFocused();
    }
    await page.locator(".response-options > button").first().focus();
    await page.keyboard.press("Enter");
    // The final choice ends the operation; focus moves to the resolution it produced.
    await expect(page.locator(".resolution h2")).toBeFocused();
    expect(await focusedText(page)).not.toEqual("");
    // The review opens over the resolution; closing it returns there, not to the page.
    await page.locator(".resolution").getByRole("button").first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".resolution h2")).toBeFocused();
  });

  test("single-key shortcuts can be turned off", async ({ page }) => {
    await openWithSave(page, null);
    await page.keyboard.press("f");
    await expect(page.getByRole("dialog", { name: "How an operation runs" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.getByRole("button", { name: "Game settings" }).click();
    await page.locator("#shortcut-setting").click();
    await expect(page.locator("#shortcut-setting")).toHaveAttribute("aria-checked", "false");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.keyboard.press("f");
    await page.waitForTimeout(300);
    await expect(page.getByRole("dialog"), "with shortcuts off, F does nothing").toHaveCount(0);
  });

  test("typing in a text field is not a shortcut", async ({ page }) => {
    await openWithSave(page, null);
    const setup = page.locator(".advanced-setup");
    await setup.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(setup).toHaveJSProperty("open", true);
    const input = page.getByRole("textbox", { name: "Challenge code" });
    await input.focus();
    await page.keyboard.press("f");
    await expect(input).toHaveValue("f");
    await page.waitForTimeout(300);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("the case theory and comparison prompts take focus to the evidence workspace", async ({ page }) => {
    await openWithSave(page, twoStagesGame(), true);
    await page.getByRole("button", { name: /^Resume “.+”$/ }).click();
    await page.getByRole("button", { name: /Investigate/ }).first().click();
    const theory = page.getByRole("button", { name: /Record a case theory/ });
    await theory.focus();
    await page.keyboard.press("Enter");
    const workspace = page.locator(".evidence-workspace");
    await expect(workspace).toBeFocused();
    await workspace.locator(".case-theory button").first().click();
    // With a theory recorded, the same note asks for the comparison and goes to the same place.
    const compare = page.getByRole("button", { name: /Compare findings/ });
    await compare.focus();
    await page.keyboard.press("Enter");
    await expect(workspace).toBeFocused();
    await expect(workspace.locator("details.evidence-detail")).toHaveAttribute("open", "");
  });

  test("the map offer unfolds the reference column on a phone and focuses the map", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openWithSave(page, mapOfferGame(), true);
    await page.getByRole("button", { name: /^Resume “.+”$/ }).click();
    await page.getByRole("button", { name: /Investigate/ }).first().click();
    const map = page.locator(".infrastructure-console");
    await expect(map, "folded on a phone until it is wanted").toBeHidden();
    const open = page.locator(".prompt-aside").getByRole("button", { name: /Open the map/ });
    await open.focus();
    await page.keyboard.press("Enter");
    await expect(map).toBeVisible();
    await expect(map).toBeFocused();
  });

  test("copy result puts a spoiler-free summary on the clipboard", async ({ page, context, browserName }) => {
    // Only Chromium lets a test grant clipboard access and read it back. In
    // WebKit and Firefox the action must still answer: copied, or the text shown
    // to copy by hand.
    const readable = browserName === "chromium";
    if (readable) await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const game = responsePhaseGame();
    await openWithSave(page, game);
    await page.getByRole("button", { name: /^Resume “.+”$/ }).click();
    for (let phase = 0; phase < 3; phase++) await page.locator(".response-options > button").first().click();
    await page.getByRole("button", { name: /Copy result/ }).click();
    if (!readable) {
      await expect(page.locator(".share-result")).toContainText(/copied|The quiet intrusion/);
      return;
    }
    await expect(page.locator(".share-result")).toContainText("copied");
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain("The quiet intrusion");
    expect(text).toMatch(/4 of 4 stages confirmed/);
    for (const id of game.chain) expect(text, "no technique is named").not.toContain(attacks.find(attack => attack.id === id)!.title);
  });
});
