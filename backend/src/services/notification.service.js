/**
 * notification.service.js
 * ─────────────────────────────────────────────────────────────────────────────
 * The single place notifications are raised.
 *
 * Every helper here writes the in-app Notification row *and* fans the same
 * message out over Firebase Cloud Messaging, so any caller — existing or new —
 * gets push delivery for free without knowing FCM exists. Push failures are
 * swallowed: a notification is a side effect, never a reason to fail the
 * business action that raised it.
 */
import Notification from '../models/Notification.model.js';
import User from '../models/User.model.js';
import { sendToUser, sendToRole } from './push.service.js';

/**
 * Dispatch a push without making the caller wait on Google's servers. The
 * in-app row is already saved by the time this runs, so the API response stays
 * accurate; a slow or failing FCM only ever costs a log line.
 */
function dispatchPush(fn) {
  Promise.resolve()
    .then(fn)
    .catch((err) => console.error('[Notification] push delivery failed:', err.message));
}

export async function notifyUser({
  userId,
  title,
  message,
  type = 'SYSTEM',
  module = 'System',
  resourceId,
  link,
}) {
  if (!userId) return null;
  const doc = await Notification.create({
    user: userId,
    title,
    message,
    type,
    module,
    resourceId: resourceId ? String(resourceId) : undefined,
    link,
    read: false,
  });

  dispatchPush(() =>
    sendToUser(userId, {
      title,
      body: message,
      link,
      data: { notificationId: String(doc._id), type, module, resourceId: resourceId ? String(resourceId) : '' },
    })
  );

  return doc;
}

/** Same notification to several users — one row each, one push each. */
export async function notifyUsers(userIds, payload) {
  const unique = [...new Set((userIds || []).filter(Boolean).map(String))];
  if (!unique.length) return [];
  return Promise.all(unique.map((userId) => notifyUser({ ...payload, userId })));
}

/**
 * Broadcast to a role. Writes one role-scoped Notification row (which the
 * notification list already surfaces to every holder of that role) and pushes
 * to all of their registered devices.
 */
export async function notifyRole({
  role,
  title,
  message,
  type = 'SYSTEM',
  module = 'System',
  resourceId,
  link,
}) {
  if (!role) return null;
  const doc = await Notification.create({
    user: null,
    role,
    title,
    message,
    type,
    module,
    resourceId: resourceId ? String(resourceId) : undefined,
    link,
    read: false,
  });

  dispatchPush(() =>
    sendToRole(role, {
      title,
      body: message,
      link,
      data: { notificationId: String(doc._id), type, module, resourceId: resourceId ? String(resourceId) : '' },
    })
  );

  return doc;
}

/** Broadcast to every active user holding any of the given roles. */
export async function notifyRoles(roles, payload) {
  const unique = [...new Set((roles || []).filter(Boolean))];
  return Promise.all(unique.map((role) => notifyRole({ ...payload, role })));
}

/**
 * Notify whoever can act on an admin-side event. Resolves to real users so the
 * message lands in a person's list rather than only a role bucket.
 */
export async function notifyAdmins(payload, roles = ['MASTER_ADMIN']) {
  const users = await User.find({ role: { $in: roles }, isActive: { $ne: false } }, { _id: 1 }).lean();
  return notifyUsers(users.map((u) => u._id), payload);
}

export async function notifyCustomerStatusChange({
  userId,
  title,
  message,
  resourceId,
  link,
}) {
  return notifyUser({
    userId,
    title,
    message,
    type: 'CUSTOMER',
    module: 'CustomerPortal',
    resourceId,
    link,
  });
}
