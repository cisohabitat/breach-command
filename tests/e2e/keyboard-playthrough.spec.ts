import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// A whole operation played with the keyboard alone, from the assignment to the
// review: Tab to a control, Enter to use it, Escape to leave. The player is a
// small set of rules (answer what a report asks, take the next response,
// run a procedure, record a reading), so it reaches every surface an operation
// shows: the mission brief, the procedure dialog, the roll, the Captain's
// report and its responses, a sector decision, a command event, the three
// response steps, the ending and the review. Along the way it holds four
// things: focus never falls to the page after an action, every focused control
// shows a focus indicator and is not hidden behind the pinned bars, and axe
// finds nothing on each surface the first time it appears. The dice are
// seeded, so every run plays the same operation.

const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");

type Stop = { label: string; issues: string[] };

// The focused element and what is wrong with it: no indicator, nothing
// focused, off the screen, or entirely under something else (WCAG 2.4.11: a
// point near its top and the middle of its visible part both covered).
async function focusStop(page: Page): Promise<Stop> {
  return page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null;
    if (!element || element === document.body) return { label: "body", issues: ["focus on the page"] };
    const label = `${element.tagName.toLowerCase()} "${(element.getAttribute("aria-label") || element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40)}"`;
    const issues: string[] = [];
    const style = getComputedStyle(element);
    const ring = (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0) || (style.boxShadow && style.boxShadow !== "none");
    if (!ring) issues.push("no focus indicator");
    const box = element.getBoundingClientRect();
    if (box.bottom < 0 || box.top > innerHeight || box.right < 0 || box.left > innerWidth) issues.push("off the screen");
    else if (box.width && box.height) {
      const x = Math.min(Math.max(box.left + box.width / 2, 1), innerWidth - 1);
      const top = Math.max(box.top, 0), bottom = Math.min(box.bottom, innerHeight);
      const covers = [top + Math.min(box.height / 2, 10), (top + bottom) / 2]
        .map(y => document.elementFromPoint(x, Math.min(Math.max(y, 1), innerHeight - 1)))
        .filter(hit => hit && hit !== element && !element.contains(hit) && !hit.contains(element));
      if (covers.length === 2) issues.push(`hidden under ${covers[0]!.tagName.toLowerCase()}.${String(covers[0]!.className).split(" ")[0]}`);
    }
    return { label, issues };
  });
}

class Player {
  problems: string[] = [];
  audited = new Set<string>();
  constructor(private page: Page) {}

  // Smooth scrolling carries a control into view over a few frames; a stop is
  // judged where it comes to rest.
  private async settledStop() {
    let stop = await focusStop(this.page);
    if (stop.issues.some(issue => issue !== "focus on the page")) {
      await this.page.waitForTimeout(600);
      stop = await focusStop(this.page);
    }
    return stop;
  }

  // Tab until the focused control matches; false after one full cycle.
  async tabTo(selector: string, max = 160) {
    let first = "";
    for (let press = 0; press < max; press++) {
      await this.page.keyboard.press("Tab");
      const [match, path] = await this.page.evaluate(sel => {
        const element = document.activeElement;
        const steps: number[] = [];
        for (let node: Element | null = element; node?.parentElement; node = node.parentElement) steps.push([...node.parentElement.children].indexOf(node));
        return [!!element && element.matches(sel), steps.join(".")] as const;
      }, selector);
      const stop = await this.settledStop();
      for (const issue of stop.issues) if (issue !== "focus on the page") this.problems.push(`${issue}: ${stop.label}`);
      if (match) return true;
      if (press === 0) first = path;
      else if (path === first) return false;
    }
    return false;
  }

  // Press a key, let a roll play out, and check where focus came to rest.
  async press(key: string, action: string) {
    await this.page.keyboard.press(key);
    await this.page.waitForTimeout(250);
    await this.page.waitForFunction(() => !document.querySelector(".roll-dialog"), null, { timeout: 15_000 });
    await this.page.waitForTimeout(450);
    const stop = await this.settledStop();
    for (const issue of stop.issues) this.problems.push(`${issue} after ${action}: ${stop.label}`);
    await this.audit();
  }

