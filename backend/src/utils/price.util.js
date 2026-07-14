/** Parse display prices like "₹70,000" or "70000" into rupees (number). */
export function parsePrice(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const n = parseFloat(String(value ?? '').replace(/[₹,\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** Convert rupees to paise for Razorpay. */
export function toPaise(rupees) {
  return Math.round(parsePrice(rupees) * 100);
}
