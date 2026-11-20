/**
 * Distributor DMS end-to-end suite. Runs against an ALREADY RUNNING local stack seeded with the demo data:
 *   backend:  MONGODB_URI=mongodb://127.0.0.1:27999/ MONGODB_DB_NAME=dms_demo node src/server.js
 *   frontend: npx vite --host 0.0.0.0
 *   run:      npx playwright test -c playwright.dms.config.js
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/dms',
  fullyParallel: false,
  workers: 1,
  timeout: 2_400_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['json', { outputFile: '../reference-audit/final-screenshots/e2e-results.json' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    viewport: { width: 1366, height: 768 },
    acceptDownloads: true,
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } } }],
});
