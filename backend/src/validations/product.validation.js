import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1).max(150),
  sku: z.string().min(1).max(30).regex(/^[A-Z0-9-]+$/, 'SKU must be alphanumeric uppercase'),
  category: z.string().min(1),
  description: z.string().max(500).optional(),
  hsnCode: z.string().regex(/^\d{4,8}$/, 'HSN must be 4-8 digits'),
  unitOfMeasure: z.enum(['Piece', 'Box', 'Set', 'Kit']).default('Piece'),
  imageUrl: z.string().url().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const updateProductSchema = createProductSchema.partial();

export const createTierSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(20),
  basePrice: z.number().positive(),
  gstRate: z.union([z.literal(0), z.literal(5), z.literal(12), z.literal(18), z.literal(28)]),
  warrantyDuration: z.number().int().positive(),
  warrantyUnit: z.enum(['Months', 'Years']).default('Months'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const updateTierSchema = createTierSchema.partial();
