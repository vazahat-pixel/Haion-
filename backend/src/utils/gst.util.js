export function extractStateCodeFromGSTIN(gstin) {
  if (!gstin || gstin.length < 2) return null;
  return gstin.substring(0, 2);
}

export function isInterState(companyStateCode, partyStateCode) {
  return companyStateCode !== partyStateCode;
}

export function calculateLineGST({ amount, gstRate, isInterState: interstate }) {
  const taxAmount = Math.round((amount * gstRate) / 100 * 100) / 100;
  if (interstate) {
    return { cgst: 0, sgst: 0, igst: taxAmount, totalGST: taxAmount };
  }
  const half = Math.round((taxAmount / 2) * 100) / 100;
  return { cgst: half, sgst: half, igst: 0, totalGST: taxAmount };
}

export function calculateInvoiceTotals(lineItems, companyStateCode, customerStateCode) {
  const interstate = isInterState(companyStateCode, customerStateCode);
  let subtotal = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  const items = lineItems.map((item) => {
    const lineSubtotal = item.quantity * item.unitPrice;
    const gst = calculateLineGST({ amount: lineSubtotal, gstRate: item.gstRate, isInterState: interstate });
    subtotal += lineSubtotal;
    totalCGST += gst.cgst;
    totalSGST += gst.sgst;
    totalIGST += gst.igst;
    return {
      ...item,
      cgst: gst.cgst,
      sgst: gst.sgst,
      igst: gst.igst,
      lineTotal: lineSubtotal + gst.totalGST,
    };
  });

  const grandTotal = Math.round((subtotal + totalCGST + totalSGST + totalIGST) * 100) / 100;

  return {
    lineItems: items,
    subtotal: Math.round(subtotal * 100) / 100,
    totalCGST: Math.round(totalCGST * 100) / 100,
    totalSGST: Math.round(totalSGST * 100) / 100,
    totalIGST: Math.round(totalIGST * 100) / 100,
    totalGST: Math.round((totalCGST + totalSGST + totalIGST) * 100) / 100,
    grandTotal,
    isInterState: interstate,
  };
}
