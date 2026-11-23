/**
 * Screenshots of local pages for side-by-side comparison with the reference (evidence in
 * reference-audit/final-screenshots/compare/). Set COMPARE_PAGES="po,users-add" to limit the run.
 */
import path from 'node:path';
import { test } from '@playwright/test';
import { login, ROLES, SHOTS, ensureDir } from './helpers.js';

const OUT = path.join(SHOTS, '..', 'compare');
ensureDir(OUT);

export const COMPARE = {
  home: '/distributor/home',
  'dashboard-po': '/distributor/dashboard/purchase',
  po: '/distributor/purchase/po',
  'po-add': '/distributor/purchase/po/new',
  users: '/distributor/masters/users',
  'users-add': '/distributor/masters/users/new',
  corporate: '/distributor/invoicing/corporate',
  retail: '/distributor/invoicing/retail',
  dispatch: '/distributor/logistic/dispatch',
};

test('local screenshots for reference comparison', async ({ page }) => {
  test.setTimeout(300_000);
  const only = (process.env.COMPARE_PAGES || '').split(',').filter(Boolean);
  await login(page, ROLES.admin);
  for (const [name, url] of Object.entries(COMPARE)) {
    if (only.length && !only.includes(name)) continue;
    await page.goto(url);
    await page.locator('.dms-loading').first().waitFor({ state: 'detached', timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT, `${name}.local.png`) });
  }
});
