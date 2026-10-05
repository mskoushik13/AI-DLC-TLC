// spec: bolts/US-APP-001/plan.md § 1
// scenarios: 1.1, 1.2, 1.3, 1.4
// seed: tests/app.seed.spec.ts
// bolt: US-APP-001
// routes: /#/login, /#/dashboard, /#/application, /#/applicationdown
// config: playwright.app.config.cts
// generated: 2026-10-05

import { test, expect, type Page } from '@playwright/test';

// Story test data (inputs/stories/US-APP-001.md). The name gets a timestamp
// suffix because the app rejects a second application with the same name
// (observed live; owner decision at intake, 2026-10-05).
const APP_NAME_PREFIX = 'MSKOUSHIK';
const APP_DESCRIPTION = 'Automated test application';
const APP_URL = 'https://example.com';

// Pager under the Application table, e.g. "1 to 10 of 111". Whitespace-
// tolerant: a regex is matched against raw text (assertion-catalog.md).
const PAGER = /^\s*\d+\s+to\s+\d+\s+of\s+\d+\s*$/;

/** Signs in the same way tests/app.seed.spec.ts does. Every test signs in for itself. */
async function signIn(page: Page) {
  await page.goto('/#/login', { waitUntil: 'domcontentloaded' });
  await page.getByRole('textbox', { name: 'Email' }).fill(process.env.E2E_USER!);
  await page.getByRole('textbox', { name: 'Password' }).fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/#\/dashboard$/, { timeout: 30_000 });
}

/**
 * Opens Application from the side menu and waits for real rows. The grid
 * first renders "No Data Found" for ~3s before its data arrives, so wait for a
 * row action icon, which only real rows have.
 */
