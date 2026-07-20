import { z } from 'zod';

const componentSchema = z.object({
  productId: z.string().optional(),
  sku: z.string().min(1),
  name: z.string().min(1).optional(),
  qtyPerUnit: z.coerce.number().positive('Qty per unit must be greater than 0'),
});

const newFinishedProductSchema = z.object({
  name: z.string().min(1).max(150),
  sku: z.string().min(1).max(30),
  category: z.string().min(1).optional(),
  brand: z.string().max(100).optional(),
  hsnCode: z.string().min(4).max(8).optional(),
  gstRate: z.coerce.number().refine((v) => [0, 5, 12, 18, 28].includes(v)).optional(),
  unitOfMeasure: z.enum(['Piece', 'Box', 'Set', 'Kit']).optional(),
});

export const createManufactureSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse is required'),
  finishedProductId: z.string().optional(),
  newFinishedProduct: newFinishedProductSchema.optional(),
  qtyProduced: z.coerce.number().int().min(1, 'Produce at least 1 unit'),
  /** Admin selling price per finished unit (required for inventory valuation) */
  sellingPrice: z.coerce.number().min(0, 'Selling price cannot be negative'),
  components: z.array(componentSchema).min(1, 'Select at least one raw material'),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => Boolean(data.finishedProductId) || Boolean(data.newFinishedProduct?.name && data.newFinishedProduct?.sku),
  { message: 'Select an existing finished product or create a new one', path: ['finishedProductId'] }
);
