const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function validateGSTIN(gstin) {
  return GSTIN_REGEX.test(gstin?.toUpperCase());
}

export function extractStateCodeFromGSTIN(gstin) {
  if (!gstin || gstin.length < 2) return null;
  return gstin.substring(0, 2);
}

export function isInterstate(companyStateCode, partyStateCode) {
  return companyStateCode !== partyStateCode;
}

export function calculateGST({ amount, rate, isInterstate: interstate }) {
  const taxAmount = (amount * rate) / 100;
  if (interstate) {
    return { cgst: 0, sgst: 0, igst: taxAmount, total: taxAmount };
  }
  const half = taxAmount / 2;
  return { cgst: half, sgst: half, igst: 0, total: taxAmount };
}
