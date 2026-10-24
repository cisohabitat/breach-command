import { mkdirSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { test, type Page } from "@playwright/test";
import { sectorSetPieces } from "../../lib/phase8";
import { commandEvents } from "../../lib/advanced-game";
import { openWithSave, pendingDecisionGame, responsePhaseGame, twoStagesGame } from "./fixtures";

// The computed style of every element and its ::before and ::after on every
// seeded surface, at a width inside every band the stylesheet's media queries
// draw, so a cascade change shows even where the pixels cannot. An instrument
// for a stylesheet refactor rather than a test: it runs only when STYLE_DIR
// names where to write. Record before and after, against a production build:
//   STYLE_DIR=/tmp/before PLAYWRIGHT_BASE_URL=http://localhost:3200 pnpm exec playwright test computed-styles
//   STYLE_DIR=/tmp/after  ... (after the change and a rebuild)
//   python3 scripts/compare-styles.py /tmp/before /tmp/after
// Two runs of one build compare equal; a rule moved past its phone override
// does not.
const widths = [320, 370, 400, 540, 760, 875, 930, 1000, 1280] as const;
async function snap(page: Page, name: string) {
  await page.waitForTimeout(150);
  const data = await page.evaluate(() => {
    for (const animation of document.getAnimations()) { try { animation.finish(); } catch { animation.cancel(); } }
    const table: string[] = []; const index = new Map<string, number>();
    const id = (style: CSSStyleDeclaration) => { const parts: string[] = []; for (let i = 0; i < style.length; i++) { const p = style[i]; parts.push(p + ":" + style.getPropertyValue(p)); } const text = parts.sort().join("\n"); let n = index.get(text); if (n === undefined) { n = table.length; table.push(text); index.set(text, n); } return n; };
    const key = (el: Element) => { const parts: string[] = []; for (let e: Element | null = el; e && e !== document.documentElement; e = e.parentElement) { const parent = e.parentElement; const i = parent ? [...parent.children].indexOf(e) : 0; parts.push(`${e.tagName.toLowerCase()}${e.classList.length ? "." + [...e.classList].join(".") : ""}:${i}`); } return parts.reverse().join(">"); };
    const elems = [...document.querySelectorAll("*")].map(el => [key(el), id(getComputedStyle(el)), id(getComputedStyle(el, "::before")), id(getComputedStyle(el, "::after"))]);
    return { table, elems };
  });
  writeFileSync(`${process.env.STYLE_DIR}/${name}.json.gz`, gzipSync(JSON.stringify(data)));
}
// The fixtures draw from Math.random and crypto; seeded here, and only for
// these tests, so two recordings build the same operations.
let seedState = 42;
const realRandom = Math.random;
const realCrypto = Object.getOwnPropertyDescriptor(globalThis, "crypto")!;
test.beforeEach(() => {
  Math.random = () => { seedState = (seedState * 16807) % 2147483647; return (seedState - 1) / 2147483646; };
  Object.defineProperty(globalThis, "crypto", { value: undefined, configurable: true });
});
test.afterEach(() => {
  Math.random = realRandom;
  Object.defineProperty(globalThis, "crypto", realCrypto);
});
async function resume(page: Page) { await page.getByRole("button", { name: /^Resume “.+”$/ }).click(); await page.waitForTimeout(600); }
for (const width of widths) {
  test(`styles at ${width}`, async ({ page }) => {
    test.skip(!process.env.STYLE_DIR, "an instrument: set STYLE_DIR to record");
    test.setTimeout(240_000);
    mkdirSync(process.env.STYLE_DIR!, { recursive: true });
    seedState = 42 + width;
    await page.addInitScript(() => { let state = 7; Math.random = () => { state = (state * 16807) % 2147483647; return (state - 1) / 2147483646; }; });
    const fx = { two: twoStagesGame(), pending: pendingDecisionGame(), sector: twoStagesGame(), response: responsePhaseGame() };
    await page.setViewportSize({ width, height: 900 });
    await openWithSave(page, null);
    await snap(page, `${width}-assignment`);
    await page.getByText("Advanced operation settings").click(); await page.waitForTimeout(200);
    await snap(page, `${width}-assignment-advanced`);
    await page.getByRole("button", { name: "Game settings" }).click(); await page.waitForTimeout(400);
    await snap(page, `${width}-settings`);
    await page.keyboard.press("Escape"); await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Field guide" }).click(); await page.waitForTimeout(400);
    await snap(page, `${width}-guide`);
    await page.keyboard.press("Escape");
    await openWithSave(page, fx.two); await resume(page);
    await snap(page, `${width}-brief`);
    await page.keyboard.press("Escape"); await page.waitForTimeout(300);
    await snap(page, `${width}-investigate`);
    await page.evaluate(() => document.querySelectorAll("details").forEach(fold => { (fold as HTMLDetailsElement).open = true; }));
    await snap(page, `${width}-investigate-open`);
    await page.getByRole("button", { name: /^Briefing/ }).click(); await page.waitForTimeout(300);
    await snap(page, `${width}-briefing-tab`);
    await page.getByRole("button", { name: /^Command/ }).click(); await page.waitForTimeout(300);
    await snap(page, `${width}-command`);
    await openWithSave(page, fx.pending); await resume(page);
    await snap(page, `${width}-report`);
    await openWithSave(page, { ...fx.sector, pendingSetPiece: sectorSetPieces[fx.sector.scenario].id }); await resume(page);
    await page.keyboard.press("Escape"); await page.waitForTimeout(300);
    await snap(page, `${width}-sector-decision`);
    await openWithSave(page, { ...fx.sector, pendingCommand: Object.keys(commandEvents)[0] as keyof typeof commandEvents }); await resume(page);
    await page.keyboard.press("Escape"); await page.waitForTimeout(300);
    await snap(page, `${width}-command-event`);
    await openWithSave(page, fx.response); await resume(page);
    await snap(page, `${width}-response`);
    for (let phase = 0; phase < 3; phase++) { await page.locator(".response-options > button").first().click(); await page.waitForTimeout(300); }
    await snap(page, `${width}-ending`);
    await page.getByRole("button", { name: /Open after-action review|Review the record|Review the drill/ }).click(); await page.waitForTimeout(600);
    await page.evaluate(() => document.querySelectorAll("details").forEach(fold => { (fold as HTMLDetailsElement).open = true; }));
    await page.waitForTimeout(800);
    await snap(page, `${width}-review`);
  });
}