async function openApplicationList(page: Page) {
  await page.getByRole('link', { name: 'Application' }).click();
  await expect(page).toHaveURL(/#\/application$/);
  await expect(page.getByRole('img', { name: 'Remove App' }).first()).toBeVisible({ timeout: 20_000 });
}

/** Narrows the paginated list to one name and returns that row. */
async function searchFor(page: Page, name: string, expectedPager: RegExp) {
  await page.getByRole('textbox', { name: 'Keyword Search' }).fill(name);
  await expect(page.getByText(PAGER)).toHaveText(expectedPager);
  return page.getByRole('row').filter({ has: page.getByRole('cell', { name, exact: true }) });
}

test.describe('Application management', () => {
  test('1.1 sign in lands on the Dashboard @smoke', async ({ page }) => {
    // 1. Open the Login screen. 2. Enter email and password, choose "Sign In".
    await signIn(page);

    // Expected: address is /#/dashboard; side menu shows "Application".
    await expect(page).toHaveURL(/#\/dashboard$/);
    await expect(page.getByRole('link', { name: 'Application' })).toBeVisible();
  });

  test('1.2 Application screen opens from the Dashboard @smoke', async ({ page }) => {
    await signIn(page);

    // 1. Choose "Application" in the side menu.
    // Expected: /#/application, at least one real data row once loaded.
    await openApplicationList(page);

    // Expected: heading "Application", "Add Application" button, the four columns.
    await expect(page.getByRole('heading', { name: 'Application', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Application' })).toBeVisible();
    await expect(page.getByRole('columnheader')).toHaveText([
      'Application Name',
      'Application Description',
      'Application URL',
      'Actions',
    ]);
    await expect(page.getByRole('cell', { name: 'No Data Found' })).toBeHidden();
  });

  test('1.3 Add Application shows Name, Description and URL fields @smoke', async ({ page }) => {
    await signIn(page);
    await openApplicationList(page);

    // 1. Choose "Add Application".
    await page.getByRole('button', { name: 'Add Application' }).click();

    // Expected: /#/applicationdown.
    await expect(page).toHaveURL(/#\/applicationdown$/);

    // Expected: App Name, Description and URL shown, empty and editable.
    for (const name of ['App Name', 'Enter description', 'Enter URL']) {
      const field = page.getByRole('textbox', { name, exact: true });
      await expect(field).toBeVisible();
      await expect(field).toBeEditable();
      await expect(field).toHaveValue('');
    }

    // Expected: each labelled with "*". App Name's asterisk is its own element
    // beside the "App Name" label; Description and URL carry it in the label.
    await expect(page.getByText('App Name', { exact: true })).toBeVisible();
    await expect(page.getByText('*', { exact: true })).toBeVisible();
    await expect(page.getByText('Description*', { exact: true })).toBeVisible();
    await expect(page.getByText('URL*', { exact: true })).toBeVisible();

    // Expected: Save and Cancel buttons.
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('1.4 create an application and see it listed exactly as entered @regression', async ({ page }) => {
    const appName = `${APP_NAME_PREFIX}_${Date.now()}`;
    test.info().annotations.push({ type: 'test-data', description: appName });

    // A failed save reports through a native alert ("Failed to save application
    // data. Please check the network or inputs."). Playwright dismisses native
    // dialogs silently unless a handler is registered first, so capture them.
    const nativeDialogs: string[] = [];
    page.on('dialog', async (dialog) => {
      nativeDialogs.push(dialog.message());
      await dialog.accept();
    });

    await signIn(page);
    await openApplicationList(page);
    let created = false;

    try {
      // 1. From the Application screen choose "Add Application".
      await page.getByRole('button', { name: 'Add Application' }).click();
      await expect(page).toHaveURL(/#\/applicationdown$/);

      // 2. Enter Name, Description and URL; leave the toggles at their defaults.
      const nameField = page.getByRole('textbox', { name: 'App Name', exact: true });
      const descriptionField = page.getByRole('textbox', { name: 'Enter description', exact: true });
      const urlField = page.getByRole('textbox', { name: 'Enter URL', exact: true });
      await nameField.fill(appName);
      await descriptionField.fill(APP_DESCRIPTION);
      await urlField.fill(APP_URL);
      await expect(nameField).toHaveValue(appName);
      await expect(descriptionField).toHaveValue(APP_DESCRIPTION);
      await expect(urlField).toHaveValue(APP_URL);

      // 3. Choose "Save". The persisting call is POST /api/Application; a
      // rejected save also answers 200 but with an empty record, so check the body.
      const saved = page.waitForResponse(
        (r) => r.request().method() === 'POST' && /\/api\/Application$/.test(new URL(r.url()).pathname),
      );
      await page.getByRole('button', { name: 'Save' }).click();
      const savedBody = await (await saved).json();
      created = savedBody?.applicationName === appName;

      // Expected: confirmation dialog. Its heading currently renders literal
      // asterisks ("Application **Created** Successfully!", plan discrepancy);
      // Gate 1 Q1 option 1 accepts the wording with or without them.
      const confirmation = page.getByRole('dialog');
      await expect(
        confirmation.getByRole('heading', { name: /^Application\s+(\*\*)?Created(\*\*)?\s+Successfully!$/ }),
      ).toBeVisible();
      await expect(confirmation.getByText('You can now return to the applications list.')).toBeVisible();

      // Expected: no browser error pop-up.
      expect(nativeDialogs, 'save raised a native alert').toEqual([]);
      expect(created, `POST /api/Application did not return the new record: ${JSON.stringify(savedBody)}`).toBe(true);

      // 4. Close the confirmation dialog with "OK".
      await confirmation.getByRole('button', { name: 'OK' }).click();
      await expect(confirmation).toBeHidden();

      // 5. Go to the Application screen and search for the name.
      await openApplicationList(page);
      const row = await searchFor(page, appName, /^\s*1\s+to\s+1\s+of\s+1\s*$/);

      // Expected: exactly one row; Name, Description, URL exactly as entered.
      await expect(row).toHaveCount(1);
      await expect(row.getByRole('cell')).toHaveText([appName, APP_DESCRIPTION, APP_URL, /Remove App/]);
    } finally {
      // 6. Cleanup: Remove App -> "Yes, delete it!" -> "OK" on "Deleted!".
      // Runs even when a check above failed, so no run leaves a record behind.
      if (created) await removeApplication(page, appName);
    }
  });
});

async function removeApplication(page: Page, appName: string) {
  // If a check failed while the confirmation dialog was still open, close it first.
  const openDialogOk = page.getByRole('dialog').getByRole('button', { name: 'OK' });
  if (await openDialogOk.isVisible()) await openDialogOk.click();
  if (!/#\/application$/.test(page.url())) await openApplicationList(page);
  const row = await searchFor(page, appName, /^\s*1\s+to\s+1\s+of\s+1\s*$/);
  await row.getByRole('img', { name: 'Remove App' }).click();
  await page.getByRole('button', { name: 'Yes, delete it!' }).click();
  const deleted = page.getByRole('dialog', { name: 'Deleted!' });
  await expect(deleted).toBeVisible();
  await deleted.getByRole('button', { name: 'OK' }).click();
  await searchFor(page, appName, /^\s*0\s+to\s+0\s+of\s+0\s*$/);
}
