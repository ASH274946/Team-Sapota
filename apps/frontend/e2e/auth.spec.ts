import { test, expect } from '@playwright/test';

/**
 * Critical journey: authentication.
 * Uses storageState from globalSetup for the student role where useful, but the
 * first two tests exercise the full login form (success + wrong password).
 */

test.describe('Auth', () => {
  test('logs in successfully with valid credentials and lands on the dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[placeholder="Email"]', 'student@vidyaai.com');
    await page.fill('input[placeholder="Password"]', 'Student@123');
    await page.click('button:has-text("Sign in")');

    // Successful login redirects to the student dashboard.
    await page.waitForURL('**/dashboard/student**', { timeout: 30_000 });
    await expect(page).toHaveURL(/dashboard\/student/);
  });

  test('shows an error and stays on /login with a wrong password', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[placeholder="Email"]', 'student@vidyaai.com');
    await page.fill('input[placeholder="Password"]', 'DefinitelyWrong@123');
    await page.click('button:has-text("Sign in")');

    // Must NOT reach the dashboard — still on the login page.
    await page.waitForTimeout(1_500);
    await expect(page).toHaveURL(/login/);
    await expect(page).not.toHaveURL(/dashboard/);

    // An error toast/message should be visible (enumeration-safe generic message).
    // react-hot-toast renders into a portal; assert at least one toast is present.
    const toast = page.locator('text=Invalid email or password').first();
    await expect(toast).toBeVisible();
  });

  test('blocks access to the dashboard when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/student');
    // Unauthenticated users are bounced back to /login.
    await page.waitForURL('**/login**', { timeout: 30_000 });
    await expect(page).toHaveURL(/login/);
  });
});
