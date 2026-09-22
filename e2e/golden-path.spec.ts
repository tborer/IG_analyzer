import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';

const PHOTO = path.resolve(__dirname, 'fixtures/test-photo.jpg');

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

// One continuous user journey, per §3.3 -- later scenarios (history,
// password change, the free-token limit) depend on state created by
// earlier ones in the same run, same as a real user's session.
test.describe.serial('golden path', () => {
  const email = uniqueEmail('e2e');
  const password = 'originalPassword123';
  const newPassword = 'updatedPassword456';
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('1. signup redirects to the dashboard', async () => {
    await page.goto('/signup');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page).toHaveTitle(/New audit/);
  });

  test('2. submitting an audit renders a scored result', async () => {
    await page.getByLabel('Extra text context (optional)').fill('Fixture bio for the E2E run.');
    await page.locator('input[type="file"]').setInputFiles(PHOTO);
    await expect(page.getByText('Screenshots (1/12)')).toBeVisible();

    await page.getByRole('button', { name: 'Run the audit' }).click();

    await expect(page.getByText('E2E fixture result')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Fixture top action.')).toBeVisible();
  });

  test('3. the audit appears in history', async () => {
    await page.goto('/dashboard/history');
    await expect(page).toHaveTitle(/Past audits/);
    await expect(page.getByText('E2E fixture result')).toBeVisible();
  });

  test('4. changing password works, and the old password stops working', async () => {
    await page.goto('/dashboard/settings');
    await expect(page).toHaveTitle(/Settings/);

    await page.getByLabel('Current password').fill(password);
    await page.getByLabel('New password').fill(newPassword);
    await page.getByRole('button', { name: 'Update password' }).click();
    await expect(page.getByText('Password updated.')).toBeVisible();

    // §1.4: changing password signs out every other session -- the current
    // one should still be valid, so the dashboard must still be reachable.
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);

    // A real integration check on lib/auth.ts's bcrypt comparison: log out,
    // then confirm the OLD password is genuinely rejected, not just
    // client-side stale state.
    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByText('Incorrect email or password.')).toBeVisible();

    await page.getByLabel('Password').fill(newPassword);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('5. running out of free tokens shows the 429 UX with an upgrade link', async () => {
    // This user already used their one free token in scenario 2.
    await page.goto('/dashboard');
    await page.locator('input[type="file"]').setInputFiles(PHOTO);
    await expect(page.getByText('Screenshots (1/12)')).toBeVisible();
    await page.getByRole('button', { name: 'Run the audit' }).click();

    await expect(page.getByText(/used your free token/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Upgrade for more audits' })).toBeVisible();
  });

  test('6. logout clears the session and /dashboard redirects to /login', async () => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });
});
