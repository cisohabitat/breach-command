import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
// A machine whose preinstalled Chromium is not the build this Playwright release
// expects can name it here rather than download another. The cloud session hook
// in .claude/hooks/session-start.sh sets it only when the expected build is absent.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

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
    browserName: "chromium",
    actionTimeout: 10_000,
    navigationTimeout: 60_000,
    reducedMotion: "reduce",
    serviceWorkers: "block",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "corepack pnpm dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
