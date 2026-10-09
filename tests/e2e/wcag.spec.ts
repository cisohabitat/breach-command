import { expect, test, type Page } from "@playwright/test";
import { adversaryObjectives, newGame, playTurn } from "../../lib/advanced-game";
import { openWithSave, pendingDecisionGame, responsePhaseGame, twoStagesGame } from "./fixtures";

// Two WCAG 2.2 criteria axe does not measure. Target Size (Minimum), 2.5.8:
// a target is at least 24 by 24 CSS pixels, or sits in a sentence of text, or
// is spaced so a 24 px circle on it touches no other target or circle.
// Focus Not Obscured (Minimum), 2.4.11: a control that takes focus is not
// entirely hidden behind the pinned tabs, the sticky start or the report's foot.
async function undersizedTargets(page: Page) {
  return page.evaluate(() => {
    const selector = "button, a[href], input, select, textarea, summary, [role=switch], [role=button], [tabindex='0']";
    const targets = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(element => {
      const box = element.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && getComputedStyle(element).visibility !== "hidden";
    }).map(element => ({ element, box: element.getBoundingClientRect() }));
    const small = targets.filter(({ box }) => box.width < 24 || box.height < 24);
    const centre = (box: DOMRect) => [box.left + box.width / 2, box.top + box.height / 2];
    const distanceToBox = ([x, y]: number[], box: DOMRect) => Math.hypot(Math.max(box.left - x, 0, x - box.right), Math.max(box.top - y, 0, y - box.bottom));
    return small.filter(({ element, box }) => {
      // Inline: a target in a sentence, whose block holds more text than it does.
      let block: HTMLElement | null = element.parentElement;
      while (block && getComputedStyle(block).display.startsWith("inline")) block = block.parentElement;
      if (getComputedStyle(element).display.startsWith("inline") && (block?.textContent ?? "").trim().length > (element.textContent ?? "").trim().length + 20) return false;
      // Spacing: a 24 px circle on its centre touches no other target, nor
      // another undersized target's circle.
      const point = centre(box);
      const crowded = targets.some(other => other.element !== element && !other.element.contains(element) && !element.contains(other.element)
        && (distanceToBox(point, other.box) < 12 || ((other.box.width < 24 || other.box.height < 24) && Math.hypot(point[0] - centre(other.box)[0], point[1] - centre(other.box)[1]) < 24)));
      return crowded;
    }).map(({ element, box }) => `${element.tagName.toLowerCase()} "${(element.textContent || element.getAttribute("aria-label") || "").trim().slice(0, 40)}" ${Math.round(box.width)}x${Math.round(box.height)}`);
  });
}

async function obscuredFocus(page: Page, presses: number) {
  const hidden: string[] = [];
  for (let press = 0; press < presses; press++) {
    await page.keyboard.press("Tab");
    const found = await page.evaluate(async () => {
      const element = document.activeElement as HTMLElement | null;
      if (!element || element === document.body) return null;
      // Smooth scrolling carries a newly focused control into view over a few
      // frames; the criterion is about where it comes to rest.
      const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
      let last = "";
      for (let wait = 0; wait < 40; wait++) {
        await frame();
        const now = JSON.stringify(element.getBoundingClientRect());
        if (now === last) break;
        last = now;
      }
      const box = element.getBoundingClientRect();
      if (!box.width || !box.height) return null;
      const points = [[box.left + box.width / 2, box.top + box.height / 2], [box.left + 2, box.top + 2], [box.right - 2, box.top + 2], [box.left + 2, box.bottom - 2], [box.right - 2, box.bottom - 2]];
      const seen = points.some(([x, y]) => {
        if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return false;
        const hit = document.elementFromPoint(x, y);
        return !!hit && (hit === element || element.contains(hit) || hit.contains(element));
      });
      const cover = document.elementFromPoint(points[0][0], points[0][1]);
      return seen ? null : `${element.tagName.toLowerCase()} "${(element.textContent ?? "").trim().slice(0, 40)}" at ${Math.round(box.top)}-${Math.round(box.bottom)} of ${innerHeight}, under ${cover ? `${cover.tagName.toLowerCase()}.${String(cover.className).split(" ")[0]}` : "nothing"}`;
    });
    if (found) hidden.push(found);
  }
  return [...new Set(hidden)];
}

