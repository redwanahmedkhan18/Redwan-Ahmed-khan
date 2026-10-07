import { defineConfig, devices } from "@playwright/test";

/**
 * E2E: homepage, project/research navigation, contact + hire forms,
 * CV page, admin login + CRUD workflow, 404, responsive checks.
 * Assumes backend :8000 and frontend :3000 are running (CI starts them).
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
