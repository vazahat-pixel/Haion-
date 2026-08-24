import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { ensureQaFixture, loginToken, authed, QA_USERS } from './helpers/qa.harness.js';
import DeviceToken from '../src/models/DeviceToken.model.js';
import Notification from '../src/models/Notification.model.js';
import User from '../src/models/User.model.js';
import { getPushStatus, sendToTokens, buildMessage } from '../src/services/push.service.js';
import { notifyUser, notifyUsers } from '../src/services/notification.service.js';

let adminToken;
let adminUser;
const TEST_TOKEN = `qa-device-token-${Date.now()}`;

before(async () => {
  await connectDatabase();
  await ensureQaFixture();
  const session = await loginToken(QA_USERS.admin.email);
  adminToken = session.token;
  adminUser = await User.findOne({ email: QA_USERS.admin.email }).lean();
});

after(async () => {
  await DeviceToken.deleteMany({ token: /^qa-device-token-/ });
  await disconnectDatabase();
});

// ── Configuration ─────────────────────────────────────────────────────────────

test('Push: Firebase Admin is configured and reports itself enabled', () => {
  const status = getPushStatus();
  assert.equal(status.enabled, true, `push should be enabled — ${status.reason}`);
  assert.equal(status.projectId, 'haioncustomer');
});

test('Push: GET /api/notifications/push-status reports server readiness', async () => {
  const api = authed(adminToken);
  const res = await api.get('/api/notifications/push-status');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.enabled, true);
  assert.equal(typeof res.body.data.deviceCount, 'number');
});

// ── Token registry ────────────────────────────────────────────────────────────

test('Push: POST /api/notifications/devices registers a token for the caller', async () => {
  const api = authed(adminToken);
  const res = await api.post('/api/notifications/devices', {
    token: TEST_TOKEN,
    platform: 'WEB',
    panel: 'admin',
  });
  assert.equal(res.status, 200);

  const row = await DeviceToken.findOne({ token: TEST_TOKEN }).lean();
  assert.ok(row, 'device token should be stored');
  assert.equal(String(row.user), String(adminUser._id));
  assert.equal(row.role, adminUser.role);
  assert.equal(row.isActive, true);
});

test('Push: re-registering the same token updates rather than duplicating it', async () => {
  const api = authed(adminToken);
  const res = await api.post('/api/notifications/devices', { token: TEST_TOKEN, panel: 'customer' });
  assert.equal(res.status, 200);

  const count = await DeviceToken.countDocuments({ token: TEST_TOKEN });
  assert.equal(count, 1, 'the same device must not create a second row');

  const row = await DeviceToken.findOne({ token: TEST_TOKEN }).lean();
  assert.equal(row.panel, 'customer', 'the row should be re-pointed at the latest registration');
});

test('Push: GET /api/notifications/devices lists the caller devices', async () => {
  const api = authed(adminToken);
  const res = await api.get('/api/notifications/devices');
  assert.equal(res.status, 200);
  assert.ok(res.body.data.some((d) => d.panel === 'customer'));
});

test('Push: registering without a token is rejected', async () => {
  const api = authed(adminToken);
  const res = await api.post('/api/notifications/devices', {});
  assert.equal(res.status, 400);
});

test('Push: both web and native app platforms can register', async () => {
  const api = authed(adminToken);

  for (const platform of ['WEB', 'APP', 'ANDROID', 'IOS']) {
    const token = `qa-device-token-${platform.toLowerCase()}-${Date.now()}`;
    const res = await api.post('/api/notifications/devices', { token, platform });
    assert.equal(res.status, 200, `${platform} should be accepted`);
    assert.equal(res.body.data.platform, platform);
  }
});

test('Push: platform is case-insensitive and unknown values are rejected', async () => {
  const api = authed(adminToken);

  const lower = await api.post('/api/notifications/devices', {
    token: `qa-device-token-lower-${Date.now()}`,
    platform: 'app',
  });
  assert.equal(lower.status, 200);
  assert.equal(lower.body.data.platform, 'APP');

  const bad = await api.post('/api/notifications/devices', {
    token: `qa-device-token-bad-${Date.now()}`,
    platform: 'WINDOWS_PHONE',
  });
  assert.equal(bad.status, 400);
  assert.match(bad.body.message, /platform must be one of/i);
});

test('Push: the message payload carries blocks for web and native alike', async () => {
  const msg = buildMessage({
    title: 'T',
    body: 'B',
    link: '/customer/complaints',
    data: { type: 'CUSTOMER', module: 'Complaint' },
  });

  assert.ok(msg.webpush?.notification, 'web browsers need a webpush block');
  assert.ok(msg.android?.notification, 'android builds need an android block');
  assert.ok(msg.apns?.payload, 'ios builds need an apns block');

  // The service worker's click handler reads data.link, which is what makes an
  // app-relative path work on both platforms.
  assert.equal(msg.data.link, '/customer/complaints');
  // FCM requires every data value to be a string.
  for (const [key, value] of Object.entries(msg.data)) {
    assert.equal(typeof value, 'string', `data.${key} must be a string`);
  }
});

