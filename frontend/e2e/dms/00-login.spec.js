/** The Distributor panel has its own sign-in page at /distributor/login (separate from the Haion ERP login). */
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { DEMO_PASSWORD, SHOTS, ensureDir } from './helpers.js';

const EVID = path.join(SHOTS, 'login');
ensureDir(EVID);

test('signed-out visit to any Distributor page lands on the Distributor sign-in page, then returns there after login', async ({ page }) => {
  await page.goto('/distributor/login');
  await page.evaluate(() => localStorage.removeItem('erp:auth'));
  await page.goto('/distributor/reports/inventory');
  await expect(page).toHaveURL(/\/distributor\/login$/);
  await expect(page.getByRole('heading', { name: 'Sign in to continue to DMS' })).toBeVisible();
  await page.screenshot({ path: path.join(EVID, '01-dms-login.png') });
  await page.getByLabel('USER ID').fill('DEUSRDLUP6'); // dealer Login ID from the demo seed
  await page.getByLabel('PASSWORD').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page).toHaveURL(/\/distributor\/reports\/inventory$/);
  await expect(page.locator('.dms-user')).toContainText('DEUSRDLUP6');
  await page.locator('.dms-menu').getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/distributor\/login$/);
});

test('wrong password shows an error and stays on the page; /dms is a short link to the sign-in page', async ({ page }) => {
  await page.goto('/dms');
  await expect(page).toHaveURL(/\/distributor\/login$/);
  await page.getByLabel('USER ID').fill('DEUSRDLUP6');
  await page.getByLabel('PASSWORD').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page.locator('.dms-login .dms-alert')).toBeVisible();
  await expect(page).toHaveURL(/\/distributor\/login$/);
  await page.goto('/distributor/login?expired=1');
  await expect(page.locator('.dms-login .dms-alert')).toContainText('Session Expired');
  await page.screenshot({ path: path.join(EVID, '02-dms-login-expired.png') });
});

test('domain root opens the Distributor; the old ERP home moved to /erp', async ({ page }) => {
  await page.goto('/distributor/login');
  await page.evaluate(() => localStorage.removeItem('erp:auth'));
  await page.goto('/');
  await expect(page).toHaveURL(/\/distributor\/login$/);
  await expect(page.getByRole('heading', { name: 'Sign in to continue to DMS' })).toBeVisible();
  await page.goto('/erp');
  await expect(page).toHaveURL(/\/auth\/login$/);
  await page.goto('/old');
  await expect(page).toHaveURL(/\/auth\/login$/);
});
