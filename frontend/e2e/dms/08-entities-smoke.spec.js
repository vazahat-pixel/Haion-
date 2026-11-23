/** Every generic record list and add page (Sale Force, General Query, App Transaction, HRMS) opens without errors. */
import { test, expect } from '@playwright/test';
import { login, ROLES } from './helpers.js';

const TYPES = ['lead', 'quote', 'target', 'pjp', 'expense', 'query', 'appfeedback', 'apptask', 'track', 'tada', 'department', 'designation', 'holiday',
  'leavetype', 'employee', 'leave', 'application', 'claim', 'activity', 'notice', 'policy', 'project', 'resign', 'mydoc'];

test('record lists and add forms open without errors', async ({ page }) => {
  test.setTimeout(300_000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(`${page.url()} :: ${String(e.message).slice(0, 200)}`));
  await login(page, ROLES.admin);
  for (const t of TYPES) {
    await page.goto(`/distributor/e/${t}`);
    await expect(page.locator('.dms-main h1'), t).toBeVisible();
    await expect(page.locator('.dms-main'), t).not.toContainText('Unable to load data');
  }
  for (const t of ['lead', 'quote', 'target', 'expense', 'claim', 'employee', 'application', 'mydoc']) {
    await page.goto(`/distributor/e/${t}/new`);
    await expect(page.locator('.dms-main form').first(), t).toBeVisible();
  }
  expect(errors).toEqual([]);
});
