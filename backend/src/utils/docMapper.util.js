import { toPublicDoc } from './serialize.util.js';

export function mapWarehouse(doc) {
  if (!doc) return doc;
  const d = toPublicDoc(doc);
  return {
    ...d,
    manager: d.managerName,
    stockCount: d.stockCount ?? 0,
    updatedAt: d.updatedAt,
  };
}

export function mapInventory(doc) {
  if (!doc) return doc;
  const d = toPublicDoc(doc);
  return {
    ...d,
    warehouse: d.warehouse?.code || d.warehouseCode || d.warehouse,
    hsn: d.hsn || d.hsnCode,
  };
}

export function mapDealer(doc) {
  return toPublicDoc(doc);
}

export function mapGRN(doc) {
  if (!doc) return doc;
  const d = toPublicDoc(doc);
  return {
    ...d,
    warehouse: d.warehouse?.code || d.warehouse,
    items: d.items ?? d.lineItems?.length ?? 0,
    receivedAt: d.receivedAt || d.createdAt,
  };
}

export function mapDispatch(doc) {
  if (!doc) return doc;
  const d = toPublicDoc(doc);
  return {
    ...d,
    dealer: d.dealer?.name || d.dealer,
    warehouse: d.warehouse?.code || d.warehouse,
    items: d.items ?? 0,
    createdAt: d.createdAt,
  };
}

export function mapDealerInventory(doc) {
  return toPublicDoc(doc);
}

export function mapCustomer(doc) {
  if (!doc) return doc;
  const d = toPublicDoc(doc);
  const member = d.assignedSalesMember;
  const memberId = member?._id || member?.id || (typeof member === 'string' ? member : null);
  return {
    ...d,
    dealerId: d.dealer ? String(d.dealer) : d.dealerId,
    assignedSalesMember: memberId ? String(memberId) : null,
    assignedSalesMemberName: member?.name || null,
  };
}

export function mapBill(doc) {
  if (!doc) return doc;
  const d = toPublicDoc(doc);
  return {
    ...d,
    customer: d.customerName || d.customer?.name || d.customer,
    amount: d.amount ?? d.subtotal,
    tax: d.tax ?? (d.cgst + d.sgst + d.igst),
    total: d.total ?? d.grandTotal,
    dueDate: d.dueDate,
    createdAt: d.createdAt,
  };
}

export function mapInvoice(doc) {
  if (!doc) return doc;
  const d = toPublicDoc(doc);
  return {
    ...d,
    customer: d.customerName || d.customer,
    amount: d.total ?? d.amount,
    issuedAt: d.issuedAt || d.createdAt,
  };
}

export function mapEmployee(doc) {
  if (!doc) return doc;
  const d = toPublicDoc(doc);
  return {
    ...d,
    name: d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim(),
    joinedAt: d.joinedAt || d.createdAt,
  };
}

export function mapApproval(doc) {
  if (!doc) return doc;
  const d = toPublicDoc(doc);
  return {
    ...d,
    submittedAt: d.submittedAt || d.createdAt,
  };
}

export function mapOrder(doc) {
  if (!doc) return doc;
  const d = toPublicDoc(doc);
  return {
    ...d,
    items: d.items ?? d.lineItems?.length ?? 0,
    placedAt: d.placedAt || d.createdAt,
  };
}

export function mapReport(doc) {
  return toPublicDoc(doc);
}

export function mapExpense(doc) {
  if (!doc) return doc;
  const d = toPublicDoc(doc);
  return { ...d, submittedAt: d.submittedAt || d.createdAt };
}

export function mapPricingRule(doc) {
  if (!doc) return doc;
  const d = toPublicDoc(doc);
  return {
    ...d,
    product: d.productName || d.product,
    gst: d.gst ?? d.gstRate,
  };
}

export function mapDealerTeamMember(doc) {
  return toPublicDoc(doc);
}

export function mapDealerReport(doc) {
  if (!doc) return doc;
  const d = toPublicDoc(doc);
  return { ...d, createdAt: d.createdAt };
}

export function mapAuditLog(doc) {
  if (!doc) return doc;
  const d = toPublicDoc(doc);
  return {
    ...d,
    timestamp: d.timestamp || d.createdAt,
  };
}

export function mapWarranty(doc) {
  if (!doc) return doc;
  const d = toPublicDoc(doc);
  return {
    ...d,
    customer: d.customerName || d.customer,
    product: d.product,
    billNo: d.billNo,
  };
}
