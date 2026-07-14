import { z } from 'zod';

const lineItemSchema = z.object({
  productId: z.string().optional(),
  sku: z.string().min(1),
  name: z.string().min(1),
  hsn: z.string().optional(),
  quantity: z.coerce.number().int().min(1),
  unitPrice: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).optional(),
  gstRate: z.coerce.number().refine((v) => [0, 5, 12, 18, 28].includes(v)),
});

const additionalChargeSchema = z.object({
  label: z.string().min(1),
  amount: z.coerce.number().min(0),
});

export const createPurchaseSchema = z.object({
  billNo: z.string().min(1).max(60),
  purchaseInvDate: z.string().optional(),
  originalInvNo: z.string().max(60).optional(),
  paymentTermsDays: z.coerce.number().min(0).optional(),
  dueDate: z.string().optional(),
  partyId: z.string().min(1),
  warehouseId: z.string().min(1),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item required'),
  orderDiscount: z.coerce.number().min(0).optional(),
  additionalCharges: z.array(additionalChargeSchema).optional(),
  amountPaid: z.coerce.number().min(0).optional(),
  termsAndConditions: z.string().max(2000).optional(),
  signatureUrl: z.string().optional().nullable(),
  notes: z.string().max(1000).optional(),
});

export const updatePurchaseSchema = createPurchaseSchema.partial();
