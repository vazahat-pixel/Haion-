import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractStateCodeFromGSTIN,
  isInterState,
  calculateLineGST,
  calculateInvoiceTotals,
} from '../src/utils/gst.util.js';

test('extractStateCodeFromGSTIN returns first two chars', () => {
  assert.equal(extractStateCodeFromGSTIN('08AABCS1429B1Z5'), '08');
  assert.equal(extractStateCodeFromGSTIN(''), null);
});

test('isInterState compares state codes', () => {
  assert.equal(isInterState('08', '08'), false);
  assert.equal(isInterState('08', '27'), true);
});

test('calculateLineGST splits CGST/SGST for intra-state', () => {
  const result = calculateLineGST({ amount: 1000, gstRate: 18, isInterState: false });
  assert.equal(result.igst, 0);
  assert.equal(result.cgst + result.sgst, result.totalGST);
  assert.equal(result.totalGST, 180);
});

test('calculateLineGST uses IGST for inter-state', () => {
  const result = calculateLineGST({ amount: 1000, gstRate: 18, isInterState: true });
  assert.equal(result.cgst, 0);
  assert.equal(result.sgst, 0);
  assert.equal(result.igst, 180);
});

test('calculateInvoiceTotals aggregates line items', () => {
  const totals = calculateInvoiceTotals(
    [{ quantity: 2, unitPrice: 500, gstRate: 18, product: 'Widget' }],
    '08',
    '08'
  );
  assert.equal(totals.subtotal, 1000);
  assert.equal(totals.grandTotal, 1180);
  assert.equal(totals.isInterState, false);
});
