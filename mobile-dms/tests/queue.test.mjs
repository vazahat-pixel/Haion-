import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createQueue, NetworkError } from '../src/queue.js';

const memStorage = () => { const m = new Map(); return { getItem: async (k) => m.get(k) ?? null, setItem: async (k, v) => { m.set(k, v); } }; };

test('sends in order and empties the queue', async () => {
  const sent = [];
  const q = createQueue(memStorage(), async (i) => { sent.push(i.n); });
  await q.add({ n: 1 }); await q.add({ n: 2 }); await q.add({ n: 3 });
  assert.deepEqual(await q.flush(), { sent: 3, failed: 0, pending: 0 });
  assert.deepEqual(sent, [1, 2, 3]);
});

test('offline: stops at the first network error, keeps order, retries later', async () => {
  let online = false;
  const sent = [];
  const q = createQueue(memStorage(), async (i) => { if (!online) throw new NetworkError(); sent.push(i.n); });
  await q.add({ n: 1 }); await q.add({ n: 2 });
  assert.deepEqual(await q.flush(), { sent: 0, failed: 0, pending: 2 });
  assert.equal((await q.items())[0].attempts, 1);
  online = true;
  assert.deepEqual(await q.flush(), { sent: 2, failed: 0, pending: 0 });
  assert.deepEqual(sent, [1, 2]);
});

test('server refusal (4xx) moves the item to failed with the message; later items still go', async () => {
  const q = createQueue(memStorage(), async (i) => { if (i.n === 1) { const e = new Error('Already logged in today'); e.status = 422; throw e; } });
  await q.add({ n: 1 }); await q.add({ n: 2 });
  assert.deepEqual(await q.flush(), { sent: 1, failed: 1, pending: 0 });
  const f = await q.failed();
  assert.equal(f.length, 1);
  assert.equal(f[0].error, 'Already logged in today');
});

test('server error (5xx) is retried, not dropped', async () => {
  let fail = true;
  const q = createQueue(memStorage(), async () => { if (fail) { const e = new Error('Internal'); e.status = 500; throw e; } });
  await q.add({ n: 1 });
  assert.deepEqual(await q.flush(), { sent: 0, failed: 0, pending: 1 });
  fail = false;
  assert.deepEqual(await q.flush(), { sent: 1, failed: 0, pending: 0 });
});

test('concurrent flush calls share one run (no double send)', async () => {
  let calls = 0;
  const q = createQueue(memStorage(), async () => { calls += 1; await new Promise((r) => setTimeout(r, 10)); });
  await q.add({ n: 1 });
  await Promise.all([q.flush(), q.flush(), q.flush()]);
  assert.equal(calls, 1);
});
