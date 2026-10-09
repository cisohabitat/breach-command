import { expect, test, type Page } from "@playwright/test";
import { openWithSave, responsePhaseGame, twoStagesGame } from "./fixtures";

// The type system is two faces, two weights for emphasis and a fixed scale.
// The reviews counted heading voices: five in the review alone, from a third
// weight in each face and sizes chosen element by element. This counts every
// distinct face, size and weight rendering text on three screens and holds the
// count where it is, so the system can only get tighter. When a deliberate
// consolidation lowers a count, lower its budget here.
const budgets = { assignment: 15, investigate: 17, review: 18 };

async function styles(page: Page) {
  return page.evaluate(() => {
    const seen = new Map<string, string>();
    for (const element of Array.from(document.querySelectorAll("body *"))) {
      const ownText = Array.from(element.childNodes).some(node => node.nodeType === 3 && node.textContent!.trim().length > 1);
      const box = (element as HTMLElement).getBoundingClientRect();
      if (!ownText || !box.width || !box.height) continue;
      const style = getComputedStyle(element);
      const face = /plex|display/i.test(style.fontFamily) ? "form" : "body";
      seen.set(`${face} ${style.fontSize} ${style.fontWeight}`, `${element.tagName.toLowerCase()}.${String(element.className).split(" ")[0]}`);
    }
    return [...seen.entries()];
  });
}

async function check(page: Page, screen: keyof typeof budgets) {
  const found = await styles(page);
  const heavy = found.filter(([key]) => Number(key.split(" ")[2]) >= 700);
  expect(heavy, `${screen}: no text heavier than semibold`).toEqual([]);
  expect(found.length, `${screen}: ${found.map(([key]) => key).sort().join(", ")}`).toBeLessThanOrEqual(budgets[screen]);
}

test("text keeps to the type system", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "font metrics are measured in Chromium");
  await page.setViewportSize({ width: 1280, height: 800 });
  await openWithSave(page, null);
  await check(page, "assignment");
  await openWithSave(page, twoStagesGame());
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.waitForTimeout(600);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  await check(page, "investigate");
  await openWithSave(page, responsePhaseGame());
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.waitForTimeout(600);
  for (let phase = 0; phase < 3; phase++) {
    await page.locator(".response-options > button").first().click();
    await page.waitForTimeout(300);
  }
  await page.getByRole("button", { name: /Open after-action review|Review the record|Review the drill/ }).click();
  await page.waitForTimeout(600);
  await page.evaluate(() => document.querySelectorAll("details").forEach(fold => { (fold as HTMLDetailsElement).open = true; }));
  await check(page, "review");
});
