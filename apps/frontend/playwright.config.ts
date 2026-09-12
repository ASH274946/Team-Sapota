import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for the VidyaAI frontend.
 *
 * ── REQUIRED DEPENDENCIES (not yet installed) ──
 *   npm install -D @playwright/test
 *   npx playwright install        # downloads chromium/firefox/webkit browsers
 *   (optional, for a11y assertions) npm install -D @axe-core/playwright
 *
 * The app must be running (webServer below boots `npm run dev` automatically).
 * The globalSetup logs in the seeded roles and writes storageState files so the
 * specs can reuse authenticated sessions.
 */
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment once `npx playwright install firefox webkit` has been run:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  globalSetup: './e2e/globalSetup.ts',
});
