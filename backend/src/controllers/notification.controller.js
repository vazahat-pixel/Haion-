import Notification from '../models/Notification.model.js';
import DeviceToken, { DEVICE_PLATFORMS } from '../models/DeviceToken.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';
import {
  registerDeviceToken,
  unregisterDeviceToken,
  sendToUser,
  getPushStatus as readPushStatus,
} from '../services/push.service.js';

function userFilter(req) {
  return {
    $or: [
      { user: req.user._id },
      { user: null, role: req.user.role },
      { user: null, role: null },
    ],
  };
}

export const listNotifications = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = userFilter(req);
  if (req.query.read !== undefined) filter.read = req.query.read === 'true';

  const [rows, total] = await Promise.all([
    Notification.find(filter).sort(sort).skip(skip).limit(perPage).lean(),
    Notification.countDocuments(filter),
  ]);
  return sendPaginated(res, { data: toPublicDoc(rows), total, page, perPage });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ ...userFilter(req), read: false });
  return sendSuccess(res, { data: { count } });
});

export const markRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, ...userFilter(req) },
    { read: true }
  );
  return sendSuccess(res, { message: 'Notification marked read' });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ ...userFilter(req), read: false }, { read: true });
  return sendSuccess(res, { message: 'All notifications marked read' });
});

// ── Push devices ──────────────────────────────────────────────────────────────

/** GET /api/notifications/push-status — is FCM configured on this server? */
export const getPushStatus = asyncHandler(async (req, res) => {
  const status = readPushStatus();
  const deviceCount = await DeviceToken.countDocuments({ user: req.user._id, isActive: true });
  return sendSuccess(res, { data: { ...status, deviceCount } });
});

/** POST /api/notifications/devices — claim an FCM token for the current user */
export const registerDevice = asyncHandler(async (req, res) => {
  const token = req.body?.token || req.body?.fcmToken;
  if (!token) return sendError(res, { message: 'token or fcmToken is required', statusCode: 400 });

  // Accept web, app, mobile, and native registrations alike
  let requested = String(req.body?.platform || 'WEB').toUpperCase();
  if (requested === 'MOBILE') requested = 'APP';

  if (!DEVICE_PLATFORMS.includes(requested)) {
    return sendError(res, {
      message: `platform must be one of: ${DEVICE_PLATFORMS.join(', ')} or MOBILE`,
      statusCode: 400,
    });
  }

  const doc = await registerDeviceToken({
    userId: req.user._id,
    role: req.user.role,
    token,
    platform: requested,
    panel: req.body?.panel || req.headers['x-panel'] || '',
    userAgent: req.headers['user-agent'] || '',
  });

  return sendSuccess(res, {
    data: { id: String(doc._id), platform: doc.platform, panel: doc.panel },
    message: 'Device registered for push notifications',
  });
});

/** DELETE /api/notifications/devices — release a token (logout / permission revoked) */
export const unregisterDevice = asyncHandler(async (req, res) => {
  const token = req.body?.token || req.query.token;
  if (!token) return sendError(res, { message: 'token is required', statusCode: 400 });
  const removed = await unregisterDeviceToken(token);
  return sendSuccess(res, { data: { removed }, message: 'Device unregistered' });
});

/** GET /api/notifications/devices — devices currently receiving push for this user */
export const listDevices = asyncHandler(async (req, res) => {
  const rows = await DeviceToken.find({ user: req.user._id, isActive: true })
    .select('platform panel userAgent lastSeenAt createdAt')
    .sort({ lastSeenAt: -1 })
    .lean();
  return sendSuccess(res, { data: toPublicDoc(rows) });
});

/**
 * POST /api/notifications/test-push — send a real push to the caller's own
 * devices. Used to confirm the whole chain works end to end.
 */
export const sendTestPush = asyncHandler(async (req, res) => {
  const status = readPushStatus();
  if (!status.enabled) {
    return sendError(res, { message: `Push is not available: ${status.reason}`, statusCode: 503 });
  }

  const devices = await DeviceToken.countDocuments({ user: req.user._id, isActive: true });
  if (!devices) {
    return sendError(res, {
      message: 'No device registered for your account. Allow notifications in the browser first.',
      statusCode: 400,
    });
  }

  const result = await sendToUser(req.user._id, {
    title: req.body?.title || 'Haion test notification',
    body: req.body?.message || 'Push notifications are working correctly.',
    link: req.body?.link || '/',
    data: { type: 'SYSTEM', module: 'PushTest' },
  });

  return sendSuccess(res, {
    data: { ...result, devices },
    message: result.sent > 0
      ? `Test push delivered to ${result.sent} of ${devices} device(s)`
      : 'Push was accepted but no device received it — check the token is still valid',
  });
});
