import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { streamInvoicePdf } from '../src/utils/invoicePdf.util.js';

const sampleInvoice = {
  invoiceNo: 'INV-TEST-001',
  billNo: 'BILL-001',
  customer: 'Test Customer',
  dealerName: 'Sharma Motors',
  dealerGstin: '08AABCS1429B1Z5',
  issuedAt: new Date().toISOString(),
  lineItems: [{ product: 'Motor 5HP', hsn: '8501', quantity: 2, unitPrice: 5000, amount: 10000 }],
  cgst: 900,
  sgst: 900,
  igst: 0,
  amount: 11800,
};

test('streamInvoicePdf writes PDF bytes', async () => {
  const stream = new PassThrough();
  const chunks = [];
  stream.on('data', (c) => chunks.push(c));
  const res = Object.assign(stream, { setHeader() {} });

  const done = new Promise((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('error', reject);
  });

  streamInvoicePdf(sampleInvoice, res);
  await done;

  const buf = Buffer.concat(chunks);
  assert.ok(buf.length > 100);
  assert.equal(buf.subarray(0, 4).toString(), '%PDF');
});
