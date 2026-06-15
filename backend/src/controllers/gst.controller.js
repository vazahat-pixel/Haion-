import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { env } from '../config/env.js';
import { extractStateCodeFromGSTIN } from '../utils/gst.util.js';

const GST_RATES = [
  { rate: 0, label: 'Nil' },
  { rate: 5, label: '5%' },
  { rate: 12, label: '12%' },
  { rate: 18, label: '18%' },
  { rate: 28, label: '28%' },
];

const HSN_DIRECTORY = {
  '8501': { description: 'Electric motors', gstRate: 18 },
  '8537': { description: 'Control panels', gstRate: 18 },
  '8413': { description: 'Pumps', gstRate: 18 },
  '4010': { description: 'Conveyor belts', gstRate: 12 },
};

export const getGstConfig = asyncHandler(async (_req, res) => {
  return sendSuccess(res, {
    data: {
      companyName: env.companyName,
      gstin: env.companyGstin,
      stateCode: env.companyStateCode,
    },
  });
});

export const getGstRates = asyncHandler(async (_req, res) => {
  return sendSuccess(res, { data: GST_RATES });
});

export const lookupHsn = asyncHandler(async (req, res) => {
  const code = req.params.code;
  const entry = HSN_DIRECTORY[code];
  if (!entry) return sendError(res, { message: 'HSN code not found', statusCode: 404 });
  return sendSuccess(res, { data: { code, ...entry } });
});

export const validateGstin = asyncHandler(async (req, res) => {
  const gstin = (req.params.gstin || '').toUpperCase();
  const valid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin);
  return sendSuccess(res, {
    data: {
      valid,
      gstin,
      stateCode: valid ? extractStateCodeFromGSTIN(gstin) : null,
    },
  });
});
