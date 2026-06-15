import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PINCODE_DIRECTORY, INDIAN_STATES } from '../src/data/pincode.data.js';

test('pincode directory has valid 6-digit keys', () => {
  for (const pin of Object.keys(PINCODE_DIRECTORY)) {
    assert.match(pin, /^\d{6}$/);
    assert.ok(PINCODE_DIRECTORY[pin].city);
    assert.ok(PINCODE_DIRECTORY[pin].state);
  }
});

test('indian states list is non-empty', () => {
  assert.ok(INDIAN_STATES.length >= 10);
  assert.ok(INDIAN_STATES.every((s) => s.code && s.name));
});
