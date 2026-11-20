/** Every dashboard and report page opens with its title and without a browser error. */
import { test, expect } from '@playwright/test';
import { login, ROLES } from './helpers.js';

const PAGES = [
  'home', 'dashboard/yearly', 'dashboard/monthly', 'dashboard/inventory', 'dashboard/lead', 'dashboard/purchase', 'dashboard/sale',
  'reports/collection', 'reports/inventory', 'reports/aging', 'reports/isd', 'reports/party-ledger', 'reports/party-master', 'reports/payment',
  'reports/price-drop', 'reports/purchase', 'reports/return', 'reports/sale', 'reports/serial-activation', 'reports/stock-ledger', 'reports/vendor',
];

test('dashboards and reports open without errors', async ({ page }) => {
  test.setTimeout(300_000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(`${page.url()} :: ${String(e.message).slice(0, 200)}`));
  await login(page, ROLES.admin);
  for (const p of PAGES) {
    await page.goto(`/distributor/${p}`);
    // the home page has no title (as on the reference): its filters show it loaded
    await expect(p === 'home' ? page.getByRole('combobox', { name: 'Transaction type' }) : page.locator('.dms-main h1'), p).toBeVisible();
    await expect(page.locator('.dms-main'), p).not.toContainText('Unable to load data');
  }
  expect(errors).toEqual([]);
});

test('retail billing list has the reference columns in the reference order', async ({ page }) => {
  await login(page, ROLES.admin);
  await page.goto('/distributor/invoicing/retail');
  await expect(page.locator('.dms-table thead th')).toHaveText(['S.No', 'Billing From', 'Billing To', 'Invoice No.', 'Invoice Date', 'Status', 'Print', 'IMEI Attached', 'View', 'Cancel'].map((t) => new RegExp(`^${t.replace(/[.]/g, '\.')}`)));
});
