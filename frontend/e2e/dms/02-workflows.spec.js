/**
 * Real user workflows through the UI, across roles, on the seeded demo data.
 * Every step is done by clicking/typing in the app; numbers are cross-checked through the API afterwards.
 */
import path from 'node:path';
import fs from 'node:fs';
import ExcelJS from 'exceljs';
import { test, expect } from '@playwright/test';
import { login, ROLES, SHOTS, ensureDir, field } from './helpers.js';

const EVID = path.join(SHOTS, 'workflows');
ensureDir(EVID);
const shot = (page, name) => page.screenshot({ path: path.join(EVID, `${name}.png`), fullPage: false });
const api = (page, url, opts = {}) => page.evaluate(async ([u, o]) => {
  const t = JSON.parse(localStorage.getItem('erp:auth') || '{}').state?.accessToken;
  const r = await fetch(`/api/dms${u}`, { ...o, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` } });
  return { status: r.status, body: await r.json().catch(() => null) };
}, [url, opts]);
async function selectByText(select, text) {
  const value = await select.evaluate((el, t) => [...el.options].find((o) => o.text.includes(t))?.value, text);
  if (!value) throw new Error(`option containing "${text}" not found`);
  await select.selectOption(value);
}
const okQty = async (page, location, code) => {
  const r = await api(page, `/reports/inventory?location=${location}`);
  return r.body.data.find((x) => x.productCode === code)?.okQty || 0;
};

test.describe.serial('PO → approval → invoice → dispatch → receive → stock & ledger', () => {
  const ctx = {};
  test('dealer raises a PO from the UI', async ({ page }) => {
    await login(page, ROLES.dealer);
    const me = (await api(page, '/me')).body.data;
    ctx.dealerLoc = me.location._id;
    ctx.before = await okQty(page, ctx.dealerLoc, 'CH-20W');
    await page.goto('/distributor/purchase/po/new');
    await selectByText(field(page, 'Purhase Order From').locator('select'), 'Krishna Mobiles');
    await page.getByRole('button', { name: 'Use parent location' }).click();
    await selectByText(page.getByLabel('Product row 1'), 'CH-20W');
    await page.getByLabel('Qty row 1').fill('5');
    await page.getByLabel('Price row 1').fill('540');
    await expect(field(page, 'Delivery Address').locator('textarea')).not.toHaveValue('');
    await shot(page, '01-dealer-po-form');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page).toHaveURL(/\/distributor\/purchase\/po$/);
    const firstRow = page.locator('.dms-table tbody tr').first();
    await expect(firstRow).toContainText('PFA');
    ctx.poNo = (await firstRow.locator('td').nth(3).innerText()).trim();
    expect(ctx.poNo).toMatch(/^DEDLUP001PO\d+$/);
    await shot(page, '02-dealer-po-list-pfa');
  });

  test('branch approves, invoices and dispatches it', async ({ page }) => {
    await login(page, ROLES.branch);
    await page.goto('/distributor/purchase/po-approval');
    await page.getByLabel('Search').fill(ctx.poNo);
    const row = page.locator('.dms-table tbody tr', { hasText: ctx.poNo });
    await row.locator('a[href*="/approve"]').click();
    await field(page, 'Remark').locator('textarea').fill('Approved in E2E');
    await page.getByRole('button', { name: 'Update', exact: true }).click();
    await expect(page).toHaveURL(/po-approval/);
    await page.goto('/distributor/invoicing/corporate');
    await page.getByLabel('Search').fill(ctx.poNo);
    await page.locator('.dms-table tbody tr', { hasText: ctx.poNo }).getByRole('link', { name: 'Process' }).click();
    await expect(page.locator('.dms-title')).toContainText('Corporate Invoicing against PO');
    await shot(page, '03-branch-invoice-against-po');
    await page.getByRole('button', { name: 'Process' }).click();
    await expect(page).toHaveURL(/\/distributor\/doc\/[a-f0-9]{24}$/);
    ctx.invId = page.url().split('/').pop();
    const inv = (await api(page, `/invoices/${ctx.invId}`)).body.data;
    expect(inv.invoiceNo).toMatch(/^AGR\/\d{2}-\d{2}\/\d{4}$/);
    expect(inv.grandTotal).toBeGreaterThan(0);
    ctx.inv = inv;
    await shot(page, '04-branch-invoice-created');
    await page.goto(`/distributor/doc/${ctx.invId}/dispatch`);
    await selectByText(field(page, 'Logistic Name').locator('select'), 'DTDC');
    await field(page, 'Docket No.').locator('input').fill('E2E-DKT-1');
    await field(page, 'Logistic Person').locator('input').fill('E2E Driver');
    await field(page, 'Transportation Mode').locator('select').selectOption('By Road');
    await field(page, 'Contact No.').locator('input').fill('9000000999');
    await field(page, 'Carrier No.').locator('input').fill('UP80E2E1');
    await field(page, 'Remark').locator('textarea').fill('Dispatched in E2E');
    await page.getByRole('button', { name: 'Update', exact: true }).click();
    await expect(page).toHaveURL(/logistic\/dispatch/);
    expect((await api(page, `/invoices/${ctx.invId}`)).body.data.status).toBe('Dispatched');
    const led = (await api(page, `/reports/party-ledger?location=${inv.from.location}&from=2000-01-01`)).body.data;
    expect(led.rows.some((r) => r.docNo === inv.invoiceNo && r.dr === inv.grandTotal)).toBe(true);
  });

  test('dealer receives; stock increases by exactly the billed qty', async ({ page }) => {
    await login(page, ROLES.dealer);
    await page.goto(`/distributor/doc/${ctx.invId}/receive`);
    await page.locator('textarea').last().fill('Received in E2E');
    await shot(page, '05-dealer-receive');
    await page.getByRole('button', { name: 'Receive', exact: true }).click();
    await expect(page).toHaveURL(/receive\/location/);
    expect((await api(page, `/invoices/${ctx.invId}`)).body.data.status).toBe('Received');
    expect(await okQty(page, ctx.dealerLoc, 'CH-20W')).toBe(ctx.before + 5);
  });
});

test('dealer cannot reach Master Management even by typing the URL', async ({ page }) => {
  await login(page, ROLES.dealer);
  // the dealer holds only the Customer Master right: that is the one master item it may see
  await page.locator('.dms-menu > li > button.dms-mi', { hasText: 'Master Management' }).click();
  const sub = page.locator('.dms-menu > li.open .dms-sub a');
  await expect(sub).toHaveText(['Customer Master']);
  await page.goto('/distributor/masters/brand');
  await expect(page.locator('.dms-alert')).toContainText(/permission/i);
  expect((await api(page, '/masters/brand')).status).toBe(403);
  await shot(page, '06-dealer-master-denied');
});

test('report export produces a real .xlsx with the same rows as the screen', async ({ page }) => {
  await login(page, ROLES.admin);
  await page.goto('/distributor/reports/purchase');
  await page.locator('.dms-filter input[type=date]').first().fill('2026-10-01');
  await page.getByRole('button', { name: 'GO', exact: true }).click();
  await expect(page.locator('.dms-table tbody tr').first()).not.toContainText(/Loading|No data/);
  const shown = await page.locator('.dms-dt-bottom').innerText();
  const total = Number((shown.match(/of (\d+) entries/) || [])[1]);
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export to Excel' }).click()]);
  const file = path.join(EVID, 'purchase_report.xlsx');
  await download.saveAs(file);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const ws = wb.worksheets[0];
  const header = ws.getRow(3).values.slice(1);
  expect(header).toContain('PO No.');
  expect(ws.rowCount - 3).toBe(total);
});

test('Excel upload is all-or-nothing with row-level errors, then succeeds with a clean file', async ({ page }) => {
  await login(page, ROLES.admin);
  const ho = (await api(page, '/lookups')).body.data.locations.find((l) => l.locationType === 'Head Office');
  const countBefore = (await api(page, '/invoices?kind=OPENING&perPage=1')).body.pagination.total;
  const make = async (name, rows) => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Data');
    ws.addRow(['productCode', 'okQty', 'damageQty', 'missingQty', 'price', 'serials']);
    rows.forEach((r) => ws.addRow(r));
    const f = path.join(EVID, name);
    await wb.xlsx.writeFile(f);
    return f;
  };
  await page.goto('/distributor/upload/OPENING');
  await selectByText(field(page, 'Location').locator('select'), ho.name);
  await field(page, 'Attach File').locator('input[type=file]').setInputFiles(await make('opening_bad.xlsx', [['CH-20W', 3, 0, 0, 400, ''], ['NOPE-1', 2, 0, 0, 10, ''], ['PH-X1', 2, 0, 0, 9000, 'ONLYONE']]));
  await expect(page.locator('.dms-alert').last()).toContainText('Row 3: Unknown product code');
  await expect(page.locator('.dms-alert').last()).toContainText('Row 4: PH-X1 is serial-tracked');
  await shot(page, '07-upload-row-errors');
  await page.getByRole('button', { name: 'Upload', exact: true }).click();
  expect((await api(page, '/invoices?kind=OPENING&perPage=1')).body.pagination.total).toBe(countBefore);
  await field(page, 'Attach File').locator('input[type=file]').setInputFiles(await make('opening_good.xlsx', [['CH-20W', 3, 1, 0, 400, ''], ['CB-C1', 4, 0, 0, 150, '']]));
  await expect(page.getByText('2 valid row(s), total qty 8')).toBeVisible();
  await page.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(page).toHaveURL(/\/distributor\/doc\/[a-f0-9]{24}$/);
  await expect(page.locator('.dms-panel').first()).toContainText(/OPN\/\d{2}-\d{2}\/HQN\/\d{4}/);
  expect((await api(page, '/invoices?kind=OPENING&perPage=1')).body.pagination.total).toBe(countBefore + 1);
  await shot(page, '08-upload-success');
});

test('lead: dealer creates, branch approves, status and log update', async ({ page, browser }) => {
  await login(page, ROLES.dealer);
  await page.goto('/distributor/e/lead/new');
  await field(page, 'Party Name').locator('input').fill('E2E Mobile World');
  await field(page, 'City').locator('input').fill('Agra');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page).toHaveURL(/\/distributor\/e\/lead$/);
  const row = page.locator('.dms-table tbody tr', { hasText: 'E2E Mobile World' }).first();
  await expect(row).toContainText('Open');
  const href = await row.locator('a[href*="/e/lead/"]').first().getAttribute('href');
  const p2 = await browser.newPage();
  await login(p2, ROLES.branch);
  await p2.goto(href);
  await p2.locator('.dms-form select').first().selectOption('approve');
  await p2.locator('.dms-form textarea').fill('Approved in E2E');
  await p2.getByRole('button', { name: 'Update', exact: true }).click();
  await expect(p2.locator('.dms-panel').first()).toContainText('Approve');
  await expect(p2.locator('.dms-panel', { hasText: 'Action Log' })).toContainText('Approved in E2E');
  await shot(p2, '09-lead-approved');
});
