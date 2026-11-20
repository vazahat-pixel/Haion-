/** Every master list and add page opens without a browser error (reference master layouts). */
import { test, expect } from '@playwright/test';
import { login, ROLES } from './helpers.js';

const KEYS = ['account', 'brand', 'city', 'color', 'coupon', 'courier', 'customers', 'locations', 'othertax', 'parameter', 'prices', 'category', 'productdelivery',
  'productimage', 'products', 'subcategory', 'schemes', 'specification', 'state', 'hsn', 'vendors'];

test('master list and add pages open without errors', async ({ page }) => {
  test.setTimeout(300_000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(`${page.url()} :: ${String(e.message).slice(0, 200)}`));
  await login(page, ROLES.admin);
  for (const k of KEYS) {
    await page.goto(`/distributor/masters/${k}`);
    await expect(page.locator('.dms-main h1')).toBeVisible();
    await page.goto(`/distributor/masters/${k}/new`);
    await expect(page.locator('.dms-main form').first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});