// ── Delivery ──────────────────────────────────────────────────────────────────

test('Push: a stale device token is retired after FCM reports it unregistered', async () => {
  // Well-formed but unregistered — exactly what a real token looks like once
  // the browser data is cleared. Reaching this error also proves the service
  // account credentials work: a bad credential would throw instead.
  const stale = `dGVzdDp0ZXN0:APA91bH${'x'.repeat(134)}`;
  await DeviceToken.create({ user: adminUser._id, role: adminUser.role, token: stale });

  try {
    const result = await sendToTokens([stale], { title: 'probe', body: 'probe' });
    assert.equal(result.sent, 0);
    assert.equal(result.failed, 1);
    assert.equal(result.retired, 1, 'an unregistered token should be deactivated');

    const row = await DeviceToken.findOne({ token: stale }).lean();
    assert.equal(row.isActive, false);
  } finally {
    await DeviceToken.deleteOne({ token: stale });
  }
});

test('Push: a whole batch failing as invalid-argument keeps the tokens', async () => {
  // Garbage tokens all fail with the ambiguous code. Since nothing in the batch
  // succeeded, the payload is the likelier culprit — the tokens must survive so
  // a bad message can never wipe out a user's registrations.
  const junk = [`qa-device-token-junk-a-${Date.now()}`, `qa-device-token-junk-b-${Date.now()}`];
  await DeviceToken.insertMany(junk.map((token) => ({ user: adminUser._id, role: adminUser.role, token })));

  const result = await sendToTokens(junk, { title: 'probe', body: 'probe' });
  assert.equal(result.sent, 0);
  assert.equal(result.retired, 0, 'nothing should be retired when the payload is in doubt');
  assert.equal(result.suspectPayload, true);

  const stillActive = await DeviceToken.countDocuments({ token: { $in: junk }, isActive: true });
  assert.equal(stillActive, junk.length, 'tokens must stay active');
});

test('Push: sending to an empty device list is a no-op, not an error', async () => {
  const result = await sendToTokens([], { title: 'x', body: 'y' });
  assert.equal(result.sent, 0);
  assert.equal(result.skipped, true);
});

test('Push: POST /api/notifications/test-push reaches FCM for a registered device', async () => {
  const api = authed(adminToken);
  const res = await api.post('/api/notifications/test-push', { title: 'QA test', message: 'QA body' });
  // The QA token is not a real browser registration, so FCM rejects it — but
  // the request must still be handled rather than erroring out.
  assert.equal(res.status, 200);
  assert.equal(typeof res.body.data.sent, 'number');
  assert.equal(typeof res.body.data.failed, 'number');
  assert.ok(res.body.data.devices >= 0);
});

// ── Notification service fan-out ──────────────────────────────────────────────

test('Notifications: notifyUser writes an in-app row and survives push failure', async () => {
  const before = await Notification.countDocuments({ user: adminUser._id });

  const doc = await notifyUser({
    userId: adminUser._id,
    title: 'QA notification',
    message: 'Raised by the push notification test',
    type: 'SYSTEM',
    module: 'QA',
    resourceId: 'QA-001',
    link: '/admin',
  });

  assert.ok(doc, 'notifyUser should return the created notification');
  assert.equal(doc.title, 'QA notification');
  assert.equal(doc.read, false);

  const after = await Notification.countDocuments({ user: adminUser._id });
  assert.equal(after, before + 1, 'exactly one in-app row should be written');

  await Notification.deleteOne({ _id: doc._id });
});

test('Notifications: notifyUsers de-duplicates recipients', async () => {
  const id = adminUser._id;
  const docs = await notifyUsers([id, id, String(id)], {
    title: 'QA fan-out',
    message: 'Should only arrive once',
    module: 'QA',
  });

  assert.equal(docs.length, 1, 'the same user must not be notified twice');
  await Notification.deleteMany({ _id: { $in: docs.map((d) => d._id) } });
});

test('Notifications: notifyUsers on an empty list does nothing', async () => {
  const docs = await notifyUsers([], { title: 'nobody', message: 'nobody' });
  assert.deepEqual(docs, []);
});

test('Push: DELETE /api/notifications/devices releases the token', async () => {
  const api = authed(adminToken);
  const res = await api.delete(`/api/notifications/devices?token=${encodeURIComponent(TEST_TOKEN)}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.removed, 1);

  const row = await DeviceToken.findOne({ token: TEST_TOKEN }).lean();
  assert.equal(row, null, 'the token should be gone after unregistering');
});
