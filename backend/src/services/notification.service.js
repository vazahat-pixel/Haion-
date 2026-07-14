import Notification from '../models/Notification.model.js';

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
  return Notification.create({
    user: userId,
    title,
    message,
    type,
    module,
    resourceId: resourceId ? String(resourceId) : undefined,
    link,
    read: false,
  });
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
