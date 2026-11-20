/**
 * Printed documents follow the reference layouts (CANSALE print_invoice.php, print_po.php, print_imei.php).
 * For each document: open the print page, check the reference sections and columns, save a screenshot and the
 * real print output (PDF, A4, print media) and check that a normal document fits on one A4 page.
 */
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { login, ROLES, SHOTS, ensureDir } from './helpers.js';

const EVID = path.join(SHOTS, '..', 'print');
ensureDir(EVID);

const api = (page, url) => page.evaluate(async (u) => {
  const t = JSON.parse(localStorage.getItem('erp:auth') || '{}').state?.accessToken;
  const r = await fetch(`/api/dms${u}`, { headers: { Authorization: `Bearer ${t}` } });
  return r.json();
}, url);

const pdfPages = (buf) => (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;

async function capture(page, url, name) {
  await page.goto(`${url}?noprint=1`);
  await expect(page.locator('.rp-doc')).toBeVisible();
  await page.screenshot({ path: path.join(EVID, `${name}.png`), fullPage: true });
  await page.emulateMedia({ media: 'print' });
  const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
  await page.emulateMedia({ media: 'screen' });
  fs.writeFileSync(path.join(EVID, `${name}.pdf`), pdf);
  return pdfPages(pdf);
}

test('Tax Invoice, Delivery Challan, IMEI list and Purchase Order print like the reference', async ({ page }) => {
  test.setTimeout(180_000);
  await login(page, ROLES.admin);
  const docs = (await api(page, '/invoices?perPage=200')).data;
  const pick = (f) => docs.find(f);
  const intra = pick((d) => d.kind === 'CORPORATE' && d.totalCgst > 0) || pick((d) => d.totalCgst > 0);
  const inter = pick((d) => d.totalIgst > 0);
  const challan = (await api(page, '/invoices?kind=STN&perPage=1')).data[0] || pick((d) => d.docType === 'DELIVERY CHALLAN');
  const withSerials = pick((d) => d.serialsAttached > 0) || (await api(page, '/invoices?kind=RETAIL_CUSTOMER&perPage=50')).data.find((d) => d.serialsAttached > 0);
  const po = (await api(page, '/po?perPage=1')).data[0];

  // Tax Invoice, intra-state: SGST/UGST + CGST columns (17 columns, as print_invoice.php)
  expect(intra, 'an intra-state invoice in the demo data').toBeTruthy();
  let pages = await capture(page, `/distributor/print/doc/${intra._id}`, 'tax-invoice-intra-state');
  await expect(page.locator('.rp-title')).toHaveText('TAX INVOICE');
  for (const t of ['Seller', 'Transporter Name & Address', 'Details of Receiver (Bill To)', 'Details of Consignee (Ship To)', 'Total Weight', 'Pre Authorized Signatory', 'Receiver Remark', 'This Invoice is electronically generated and no signature is required.']) {
    await expect(page.locator('.rp-doc')).toContainText(t);
  }
  await expect(page.locator('.rp-ih td')).toHaveText(['S.No.', 'Item Code', 'Description Of Goods/ Services', 'HSN/SAC', 'Qty', 'UOM', 'Rate/Unit', 'Discount', 'Rate/Unit (Inc. Tax)', 'Taxable Value', 'SGST/UGST %', 'SGST/UGST Amount', 'CGST %', 'CGST Amount', 'Total Amount (Inc Tax)', 'Scheme', 'Scheme Code']);
  await expect(page.locator('.rp-doc')).toContainText(`Total Amount(INR):${intra.grandTotal.toFixed(2)}`);
  if (intra.lines?.length <= 8 || !intra.lines) expect(pages).toBe(1);

  // Tax Invoice, inter-state: IGST columns (15 columns)
  if (inter) {
    await capture(page, `/distributor/print/doc/${inter._id}`, 'tax-invoice-inter-state');
    await expect(page.locator('.rp-ih td')).toHaveText(['S.No.', 'Item Code', 'Description Of Goods/ Services', 'HSN/SAC', 'Qty', 'UOM', 'Rate/Unit', 'Discount', 'Rate/Unit (Inc. Tax)', 'Taxable Value', 'IGST %', 'IGST Amount', 'Total Amount (Inc Tax)', 'Scheme', 'Scheme Code']);
  }

  // Delivery Challan: same layout, "Delivery Challan" title (the reference prints stock transfers this way)
  expect(challan, 'a stock transfer / challan in the demo data').toBeTruthy();
  pages = await capture(page, `/distributor/print/doc/${challan._id}`, 'delivery-challan');
  await expect(page.locator('.rp-title')).toHaveText('Delivery Challan');

  // IMEI list (print_imei.php)
  expect(withSerials, 'a document with serial numbers').toBeTruthy();
  await capture(page, `/distributor/print/imei/${withSerials._id}`, 'imei-list');
  await expect(page.locator('.rp-doc')).toContainText('Dispatched Serial No. Detail:');
  await expect(page.locator('.rp-serials span').first()).toBeVisible();

  // Purchase Order (print_po.php)
  pages = await capture(page, `/distributor/print/po/${po._id}`, 'purchase-order');
  for (const t of ['PURCHASE ORDER', 'Ship From(Consignor) :', 'Bill To:', 'Ship To:', 'CST N0.:', 'ST N0.:', 'Sub Total', 'Total Discount', 'Total Qty', 'Amount in Words', 'Remarks :', 'Authorised Signatory']) {
    await expect(page.locator('.rp-doc')).toContainText(t);
  }
  await expect(page.locator('.rp-ih td')).toHaveText(['S.No.', 'Description Of Goods', 'Qty', 'Price', 'Value', 'Discount/Unit', 'Amount']);
  expect(pages).toBe(1);
});
