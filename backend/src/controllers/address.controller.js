import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { PINCODE_DIRECTORY, INDIAN_STATES } from '../data/pincode.data.js';

export const lookupPincode = asyncHandler(async (req, res) => {
  const pin = (req.params.pin || '').trim();
  if (!/^\d{6}$/.test(pin)) {
    return sendError(res, { message: 'Pincode must be 6 digits', statusCode: 422 });
  }
  const entry = PINCODE_DIRECTORY[pin];
  if (!entry) {
    return sendError(res, { message: 'Pincode not found', statusCode: 404 });
  }
  return sendSuccess(res, { data: { pincode: pin, ...entry } });
});

export const listStates = asyncHandler(async (_req, res) => {
  return sendSuccess(res, { data: INDIAN_STATES });
});