  // axe, once for each surface: the open dialog's title, or the screen's
  // first heading when none is open.
  async audit() {
    const surface = await this.page.evaluate(() => {
      const dialog = document.querySelector("[role=dialog][data-state=open]");
      if (dialog) return `dialog: ${(dialog.querySelector("h2")?.textContent ?? "").replace(/[0-9]/g, "").trim().slice(0, 40)}`;
      const heading = document.querySelector("[data-awaiting-heading]") ?? document.querySelector(".workspace-tabs .active");
      return `screen: ${(heading?.textContent ?? "").replace(/[0-9]/g, "").trim().slice(0, 40)}`;
    });
    if (this.audited.has(surface)) return;
    this.audited.add(surface);
    await this.page.addScriptTag({ content: axeSource });
    const violations = await this.page.evaluate(async () => {
      const axe = (window as unknown as { axe: { run: (context: unknown, options: unknown) => Promise<{ violations: { id: string; nodes: { target: string[] }[] }[] }> } }).axe;
      const result = await axe.run(document, { resultTypes: ["violations"] });
      return result.violations.map(violation => `${violation.id} → ${violation.nodes.map(node => node.target.join(" ")).join(", ")}`);
    });
    for (const violation of violations) this.problems.push(`axe on ${surface}: ${violation}`);
  }
}

// Each width has its own seed: at 1280 px the operation is won through the
// response; at 390 px it is lost, and the last report opens the review.
for (const [width, height, dice] of [[1280, 800, 20261011], [390, 844, 1]] as const) {
  test(`an operation plays from assignment to review with the keyboard alone at ${width}px`, async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "played in Chromium");
    test.setTimeout(300_000);
    await page.setViewportSize({ width, height });
    await page.clock.setFixedTime(new Date("2026-10-11T12:00:00Z"));
    await page.addInitScript((start: number) => {
      // The same dice every run: the engine draws from crypto.getRandomValues
      // (lib/game.ts, randomInt), so a small seeded generator stands in for it.
      // The die's animation uses Math.random and is left alone, so how long a
      // roll animates never changes what it rolls.
      let seed = start;
      const next = () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return (t ^ (t >>> 14)) >>> 0;
      };
      Object.defineProperty(crypto, "getRandomValues", {
        value: <T extends ArrayBufferView | null>(array: T) => {
          if (array instanceof Uint32Array) for (let index = 0; index < array.length; index++) array[index] = next();
          else if (array) { const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength); for (let index = 0; index < bytes.length; index++) bytes[index] = next() & 255; }
          return array;
        },
      });
      try {
        localStorage.clear();
        localStorage.setItem("breach-command.tutorial-complete", "true");
      } catch {}
    }, dice);
    await page.goto("/", { waitUntil: "networkidle" });
    const player = new Player(page);
    await player.audit();

    expect(await player.tabTo(".start-button, .phone-quick-start button"), "the start button is reachable").toBe(true);
    await player.press("Enter", "starting the operation");
    const played: string[] = [];
    for (let step = 0; step < 160 && !(await page.locator(".resolution").count()); step++) {
      if (await page.locator("[role=dialog][data-state=open]").count()) {
        if (await player.tabTo("[role=dialog] .evidence-decision button:has(.option-letter), [role=dialog] .set-piece-options button, [role=dialog] .command-options button")) { await player.press("Enter", "a response in a dialog"); played.push("dialog response"); continue; }
        if (await player.tabTo("[role=dialog] button.primary-button")) { await player.press("Enter", "a dialog's main button"); played.push("dialog button"); continue; }
        await player.press("Escape", "leaving a dialog");
        continue;
      }
      if (await player.tabTo(".response-options > button, .set-piece-options button, .command-options button")) { await player.press("Enter", "an option on the page"); played.push("page option"); continue; }
      if (await player.tabTo("button.procedure-card:not([disabled])")) { await player.press("Enter", "a procedure"); played.push("procedure"); continue; }
      if (await player.tabTo(".hypothesis-options button")) { await player.press("Enter", "a reading"); played.push("reading"); continue; }
      if (await player.tabTo(".workspace-tabs > button:nth-child(2)")) { await player.press("Enter", "the Investigate tab"); continue; }
      throw new Error(`nothing to do by keyboard after: ${played.slice(-5).join(", ")}`);
    }
    await expect(page.locator(".resolution"), "the operation ends").toBeVisible();
    await expect(page.locator(".resolution"), "the seed plays the ending it is chosen for").toHaveClass(width === 1280 ? /resolution-won/ : /resolution-lost/);
    expect(played.filter(step => step === "procedure").length, "procedures were run").toBeGreaterThan(1);

    // A lost operation leaves its last report open, whose button opens the
    // review; otherwise the review is opened from the ending on the page.
    const reportOpen = await page.locator("[role=dialog][data-state=open]").count();
    expect(await player.tabTo(reportOpen ? "[role=dialog] button.primary-button" : ".resolution button"), "the review is reachable").toBe(true);
    await player.press("Enter", "opening the review");
    await expect(page.locator(".debrief-dialog")).toBeVisible();
    await player.press("Escape", "closing the review");
    await expect(page.locator(".resolution [data-awaiting-heading]")).toBeFocused();

    expect([...new Set(player.problems)], `surfaces audited: ${[...player.audited].join("; ")}`).toEqual([]);
  });
}
