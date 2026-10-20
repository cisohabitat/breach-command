import { expect, test } from "@playwright/test";

// The offline cache from the outside. The page's own scripts and styles have to
// be in the worker's cache after a single visit: before they were precached on
// install, offline play rested on the browser's HTTP cache keeping them, and the
// worker itself held only the page shell.

// The other suites block service workers so that a cached page cannot carry one
// test's build into the next; this one is about the worker, so it allows it.
test.use({ serviceWorkers: "allow" });

test("a single visit is enough to play offline", async ({ page, context, browserName }) => {
  // Playwright's WebKit on Linux fails the offline reload inside the browser
  // ("WebKit encountered an internal error") before the worker can answer, so
  // the result says nothing about Safari. Offline play on a real iPhone is a
  // manual check in docs/ROADMAP.md, Phase 1.
  test.skip(browserName === "webkit", "Playwright's WebKit cannot reload offline through a service worker");
  await page.goto("/play", { waitUntil: "networkidle" });
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    const cache = await caches.open(names.find(name => name.startsWith("breach-command-"))!);
    return (await cache.keys()).map(request => new URL(request.url).pathname);
  });
  expect(cached.some(path => path.endsWith(".js")), "the page's scripts are cached by the worker").toBe(true);
  expect(cached.some(path => path.endsWith(".css")), "and its styles").toBe(true);

  await context.setOffline(true);
  await page.goto("/?locale=en-XA", { waitUntil: "load" });
  await expect(page.locator(".title-start")).toBeVisible();
  await page.locator(".title-start").click();
  await expect(page).toHaveURL(/\/play\?locale=en-XA$/);
  await expect(page.locator(".briefing-screen")).toBeVisible();
  await page.goto("/play", { waitUntil: "load" });
  await page.reload({ waitUntil: "load" });
  await expect(page.locator(".briefing-screen")).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /Begin investigation/i }).click();
  await expect(page.getByRole("button", { name: /Assume command/i })).toBeVisible();
});

test("the tall-phone poster remains available offline after it is viewed", async ({ page, context, browserName }) => {
  test.skip(browserName === "webkit", "Playwright's WebKit cannot reload offline through a service worker");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/play", { waitUntil: "networkidle" });
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await page.goto("/", { waitUntil: "networkidle" });
  const poster = page.locator(".title-art img");
  await expect.poll(() => page.evaluate(async () => {
    const key = (await caches.keys()).find(key => key.startsWith("breach-command-"));
    return key ? !!(await (await caches.open(key)).match("/art/title/phone.jpg")) : false;
  })).toBe(true);
  await context.setOffline(true);
  await page.reload({ waitUntil: "load" });
  await expect.poll(() => poster.evaluate(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(page.locator(".title-start")).toBeVisible();
});
