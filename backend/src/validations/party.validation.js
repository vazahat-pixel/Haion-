import { z } from 'zod';
import { PARTY_TYPES } from '../models/Party.model.js';

const bankAccountSchema = z.object({
  accountNumber: z.string().min(1),
  ifsc: z.string().optional(),
  accountHolderName: z.string().optional(),
  bankName: z.string().optional(),
  branchName: z.string().optional(),
  upiId: z.string().optional(),
});

export const createPartySchema = z.object({
  code: z.string().min(2).max(30).regex(/^[A-Z0-9-_]+$/, 'Code must be uppercase alphanumeric').optional(),
  name: z.string().min(2).max(150),
  type: z.enum(PARTY_TYPES).default('SUPPLIER'),
  partyCategory: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal('')),
  openingBalance: z.coerce.number().optional(),
  gstin: z.string()
    .transform((v) => v.toUpperCase().replace(/\s/g, ''))
    .pipe(z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format'))
    .optional()
    .or(z.literal('')),
  pan: z.string().max(10).optional(),
  billingAddress: z.string().max(500).optional(),
  shippingAddress: z.string().max(500).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  creditPeriodDays: z.coerce.number().min(0).optional(),
  creditLimit: z.coerce.number().min(0).optional(),
  contactPerson: z.string().max(100).optional(),
  dateOfBirth: z.string().optional().nullable(),
  bankAccounts: z.array(bankAccountSchema).optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const updatePartySchema = createPartySchema.partial();
