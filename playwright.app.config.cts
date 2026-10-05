import { defineConfig, devices } from '@playwright/test';

import fs from 'fs';
import path from 'path';

/**
 * Playwright config for the Enigma-AI application app (bolt US-APP-001).
 *
 * Separate from playwright.config.ts, which targets CrewHub and runs
 * tests/seed.spec.ts as its setup project. `.cts` so it always loads as
 * CommonJS: this folder's package.json is the kit's own ("type": "module"),
 * under which playwright.config.ts's `__dirname` is undefined.
 *
 *   npx playwright test -c playwright.app.config.cts
 */
function loadEnvLocal() {
  const file = path.resolve(__dirname, '.env.local');
  if (!fs.existsSync(file)) return;
  for (const rawLine of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(rawLine);
    if (!match) continue;
    const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
    if (value && process.env[match[1]] === undefined) process.env[match[1]] = value;
  }
}
loadEnvLocal();

export default defineConfig({
  testDir: './tests',
  /* Sign-in measured at ~2.5s live (2026-10-05); the list grid fills ~3s
   * after navigation. 60s leaves headroom without hiding a hang. */
  timeout: 60_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,            // e2e.config.yml execution.retries: keep 0 while authoring
  workers: 1,            // tests create data with unique names; no contention measured yet
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://10.11.13.219:669/',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /app\.seed\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      testMatch: /e2e[\\/]US-APP-\d+[\\/].*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});
