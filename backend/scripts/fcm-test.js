#!/usr/bin/env node
/**
 * fcm-test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Everything needed to hit Firebase Cloud Messaging by hand.
 *
 *   node scripts/fcm-test.js                 print the URL, body and a curl
 *                                            command with a fresh OAuth token
 *   node scripts/fcm-test.js <device-token>  actually send to that device
 *
 * Options:
 *   --title "..."     notification title      (default: Haion test notification)
 *   --body  "..."     notification body
 *   --link  "..."     path opened on tap      (default: /)
 *   --platform web|app   shape the printed body for that platform
 *
 * The access token printed here is a short-lived (~1 hour) OAuth2 token minted
 * from the service account. Treat it like a password while it is valid.
 */
import fs from 'node:fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { env } from '../src/config/env.js';
import { buildMessage } from '../src/services/push.service.js';

// ── Args ──────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const FLAGS = ['title', 'body', 'link', 'platform'];

function flag(name, fallback) {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
}

// Positional argument = the device token; skip every flag and its value.
const consumed = new Set();
for (const name of FLAGS) {
  const i = argv.indexOf(`--${name}`);
  if (i >= 0) {
    consumed.add(i);
    consumed.add(i + 1);
  }
}
const deviceToken = argv.find((a, i) => !consumed.has(i) && !a.startsWith('--'));

const title = flag('title', 'Haion test notification');
const body = flag('body', 'Push notifications are working correctly.');
const platform = flag('platform', 'web').toLowerCase();

/**
 * Accept `customer/complaints`, `/customer/complaints` or a full URL.
 *
 * Git Bash on Windows rewrites a leading-slash argument into a filesystem path
 * (`/customer/x` becomes `C:/Program Files/Git/customer/x`), so a mangled value
 * is detected and unwound rather than silently shipped into the payload.
 */
function normaliseLink(raw) {
  if (!raw) return '/';
  if (/^https?:\/\//i.test(raw)) return raw;

  let value = raw;
  const mangled = value.match(/^[A-Za-z]:[\\/].*?[\\/]Git[\\/](.*)$/);
  if (mangled) {
    value = `/${mangled[1]}`;
    console.warn(`[warn] Git Bash rewrote the --link argument; using "${value}".`);
    console.warn('       Pass it without the leading slash to avoid this, e.g. --link customer/complaints\n');
  }
  return value.startsWith('/') ? value : `/${value}`;
}

const link = normaliseLink(flag('link', '/'));

// ── Credentials ───────────────────────────────────────────────────────────────

function loadServiceAccount() {
  if (env.firebaseServiceAccountBase64) {
    return JSON.parse(Buffer.from(env.firebaseServiceAccountBase64, 'base64').toString('utf8'));
  }
  if (env.firebaseServiceAccountPath && fs.existsSync(env.firebaseServiceAccountPath)) {
    return JSON.parse(fs.readFileSync(env.firebaseServiceAccountPath, 'utf8'));
  }
  return null;
}

const serviceAccount = loadServiceAccount();
if (!serviceAccount) {
  console.error('No Firebase service account configured. Set FIREBASE_SERVICE_ACCOUNT_BASE64 in backend/.env');
  process.exit(1);
}

const projectId = env.firebaseProjectId || serviceAccount.project_id;
const app = getApps().length
  ? getApps()[0]
  : initializeApp({ credential: cert(serviceAccount), projectId });

// ── Message ───────────────────────────────────────────────────────────────────

const FCM_URL = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

const message = buildMessage({
  title,
  body,
  link,
  data: { type: 'SYSTEM', module: 'PushTest' },
});

/**
 * firebase-admin uses camelCase; the raw REST API expects snake_case. Convert
 * so the printed body can be pasted straight into curl or Postman.
 */
function toRestShape(msg) {
  const out = {
    notification: msg.notification,
    data: msg.data,
    android: msg.android,
    apns: msg.apns,
    webpush: msg.webpush && {
      notification: msg.webpush.notification,
      ...(msg.webpush.fcmOptions ? { fcm_options: msg.webpush.fcmOptions } : {}),
    },
  };
  // A native build has no use for the webpush block, and vice versa.
  if (platform === 'app' || platform === 'android' || platform === 'ios') delete out.webpush;
  if (platform === 'web') {
    delete out.android;
    delete out.apns;
  }
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined));
}

const restBody = {
  message: {
    token: deviceToken || '<PASTE_DEVICE_TOKEN_HERE>',
    ...toRestShape(message),
  },
};

// ── Output ────────────────────────────────────────────────────────────────────

const accessToken = await app.options.credential.getAccessToken();

console.log('\n═══ FCM HTTP v1 ═══════════════════════════════════════════════\n');
console.log('POST', FCM_URL);
console.log('\nHeaders:');
console.log('  Authorization: Bearer ' + accessToken.access_token);
console.log('  Content-Type: application/json');
console.log(`\n  (token expires in ~${Math.round((accessToken.expires_in || 3600) / 60)} min — rerun this script for a fresh one)`);
console.log('\nBody:');
console.log(JSON.stringify(restBody, null, 2));

console.log('\n═══ Ready-to-run curl ═════════════════════════════════════════\n');
console.log(
  `curl -X POST '${FCM_URL}' \\\n` +
    `  -H 'Authorization: Bearer ${accessToken.access_token}' \\\n` +
    `  -H 'Content-Type: application/json' \\\n` +
    `  -d '${JSON.stringify(restBody)}'`
);

// ── Optional live send ────────────────────────────────────────────────────────

if (deviceToken) {
  console.log('\n═══ Sending now ═══════════════════════════════════════════════\n');
  try {
    const id = await getMessaging(app).send({ ...message, token: deviceToken });
    console.log('Delivered. FCM message id:', id);
  } catch (err) {
    console.error('Send failed:', err.code || '', err.message);
    if (err.code === 'messaging/registration-token-not-registered') {
      console.error('That token is no longer valid — re-enable notifications in the browser to mint a new one.');
    }
    process.exitCode = 1;
  }
} else {
  console.log('\nNo device token passed — nothing was sent.');
  console.log('Get one from the browser console after enabling notifications:');
  console.log("  localStorage.getItem('haion.push.token')");
  console.log('Then: node scripts/fcm-test.js <that-token>\n');
}
