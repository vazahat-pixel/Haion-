/** "Receive Stock By Scanning": a serial that is not on the invoice is refused; a scanned serial counts as OK. */
import { test, expect } from '@playwright/test';
import { login, ROLES } from './helpers.js';

const api = (page, url) => page.evaluate(async (u) => {
  const t = JSON.parse(localStorage.getItem('erp:auth') || '{}').state?.accessToken;
  return (await fetch(`/api/dms${u}`, { headers: { Authorization: `Bearer ${t}` } })).json();
}, url);

test('receive by scanning checks serials against the invoice', async ({ page }) => {
  await login(page, ROLES.admin);
  const list = (await api(page, '/invoices?queue=receive&perPage=100')).data || [];
  let doc = null;
  for (const d of list) {
    const full = (await api(page, `/invoices/${d._id}`)).data;
    if (full?.lines?.some((l) => l.serials?.length)) { doc = full; break; }
  }
  test.skip(!doc, 'no pending invoice with serial numbers in the demo data');
  const lineIdx = doc.lines.findIndex((l) => l.serials?.length);
  await page.goto(`/distributor/doc/${doc._id}/receive?scan=1`);
  const scan = page.getByLabel('Scan Serial No.');
  await scan.fill('NOT-A-SERIAL-123');
  await scan.press('Enter');
  await expect(page.locator('.dms-alert')).toContainText('is not on this invoice');
  await scan.fill(doc.lines[lineIdx].serials[0]);
  await scan.press('Enter');
  const okInput = page.locator('.dms-table tbody tr').nth(lineIdx).locator('input').first();
  await expect(okInput).toHaveValue('1');
  await scan.fill(doc.lines[lineIdx].serials[0]);
  await scan.press('Enter');
  await expect(page.locator('.dms-alert')).toContainText('already scanned');
});
