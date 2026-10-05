import { test, expect } from '@playwright/test';

/**
 * Sign-in seed for the Enigma-AI application app (BASE_URL in .env.local,
 * http://10.11.13.219:669/ for bolt US-APP-001).
 *
 * Kept separate from tests/seed.spec.ts, which is CrewHub's seed. Pass this
 * file explicitly as `seedFile`; never rely on the default.
 *
 * Credentials come from .env.local (E2E_USER / E2E_PASSWORD) via
 * playwright.config.ts. They are never written into this file.
 *
 * Observed live, 2026-10-05:
 *  - Hash-routed React app. `/#/login` shows "Welcome Back!" with Email and
 *    Password textboxes and a "Sign In" button.
 *  - A good sign-in lands on `/#/dashboard` in ~2.5s with a "Login is succeed!"
 *    toast and a side menu (Dashboard, Application, Project, ...).
 */
test('seed', async ({ page }) => {
  const user = process.env.E2E_USER;
  const password = process.env.E2E_PASSWORD;
  expect(user, 'E2E_USER is not set. Add it to .env.local (see .env.local.example).').toBeTruthy();
  expect(password, 'E2E_PASSWORD is not set. Add it to .env.local (see .env.local.example).').toBeTruthy();

  await page.goto('/#/login', { waitUntil: 'domcontentloaded' });
  await page.getByRole('textbox', { name: 'Email' }).fill(user!);
  await page.getByRole('textbox', { name: 'Password' }).fill(password!);
  await page.getByRole('button', { name: 'Sign In' }).click();

  // A rejected credential leaves us on /#/login, so assert we left it.
  await expect(page).toHaveURL(/#\/dashboard$/, { timeout: 30_000 });
  await expect(page.getByRole('link', { name: 'Application' })).toBeVisible();
});
