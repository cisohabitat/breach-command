import { expect, test, type Page } from "@playwright/test";
import budgets from "./performance-budgets.json" with { type: "json" };
import { openWithSave, twoStagesGame } from "./fixtures";

// Budgets for what the page ships and how soon it paints, measured against the
// production build on a throttled phone profile. They are the numbers recorded
// when the budget was set (docs/perf-budgets.md), so the build can only get
// heavier or slower by changing this file on purpose. Chromium only: the
// paint timings come from its Performance APIs.
// Initial script is what the HTML references, parsed before the page answers;
// the rest is warmed when the browser is idle and counts only toward the total.
type Measure = { initialScriptBytes: number; scriptBytes: number; initialStyleBytes: number; styleBytes: number; fcp: number; lcp: number; cls: number };

async function measure(page: Page, open: () => Promise<void>): Promise<Measure> {
  const sizes = { script: 0, style: 0 };
  const byUrl = new Map<string, number>();
  page.on("response", async response => {
    const type = response.request().resourceType();
    if (type !== "script" && type !== "stylesheet") return;
    const body = await response.body().catch(() => null);
    if (!body) return;
    sizes[type === "script" ? "script" : "style"] += body.length;
    byUrl.set(new URL(response.url()).pathname, body.length);
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: 1_600_000 / 8, uploadThroughput: 750_000 / 8 });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.addInitScript(() => {
    const w = window as unknown as { __vitals: { lcp: number; cls: number } };
    w.__vitals = { lcp: 0, cls: 0 };
    new PerformanceObserver(list => { for (const entry of list.getEntries()) w.__vitals.lcp = entry.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver(list => { for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) if (!entry.hadRecentInput) w.__vitals.cls += entry.value; }).observe({ type: "layout-shift", buffered: true });
  });
  await open();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  const vitals = await page.evaluate(() => {
    const paint = performance.getEntriesByName("first-contentful-paint")[0];
    const w = window as unknown as { __vitals: { lcp: number; cls: number } };
    return { fcp: paint ? paint.startTime : 0, lcp: w.__vitals.lcp, cls: w.__vitals.cls };
  });
  const html = await (await page.request.get("/")).text();
  const initial = [...new Set(html.match(/\/_next\/static\/[^"'\s)\\]+\.js/g) ?? [])];
  const initialScriptBytes = initial.reduce((sum, path) => sum + (byUrl.get(path) ?? 0), 0);
  // The stylesheets the page links, which it waits for before it paints; the
  // game's own load with the game bundle.
  const linked = [...new Set(html.match(/\/_next\/static\/[^"'\s)\\]+\.css/g) ?? [])];
  const initialStyleBytes = linked.reduce((sum, path) => sum + (byUrl.get(path) ?? 0), 0);
  return { initialScriptBytes, scriptBytes: sizes.script, initialStyleBytes, styleBytes: sizes.style, ...vitals };
}

function report(label: string, value: Measure) {
  console.log(`${label}: initial script ${value.initialScriptBytes} B (${(value.initialScriptBytes / 1024).toFixed(0)} KB), all script ${value.scriptBytes} B (${(value.scriptBytes / 1024).toFixed(0)} KB), linked style ${value.initialStyleBytes} B, all style ${value.styleBytes} B (${(value.styleBytes / 1024).toFixed(0)} KB), FCP ${value.fcp.toFixed(0)} ms, LCP ${value.lcp.toFixed(0)} ms, CLS ${value.cls.toFixed(3)}`);
}

test.describe("performance budgets", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "paint timings are read from Chromium");
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  test("the assignment screen", async ({ page }) => {
    const value = await measure(page, () => openWithSave(page, null));
    report("assignment", value);
    expect(value.initialScriptBytes, "decoded script the page needs before it answers").toBeLessThanOrEqual(budgets.assignment.initialScriptBytes);
    expect(value.scriptBytes, "decoded script including what is warmed when idle").toBeLessThanOrEqual(budgets.assignment.scriptBytes);
    expect(value.initialStyleBytes, "decoded style the page links and waits for before it paints").toBeLessThanOrEqual(budgets.assignment.initialStyleBytes);
    expect(value.styleBytes, "decoded style by the time the page is idle, the game's included").toBeLessThanOrEqual(budgets.assignment.styleBytes);
    expect(value.lcp, "largest contentful paint on a throttled phone").toBeLessThanOrEqual(budgets.assignment.lcp);
    expect(value.cls, "cumulative layout shift").toBeLessThanOrEqual(budgets.assignment.cls);
  });

  test("an operation in progress", async ({ page }) => {
    const value = await measure(page, async () => {
      await openWithSave(page, twoStagesGame());
      await page.getByRole("button", { name: "Resume", exact: true }).click();
    });
    report("operation", value);
    expect(value.scriptBytes, "decoded script by the time play starts, warmed parts included").toBeLessThanOrEqual(budgets.operation.scriptBytes);
    expect(value.cls, "cumulative layout shift").toBeLessThanOrEqual(budgets.operation.cls);
  });
});
