import Notification from '../models/Notification.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination } from '../utils/pagination.util.js';
import { toPublicDoc } from '../utils/serialize.util.js';

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
