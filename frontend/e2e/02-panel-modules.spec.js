import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.js';

test.describe('QA E2E — Admin panel modules', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, { email: 'admin@haion.com', password: 'password' });
    await page.waitForURL('**/admin/dashboard**');
  });

  const adminRoutes = [
    { path: '/admin/inventory', label: /inventory/i },
    { path: '/admin/dispatch', label: /dispatch/i },
    { path: '/admin/grn', label: /grn|goods/i },
    { path: '/admin/dealers', label: /dealer/i },
    { path: '/admin/store-orders', label: /website orders|orders/i },
    { path: '/admin/cms', label: /cms|website/i },
  ];

  for (const route of adminRoutes) {
    test(`admin navigates to ${route.path}`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page).toHaveURL(new RegExp(route.path.replace(/\//g, '\\/')));
      await expect(page.getByRole('heading', { name: route.label }).first()).toBeVisible({ timeout: 15_000 });
    });
  }
});

test.describe('QA E2E — Dealer panel modules', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, { email: 'dealer@haion.com', password: 'password' });
    await page.waitForURL('**/dealer/dashboard**');
  });

  const dealerRoutes = [
    { path: '/dealer/inventory', label: /inventory/i },
    { path: '/dealer/dispatches', label: /dispatch/i },
    { path: '/dealer/grn', label: /goods receipt/i },
    { path: '/dealer/billing', label: /billing/i },
    { path: '/dealer/warranty', label: /warranty/i },
  ];

  for (const route of dealerRoutes) {
    test(`dealer navigates to ${route.path}`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page).toHaveURL(new RegExp(route.path.replace(/\//g, '\\/')));
      await expect(page.getByRole('heading', { name: route.label }).first()).toBeVisible({ timeout: 15_000 });
    });
  }
});
