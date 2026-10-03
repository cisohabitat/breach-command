import { expect, test } from "@playwright/test";

// The offline cache from the outside. The page's own scripts and styles have to
// be in the worker's cache after a single visit: before they were precached on
// install, offline play rested on the browser's HTTP cache keeping them, and the
// worker itself held only the page shell.

// The other suites block service workers so that a cached page cannot carry one
// test's build into the next; this one is about the worker, so it allows it.
test.use({ serviceWorkers: "allow" });

test("a single visit is enough to play offline", async ({ page, context }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    const cache = await caches.open(names.find(name => name.startsWith("breach-command-"))!);
    return (await cache.keys()).map(request => new URL(request.url).pathname);
  });
  expect(cached.some(path => path.endsWith(".js")), "the page's scripts are cached by the worker").toBe(true);
  expect(cached.some(path => path.endsWith(".css")), "and its styles").toBe(true);

  await context.setOffline(true);
  await page.reload({ waitUntil: "load" });
  await expect(page.locator(".briefing-screen")).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /Begin investigation/i }).click();
  await expect(page.getByRole("button", { name: /Assume command/i })).toBeVisible();
});
