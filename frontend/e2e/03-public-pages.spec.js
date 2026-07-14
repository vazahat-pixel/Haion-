import { test, expect } from '@playwright/test';

test.describe('QA E2E — Public surfaces', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/landing');
    await expect(page).toHaveURL(/\/landing/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('customer guest access page loads', async ({ page }) => {
    await page.goto('/customer/access');
    await expect(page).toHaveURL(/\/customer\/access/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('public complaint page loads', async ({ page }) => {
    await page.goto('/support/complaint');
    await expect(page).toHaveURL(/\/support\/complaint/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('warranty check page loads', async ({ page }) => {
    await page.goto('/warranty/check');
    await expect(page).toHaveURL(/\/warranty\/check/);
    await expect(page.locator('body')).toBeVisible();
  });
});
