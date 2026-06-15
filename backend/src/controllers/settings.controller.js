import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { getSettings, updateSettings } from '../services/settings.service.js';

export const getGeneral = asyncHandler(async (_req, res) => {
  return sendSuccess(res, { data: await getSettings('general') });
});

export const updateGeneral = asyncHandler(async (req, res) => {
  const data = await updateSettings('general', req.body, req.user._id);
  return sendSuccess(res, { data, message: 'General settings updated' });
});

export const getGstSettings = asyncHandler(async (_req, res) => {
  return sendSuccess(res, { data: await getSettings('gst') });
});

export const updateGstSettings = asyncHandler(async (req, res) => {
  const data = await updateSettings('gst', req.body, req.user._id);
  return sendSuccess(res, { data, message: 'GST settings updated' });
});

export const getNotificationSettings = asyncHandler(async (_req, res) => {
  return sendSuccess(res, { data: await getSettings('notifications') });
});

export const updateNotificationSettings = asyncHandler(async (req, res) => {
  const data = await updateSettings('notifications', req.body, req.user._id);
  return sendSuccess(res, { data, message: 'Notification settings updated' });
});
