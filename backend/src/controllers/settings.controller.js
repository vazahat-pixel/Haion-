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

export const getCustomerPortalSettings = asyncHandler(async (_req, res) => {
  return sendSuccess(res, { data: await getSettings('customer-portal') });
});

export const updateCustomerPortalSettings = asyncHandler(async (req, res) => {
  const data = await updateSettings('customer-portal', req.body, req.user._id);
  return sendSuccess(res, { data, message: 'Customer portal settings updated' });
});

export const getCaReportsSettings = asyncHandler(async (_req, res) => {
  return sendSuccess(res, { data: await getSettings('ca-reports') });
});

export const updateCaReportsSettings = asyncHandler(async (req, res) => {
  const { enabled, caName, caWhatsapp, caEmail } = req.body;
  if (enabled) {
    if (!caName?.trim()) {
      return res.status(400).json({ success: false, message: 'CA Name is required when sharing is enabled' });
    }
    const digits = String(caWhatsapp || '').replace(/\D/g, '');
    if (digits.length < 10) {
      return res.status(400).json({ success: false, message: 'Valid CA WhatsApp number is required' });
    }
  }
  const data = await updateSettings('ca-reports', {
    enabled: Boolean(enabled),
    caName: caName?.trim() || '',
    caWhatsapp: String(caWhatsapp || '').replace(/\D/g, ''),
    caEmail: caEmail?.trim() || '',
  }, req.user._id);
  return sendSuccess(res, { data, message: 'CA reports sharing settings updated' });
});

export const getBusinessSettings = asyncHandler(async (_req, res) => {
  const [business, gst] = await Promise.all([
    getSettings('business'),
    getSettings('gst'),
  ]);
  return sendSuccess(res, {
    data: {
      ...business,
      gstin: business.gstin || gst.gstin,
      stateCode: business.stateCode || gst.stateCode,
    },
  });
});

export const updateBusinessSettings = asyncHandler(async (req, res) => {
  const data = await updateSettings('business', req.body, req.user._id);
  if (req.body.gstin || req.body.stateCode) {
    await updateSettings('gst', {
      gstin: req.body.gstin || data.gstin,
      stateCode: req.body.stateCode || data.stateCode,
    }, req.user._id);
  }
  if (req.body.businessName) {
    await updateSettings('general', {
      companyName: req.body.businessName,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.billingAddress,
    }, req.user._id);
  }
  return sendSuccess(res, { data, message: 'Business settings updated' });
});

export const getInvoiceSettings = asyncHandler(async (_req, res) => {
  return sendSuccess(res, { data: await getSettings('invoice') });
});

export const updateInvoiceSettings = asyncHandler(async (req, res) => {
  const data = await updateSettings('invoice', req.body, req.user._id);
  return sendSuccess(res, { data, message: 'Invoice settings updated' });
});

export const getPrintSettings = asyncHandler(async (_req, res) => {
  return sendSuccess(res, { data: await getSettings('print') });
});

export const updatePrintSettings = asyncHandler(async (req, res) => {
  const data = await updateSettings('print', req.body, req.user._id);
  return sendSuccess(res, { data, message: 'Print settings updated' });
});

export const getBusinessProfileBundle = asyncHandler(async (_req, res) => {
  const [business, invoice, print, gst] = await Promise.all([
    getSettings('business'),
    getSettings('invoice'),
    getSettings('print'),
    getSettings('gst'),
  ]);
  return sendSuccess(res, {
    data: {
      business: {
        ...business,
        gstin: business.gstin || gst.gstin,
        stateCode: business.stateCode || gst.stateCode,
      },
      invoice,
      print,
    },
  });
});
