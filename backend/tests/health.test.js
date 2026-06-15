import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

let server;

after(() => {
  if (server) server.close();
});

test('GET /api/health returns success', async () => {
  await new Promise((resolve) => {
    server = app.listen(0, async () => {
      const { port } = server.address();
      const res = await fetch(`http://127.0.0.1:${port}/api/health`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.data?.version);
      resolve();
    });
  });
});