for (const width of [390, 1280]) {
  test(`targets and focus meet WCAG 2.2 at ${width}px`, async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "measured in Chromium");
    await page.setViewportSize({ width, height: 844 });
    await openWithSave(page, null);
    await page.waitForLoadState("networkidle");
    expect(await undersizedTargets(page), "assignment").toEqual([]);
    expect(await obscuredFocus(page, 80), "assignment focus").toEqual([]);

    await openWithSave(page, twoStagesGame());
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await page.waitForTimeout(500);
    expect(await undersizedTargets(page), "mission brief").toEqual([]);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    expect(await undersizedTargets(page), "investigate").toEqual([]);
    expect(await obscuredFocus(page, 120), "investigate focus").toEqual([]);

    await openWithSave(page, pendingDecisionGame());
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await page.waitForTimeout(500);
    expect(await undersizedTargets(page), "report").toEqual([]);
    expect(await obscuredFocus(page, 30), "report focus").toEqual([]);

    await openWithSave(page, responsePhaseGame());
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await page.waitForTimeout(500);
    for (let phase = 0; phase < 3; phase++) {
      await page.locator(".response-options > button").first().click();
      await page.waitForTimeout(300);
    }
    expect(await undersizedTargets(page), "ending").toEqual([]);
    await page.getByRole("button", { name: /Open after-action review/ }).click();
    await page.waitForTimeout(500);
    await page.evaluate(() => document.querySelectorAll("details").forEach(fold => { (fold as HTMLDetailsElement).open = true; }));
    expect(await undersizedTargets(page), "review").toEqual([]);
    expect(await obscuredFocus(page, 60), "review focus").toEqual([]);
  });
}

// The assessed objective stays unconfirmed until two stages are, and nothing a
// screen reader can reach may name it before then: not the text, not an
// accessible name, not a live region. The objective bar's label once did.
test("nothing on the page names the hidden objective before two stages are confirmed", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "checked in Chromium");
  let game = newGame(0, "operational", () => 0);
  game = playTurn({ ...game, injectDeck: [] }, "dns", 2);
  expect(game.revealed.length).toBeLessThan(2);
  const hidden = adversaryObjectives[game.objective].title.toLowerCase();
  await openWithSave(page, game);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.waitForTimeout(400);
  await page.keyboard.press("Escape");
  for (const workspace of ["Command", "Investigate", "Briefing"]) {
    await page.getByRole("button", { name: new RegExp(`^${workspace}`) }).first().click();
    await page.waitForTimeout(250);
    // The case theory lists all five objectives as choices, which names none.
    const exposed = await page.evaluate(() => {
      const outside = (element: Element) => !element.closest(".case-theory");
      const text = Array.from(document.body.querySelectorAll("*")).filter(element => outside(element) && element.childNodes.length && Array.from(element.childNodes).some(node => node.nodeType === 3)).map(element => Array.from(element.childNodes).filter(node => node.nodeType === 3).map(node => node.textContent).join(" "));
      return [
        ...text,
        ...Array.from(document.querySelectorAll("[aria-label],[aria-valuetext],[title]")).filter(outside).map(element => [element.getAttribute("aria-label"), element.getAttribute("aria-valuetext"), element.getAttribute("title")].join(" ")),
        ...Array.from(document.querySelectorAll("[aria-live]")).map(element => element.textContent ?? ""),
      ].join("\n").toLowerCase();
    });
    expect(exposed.includes(hidden), `${workspace} names "${hidden}"`).toBe(false);
  }
});
