/**
 * Playwright config for the guest e2e suite.
 *
 * These specs talk to the real app, not a mock: the bug they exist to catch
 * (a hold that looks like someone else's take) is a client mapping over a
 * correct API. See docs/testing.md.
 */
import { defineConfig } from "@playwright/test";

const BASE = process.env.BASE ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  retries: 0,
  reporter: [["list"]],
  globalSetup: "./e2e/global-setup.mjs",
  use: {
    baseURL: BASE,
    viewport: { width: 390, height: 844 },
    locale: "he-IL",
    timezoneId: "Asia/Jerusalem",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: BASE,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
