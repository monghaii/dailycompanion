import { test, expect } from '@playwright/test';

const USER_EMAIL = process.env.NEXT_PUBLIC_DEV_ONLY_USER_USERNAME ?? 'matt@twinleaf.studio';
const USER_PASSWORD = process.env.NEXT_PUBLIC_DEV_ONLY_USER_PASSWORD ?? 'password';
const COACH_EMAIL = process.env.NEXT_PUBLIC_DEV_ONLY_COACH_USERNAME ?? 'hello@twinleaf.studio';
const COACH_PASSWORD = process.env.NEXT_PUBLIC_DEV_ONLY_COACH_PASSWORD ?? 'password';

test('end user can login', async ({ page }) => {
  await page.goto('/login');

  await page.fill('input[name="email"]', USER_EMAIL);
  await page.fill('input[name="password"]', USER_PASSWORD);
  await page.click('button[type="submit"]');

  await page.waitForURL('**/user/dashboard', { timeout: 15_000 });
  await expect(page).toHaveURL(/\/user\/dashboard/);
});

test('coach can login', async ({ page }) => {
  await page.goto('/coach/login');

  await page.fill('input[name="email"]', COACH_EMAIL);
  await page.fill('input[name="password"]', COACH_PASSWORD);
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard', { timeout: 15_000 });
  await expect(page).toHaveURL(/\/dashboard/);
});
