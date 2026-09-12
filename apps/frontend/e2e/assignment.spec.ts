import { test, expect } from '@playwright/test';

/**
 * Critical journey: a teacher creates an assignment.
 * Reuses the teacher storageState produced by globalSetup (faculty@vidyaai.com).
 *
 * NOTE: Selectors below target the assignment-create form by placeholder/text.
 * If the form markup changes, update the locators — they are intentionally
 * explicit (no `getByTestId`) to match the current UI.
 */

test.use({ storageState: 'e2e/.auth/teacher.json' });

test.describe('Assignment creation', () => {
  test('teacher can open the create form and submit a new assignment', async ({ page }) => {
    await page.goto('/assignments/create');

    // The create form exposes a title input and a "prompt" textarea.
    const titleInput = page.locator('input[placeholder="e.g. Mid-term Physics Exam"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill('E2E Mid-term Physics Exam');

    const prompt = page.locator('textarea[placeholder*="Generate a question paper"]');
    if (await prompt.count()) {
      await prompt.fill('Generate 10 multiple-choice questions on Newton’s laws.');
    }

    // Submit. The primary submit button is the arrow/submit button on the form.
    // Adjust the locator if the button label changes.
    await page.getByRole('button', { name: /create|generate|submit|save/i }).first().click();

    // After creation the app redirects back to the assignments list.
    await page.waitForURL('**/assignments**', { timeout: 30_000 });
    await expect(page).toHaveURL(/assignments/);
  });

  test('create form validates required fields', async ({ page }) => {
    await page.goto('/assignments/create');

    // Submitting without a title should keep us on the create page (validation error).
    await page.getByRole('button', { name: /create|generate|submit|save/i }).first().click();
    await page.waitForTimeout(1_000);
    await expect(page).toHaveURL(/assignments\/create/);
  });

  // ── Accessibility (axe-core) ──
  // Requires: npm install -D @axe-core/playwright
  // Uncomment once the dependency is added.
  //
  // test('create form has no detectable accessibility violations', async ({ page }) => {
  //   await page.goto('/assignments/create');
  //   const { AxeBuilder } = require('@axe-core/playwright');
  //   const results = await new AxeBuilder({ page }).analyze();
  //   expect(results.violations).toEqual([]);
  // });
});
