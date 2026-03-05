import { test, expect } from '@playwright/test';

const USER_EMAIL = process.env.NEXT_PUBLIC_DEV_ONLY_USER_USERNAME ?? 'matt@twinleaf.studio';
const USER_PASSWORD = process.env.NEXT_PUBLIC_DEV_ONLY_USER_PASSWORD ?? 'password';

test.describe('Focus Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', USER_EMAIL);
    await page.fill('input[name="password"]', USER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/user/dashboard', { timeout: 15_000 });
    await expect(page.getByText(/of \d+/)).toBeVisible({ timeout: 10_000 });
  });

  test('all focus tab sections are visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Listen Now/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Daily Intention/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Evening Review/i })).toBeVisible();
    await expect(page.locator('textarea[placeholder*="What happened today"]')).toBeVisible();
  });

  test('Listen Now button plays audio', async ({ page }) => {
    const listenButton = page.getByRole('button', { name: /Listen Now/i });
    await expect(listenButton).toBeVisible();
    await listenButton.click();
    await expect(page.getByRole('button', { name: /Pause/i })).toBeVisible({ timeout: 5_000 });
  });

  test('evening review checkbox toggles and count updates', async ({ page }) => {
    const countContainer = page.getByText(/of \d+/).locator('..');
    const getCompleted = async () => {
      const text = await countContainer.textContent();
      return parseInt(text.match(/(\d+)\s*of/)?.[1] ?? '-1');
    };

    const before = await getCompleted();

    const eveningCheckbox = page.getByRole('heading', { name: /Evening Review/i })
      .locator('xpath=../../button');
    await eveningCheckbox.click();
    await page.waitForTimeout(1000);

    const after = await getCompleted();
    expect(after).not.toBe(before);
  });

  test('daily intention modal saves', async ({ page }) => {
    const intentionHeading = page.getByRole('heading', { name: /Daily Intention/i });
    await intentionHeading.click();

    await expect(page.getByText(/Set Your Intention/i)).toBeVisible({ timeout: 3_000 });

    await page.fill('textarea[placeholder*="Meetings"]', 'Test obstacles');
    await page.fill('input[placeholder*="Peace"]', 'Focus');

    await page.getByRole('button', { name: /Set Intention/i }).click();

    await expect(page.getByText(/Set Your Intention/i)).toBeHidden({ timeout: 5_000 });
  });

  test('day notes can be saved', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="What happened today"]');
    await textarea.scrollIntoViewIfNeeded();

    const testNote = `Test note ${Date.now()}`;
    await textarea.fill(testNote);

    const saveButton = page.getByRole('button', { name: /Save Notes/i });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    await expect(page.getByText('Notes saved successfully')).toBeVisible({ timeout: 5_000 });
  });
});
