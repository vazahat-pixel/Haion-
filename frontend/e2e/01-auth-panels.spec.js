import { test, expect } from '@playwright/test';
import { QA_USERS } from './fixtures/users.js';
import { loginAs } from './helpers/auth.js';

test.describe('QA E2E — Authentication & panel routing', () => {
  for (const user of QA_USERS) {
    test(`${user.key} logs in and lands on ${user.home}`, async ({ page }) => {
      await loginAs(page, user);
      await page.waitForURL(`**${user.home}**`, { timeout: 30_000 });
      await expect(page).toHaveURL(new RegExp(user.home.replace(/\//g, '\\/')));
      await expect(page.getByRole('heading', { name: user.heading }).first()).toBeVisible({ timeout: 15_000 });
    });
  }

  test('invalid login shows error', async ({ page }) => {
    await loginAs(page, { email: 'wrong@haion.com', password: 'badpass' });
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
