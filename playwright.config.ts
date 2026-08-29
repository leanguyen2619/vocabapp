import { defineConfig, devices } from "@playwright/test";

// A handful of critical end-to-end flows (login, a full student quiz, an admin vocabulary
// assignment) run against a real Postgres database and a real `next start` server — see
// e2e/README.md for how to seed the database before running these locally or in CI. Unit tests
// (src/**/*.test.ts, run via `npm test`) cover pure functions; these cover the actual app wired
// together, which is exactly what unit tests can't catch (routing, Server Actions, real DB reads).

const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
