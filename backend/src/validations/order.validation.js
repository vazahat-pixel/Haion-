import { z } from 'zod';

export const createOrderSchema = z.object({
  customerName: z.string().min(1).max(150).optional(),
  dealerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid dealerId format').optional(),
  lineItems: z.array(
    z.object({
      productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid productId format').optional(),
      sku: z.string().min(1).max(50),
      name: z.string().min(1).max(200),
      quantity: z.number().int().positive(),
      unitPrice: z.number().nonnegative(),
    })
  ).min(1, 'Order must contain at least one item'),
  status: z.enum(['CONFIRMED']).default('CONFIRMED').optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PROCESSING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']),
  notes: z.string().max(500).optional(),
  trackingNo: z.string().max(100).optional(),
  eta: z.coerce.date().optional(),
});
