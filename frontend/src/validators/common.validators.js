import { z } from 'zod';

export const phoneValidator = z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number');
export const gstinValidator = z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN');
export const pincodeValidator = z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid pincode');
export const panValidator = z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN');
