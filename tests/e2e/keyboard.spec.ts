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
  test("the captain's report opens on the report, not on a decision", async ({ page }) => {
    await openWithSave(page, pendingDecisionGame());
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    const report = page.getByRole("dialog");
    await expect(report).toBeVisible();
    await expect(report.getByText("OPERATIONAL DECISION REQUIRED")).toBeVisible();
    expect(await focusedRole(page), "focus lands on the report itself").toBe("dialog");
    // Space scrolls a dialog and Enter is pressed to read on; neither may commit a choice.
    await page.keyboard.press("Space");
    await page.keyboard.press("Enter");
    await expect(report.getByText("OPERATIONAL DECISION REQUIRED")).toBeVisible();
    await expect(report.getByText(/This report stays open until the choice is recorded/)).toBeVisible();
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
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    for (const next of ["Prove the boundary is ready for restoration.", "The threat is constrained. Restore trusted service."]) {
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
    await expect(page.getByRole("dialog", { name: "Investigate. Decide. Recover." })).toBeVisible();
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

  test("typing in the specialist select is not a shortcut", async ({ page }) => {
    await openWithSave(page, null);
    await page.locator(".specialist-picker select").focus();
    await page.keyboard.press("f");
    await page.waitForTimeout(300);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("the case theory and comparison prompts take focus to the evidence workspace", async ({ page }) => {
    await openWithSave(page, twoStagesGame(), true);
    await page.getByRole("button", { name: "Resume", exact: true }).click();
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
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await page.getByRole("button", { name: /Investigate/ }).first().click();
    const map = page.locator(".infrastructure-console");
    await expect(map, "folded on a phone until it is wanted").toBeHidden();
    const open = page.locator(".prompt-aside").getByRole("button", { name: /Open the map/ });
    await open.focus();
    await page.keyboard.press("Enter");
    await expect(map).toBeVisible();
    await expect(map).toBeFocused();
  });

  test("copy result puts a spoiler-free summary on the clipboard", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const game = responsePhaseGame();
    await openWithSave(page, game);
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    for (let phase = 0; phase < 3; phase++) await page.locator(".response-options > button").first().click();
    await page.getByRole("button", { name: /Copy result/ }).click();
    await expect(page.locator(".share-result")).toContainText("copied");
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain("The quiet intrusion");
    expect(text).toMatch(/4 of 4 stages confirmed/);
    for (const id of game.chain) expect(text, "no technique is named").not.toContain(attacks.find(attack => attack.id === id)!.title);
  });
});
