import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { env } from '../config/env.js';
import { extractStateCodeFromGSTIN } from '../utils/gst.util.js';

const STATE_NAMES = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
  '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur',
  '15': 'Mizoram', '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
  '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu', '27': 'Maharashtra', '29': 'Karnataka', '30': 'Goa',
  '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry', '36': 'Telangana', '37': 'Andhra Pradesh',
};

function extractPanFromGstin(gstin) {
  if (!gstin || gstin.length < 12) return '';
  return gstin.substring(2, 12).toUpperCase();
}

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
  const stateCode = valid ? extractStateCodeFromGSTIN(gstin) : null;
  return sendSuccess(res, {
    data: {
      valid,
      gstin,
      stateCode,
      state: stateCode ? STATE_NAMES[stateCode] || '' : '',
      pan: valid ? extractPanFromGstin(gstin) : '',
      legalName: valid ? `Registered Business (${gstin.slice(-6)})` : '',
      tradeName: valid ? `Business ${gstin.slice(0, 6)}` : '',
      address: valid ? 'Address will be available with live GST API integration' : '',
    },
  });
});
