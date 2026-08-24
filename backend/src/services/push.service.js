/**
 * push.service.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Firebase Cloud Messaging delivery.
 *
 * Push is strictly optional: if no service account is configured the module
 * reports itself disabled and every send becomes a no-op, so the app (and its
 * in-app notifications) behave exactly as before. Sends never throw — a failed
 * push must not roll back the business action that triggered it.
 */
import fs from 'node:fs';
import { initializeApp, cert, getApps, getApp as getExistingApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { env } from '../config/env.js';
import DeviceToken from '../models/DeviceToken.model.js';

/** FCM codes that unambiguously mean "this token is dead, stop using it". */
const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

/**
 * `invalid-argument` means either a malformed token or a malformed payload, and
 * FCM does not say which. It is only treated as a dead token when some other
 * token in the same batch succeeded — proof the payload itself was fine.
 */
const AMBIGUOUS_TOKEN_CODE = 'messaging/invalid-argument';

let app = null;
let initTried = false;
let initError = null;

function loadServiceAccount() {
  if (env.firebaseServiceAccountBase64) {
    const raw = Buffer.from(env.firebaseServiceAccountBase64, 'base64').toString('utf8');
    return JSON.parse(raw);
  }
  if (env.firebaseServiceAccountPath && fs.existsSync(env.firebaseServiceAccountPath)) {
    return JSON.parse(fs.readFileSync(env.firebaseServiceAccountPath, 'utf8'));
  }
  return null;
}

/** Lazily initialise the Admin SDK. Safe to call repeatedly. */
function getApp() {
  if (app || initTried) return app;
  initTried = true;
  try {
    const serviceAccount = loadServiceAccount();
    if (!serviceAccount) {
      console.warn('[Push] No Firebase service account configured — push notifications are disabled.');
      return null;
    }
    app = getApps().length
      ? getExistingApp()
      : initializeApp({
          credential: cert(serviceAccount),
          projectId: env.firebaseProjectId || serviceAccount.project_id,
        });
    console.log(`[Push] Firebase Admin ready for project "${serviceAccount.project_id}"`);
    return app;
  } catch (err) {
    initError = err;
    console.error('[Push] Firebase Admin failed to initialise:', err.message);
    return null;
  }
}

export function isPushEnabled() {
  return Boolean(getApp());
}

export function getPushStatus() {
  const enabled = isPushEnabled();
  return {
    enabled,
    projectId: enabled ? (env.firebaseProjectId || null) : null,
    reason: enabled
      ? null
      : initError
        ? `Firebase Admin failed to initialise: ${initError.message}`
        : 'No Firebase service account configured (set FIREBASE_SERVICE_ACCOUNT_BASE64)',
  };
}

// ── Token registry ────────────────────────────────────────────────────────────

/**
 * Claim an FCM token for a user. The same physical device may previously have
 * belonged to someone else, so an existing row is re-pointed rather than
 * duplicated (the token field is unique).
 */
export async function registerDeviceToken({ userId, role, token, platform = 'WEB', panel = '', userAgent = '' }) {
  if (!userId || !token) return null;
  return DeviceToken.findOneAndUpdate(
    { token },
    {
      user: userId,
      role: role || null,
      token,
      platform,
      panel,
      userAgent: String(userAgent || '').slice(0, 400),
      lastSeenAt: new Date(),
      isActive: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

/** Drop a token — called on logout or when the browser revokes permission. */
export async function unregisterDeviceToken(token) {
  if (!token) return 0;
  const res = await DeviceToken.deleteOne({ token });
  return res.deletedCount || 0;
}

async function deactivateTokens(tokens) {
  if (!tokens.length) return;
  await DeviceToken.updateMany({ token: { $in: tokens } }, { $set: { isActive: false } });
}

// ── Sending ───────────────────────────────────────────────────────────────────

/**
 * The exact FCM v1 message the server sends, minus the token. Exported so the
 * fcm-test script can print a body that matches production byte for byte.
 *
 * `link` is carried in `data` as well as `webpush.fcmOptions`, because the
 * service worker's click handler reads `data.link` — that is what makes
 * app-relative paths like `/customer/complaints` work.
 */
export function buildMessage({ title, body, data = {}, link }) {
  // FCM data values must all be strings.
  const stringData = Object.fromEntries(
    Object.entries({ ...data, link: link || '' })
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)])
  );

  return {
    notification: { title, body },
    data: stringData,
    webpush: {
      notification: {
        title,
        body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: stringData.notificationId || undefined,
      },
      fcmOptions: link ? { link } : undefined,
    },
    android: { priority: 'high', notification: { sound: 'default' } },
    apns: { payload: { aps: { sound: 'default' } } },
  };
}

/**
 * Send to an explicit list of tokens. Returns a summary and quietly retires
 * any token FCM rejects as dead.
 */
export async function sendToTokens(tokens, payload) {
  const unique = [...new Set((tokens || []).filter(Boolean))];
  if (!unique.length) return { sent: 0, failed: 0, skipped: true };
  if (!getApp()) return { sent: 0, failed: 0, skipped: true, reason: 'push-disabled' };

  const message = buildMessage(payload);
  try {
    const res = await getMessaging(app).sendEachForMulticast({ ...message, tokens: unique });

    // A payload FCM dislikes fails every token at once. Only trust the
    // ambiguous code when something else in the batch went through, so a bad
    // message can never wipe out an entire user's registrations.
    const payloadProvenGood = res.successCount > 0;
    const dead = [];
    let suspectPayload = false;

    res.responses.forEach((r, i) => {
      if (r.success) return;
      const code = r.error?.code;
      if (DEAD_TOKEN_CODES.has(code)) dead.push(unique[i]);
      else if (code === AMBIGUOUS_TOKEN_CODE) {
        if (payloadProvenGood) dead.push(unique[i]);
        else suspectPayload = true;
      }
    });

    if (dead.length) await deactivateTokens(dead);
    if (suspectPayload) {
      console.error('[Push] invalid-argument on every token — payload may be malformed, tokens kept');
    }

    return { sent: res.successCount, failed: res.failureCount, retired: dead.length, suspectPayload };
  } catch (err) {
    console.error('[Push] send failed:', err.message);
    return { sent: 0, failed: unique.length, error: err.message };
  }
}

/** Send to every live device belonging to one user. */
export async function sendToUser(userId, payload) {
  if (!userId || !getApp()) return { sent: 0, failed: 0, skipped: true };
  const rows = await DeviceToken.find({ user: userId, isActive: true }, { token: 1 }).lean();
  return sendToTokens(rows.map((r) => r.token), payload);
}

/** Send to every live device belonging to any user holding the given role. */
export async function sendToRole(role, payload) {
  if (!role || !getApp()) return { sent: 0, failed: 0, skipped: true };
  const rows = await DeviceToken.find({ role, isActive: true }, { token: 1 }).lean();
  return sendToTokens(rows.map((r) => r.token), payload);
}
