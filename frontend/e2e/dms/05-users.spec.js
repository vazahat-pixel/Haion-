/**
 * Admin/Users follows the reference flow: two-column add form (User Name, Password, User Type with code, Mobile No.,
 * Email-Id, Status Activate/Deactivate, Profile Img.), list with History, edit with "Update Rights", the
 * "Update User Permission" tabs, and a history of changes. Brand rights limit the products the user is offered.
 */
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { login, ROLES, SHOTS, ensureDir, DEMO_PASSWORD } from './helpers.js';

const EVID = path.join(SHOTS, '..', 'compare');
ensureDir(EVID);
// 1x1 PNG
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const api = (page, url, opts = {}) => page.evaluate(async ([u, o]) => {
  const t = JSON.parse(localStorage.getItem('erp:auth') || '{}').state?.accessToken;
  const r = await fetch(`/api/dms${u}`, { ...o, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` } });
  return { status: r.status, body: await r.json().catch(() => null) };
}, [url, opts]);

test('Admin/Users: reference form, Update Rights tabs, history, brand rights', async ({ page, browser }) => {
  test.setTimeout(180_000);
  await login(page, ROLES.admin);
  const stamp = Date.now().toString().slice(-6);
  const email = `e2e.user${stamp}@demo.haion.local`;

  // add form
  await page.goto('/distributor/masters/users/new');
  await expect(page.getByRole('heading', { name: 'Admin/Users Details' })).toBeVisible();
  const form = page.locator('form');
  await form.locator('label:text-is("User Name") + input').fill(`E2E User ${stamp}`);
  await form.locator('label:text-is("Password") + input').fill(DEMO_PASSWORD);
  const type = form.locator('label:text-is("User Type") + select');
  await expect(type.locator('option')).toContainText(['--Please Select--', 'Admin ( ADMIN )', 'Sales Head ( SLH )', 'Location User ( USER )', 'ISP/ISD ( ISP )', 'Director ( DIR )', 'Employee ( EMP )']);
  await type.selectOption('Sales Executive');
  await form.locator('label:text-is("Mobile No.") + input').fill(`9${stamp}123`.slice(0, 10));
  await form.locator('label:text-is("Email-Id") + input').fill(email);
  await expect(form.locator('label:text-is("Status") + select option')).toHaveText(['Activate', 'Deactivate']);
  await expect(form.getByText('Use (220px X 220px) Image Only')).toBeVisible();
  await form.locator('input[type=file]').setInputFiles({ name: 'p.png', mimeType: 'image/png', buffer: PNG });
  await expect(form.locator('img.dms-profile-img')).toBeVisible();
  const locSel = form.locator('label:text-is("Location") + select');
  await locSel.selectOption({ index: 1 });
  await page.screenshot({ path: path.join(EVID, 'users-add.local.png'), fullPage: true });
  await form.getByRole('button', { name: 'ADD', exact: true }).click();
  await expect(page).toHaveURL(/\/distributor\/masters\/users$/);

  // list columns as the reference
  await expect(page.locator('table thead th')).toHaveText(['S.No', 'Login Id', 'User Name', 'User Type', 'Phone No.', 'Email-id', 'Status', 'View/Edit', 'History'].map((t) => new RegExp(`^${t.replace(/[.]/g, '\\.')}`)));
  const created = (await api(page, `/users?search=${encodeURIComponent(`E2E User ${stamp}`)}`)).body.data[0];
  expect(created.userType).toBe('Sales Executive');

  // edit: User Id shown, Update Rights button
  await page.goto(`/distributor/masters/users/${created._id}`);
  await expect(page.locator('label:text-is("User Id") + input')).toHaveValue(created.loginId);
  await page.getByRole('link', { name: 'Update Rights' }).click();
  await expect(page.getByRole('heading', { name: 'Update User Permission' })).toBeVisible();
  await expect(page.locator('.dms-perm-user')).toHaveText(`E2E User ${stamp} (${created.loginId})`);
  await expect(page.getByRole('tab')).toHaveText(['Master / Region', 'Processes', 'Locations', 'Product Category', 'Brand'].map((t) => new RegExp(t)));
  await expect(page.locator('.dms-perm-group h4')).toContainText(['Dashboard', 'Master Management', 'Report Master', 'Region']);
  await page.getByLabel('Inventory', { exact: true }).first().check();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('tab', { name: /Processes/ })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: /Brand/ }).click();
  const brands = (await api(page, '/lookups')).body.data.brands;
  await page.getByLabel(brands[0].name, { exact: true }).check();
  await page.screenshot({ path: path.join(EVID, 'users-permission.local.png'), fullPage: true });
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('.dms-alert.ok')).toHaveText('Rights updated successfully');
  const after = (await api(page, `/users/${created._id}`)).body.data;
  expect(after.pages).toContain('dash_inventory');
  expect(after.scopes.brands.map(String)).toEqual([brands[0]._id]);

  // history
  await page.goto(`/distributor/masters/users/${created._id}/history`);
  await expect(page.locator('table tbody')).toContainText('Created');
  await expect(page.locator('table tbody')).toContainText('Updated: Rights, Region / Location / Category / Brand');

  // brand rights limit the products this user is offered
  const userPage = await browser.newPage();
  await login(userPage, email);
  const prods = (await api(userPage, '/lookups')).body.data.products;
  expect(prods.length).toBeGreaterThan(0);
  expect(prods.every((p) => String(p.brand) === brands[0]._id)).toBe(true);
});
