import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
// A machine whose preinstalled Chromium is not the build this Playwright release
// expects can name it here rather than download another. The cloud session hook
// in .claude/hooks/session-start.sh sets it only when the expected build is absent.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
// WebKit and Firefox run the suites that exercise layout, input, storage and
// the offline cache. They are opt-in because a machine without those browsers
// installed (a cloud session whose network refuses the download) can still run
// everything in Chromium; CI sets the variable and installs all three.
const allBrowsers = !!process.env.PLAYWRIGHT_ALL_BROWSERS;
const crossBrowserSuites = /(responsive-game|keyboard|persistence|offline|share)\.spec\.ts/;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 1 : 0,
  reporter: [["line"]],
  outputDir: "test-results/playwright",
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    actionTimeout: 10_000,
    navigationTimeout: 60_000,
    reducedMotion: "reduce",
    serviceWorkers: "block",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium", ...(executablePath ? { launchOptions: { executablePath } } : {}) } },
    ...(allBrowsers ? [
      { name: "webkit", use: { browserName: "webkit" as const }, testMatch: crossBrowserSuites },
      { name: "firefox", use: { browserName: "firefox" as const }, testMatch: crossBrowserSuites },
    ] : []),
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "corepack pnpm dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
