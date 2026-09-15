import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

// §3.3: isolated per run, no shared state with production or between CI
// runs -- a fresh local SQLite file, recreated by globalSetup before the
// server starts.
export const E2E_DB_PATH = path.resolve(__dirname, '.e2e-test.db');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // shared SQLite file -- avoid concurrent writers
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 3100',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      NODE_ENV: 'development',
      TURSO_DATABASE_URL: `file:${E2E_DB_PATH}`,
      SESSION_SECRET: 'e2e-test-session-secret-do-not-use-in-production',
      ANTHROPIC_API_KEY: 'e2e-unused-fake-key',
      E2E_FAKE_ANTHROPIC: '1',
    },
  },
});
