/**
 * Parse display prices into rupees (number).
 * Handles all variants found in CMS product data:
 *   "₹70,000"  "? 9,499"  "?1,44,999"  "? 28,999"  70000
 * The '?' is the garbled UTF-8 encoding of '₹' sometimes stored in CMS.
 */
export function parsePrice(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  // Strip currency symbols (₹ and its common garbled variants), commas, spaces
  const cleaned = String(value ?? '')
    .replace(/[₹?？\u20B9\u00A0\u202F,\s]/g, '') // ₹, ?, ?, non-breaking spaces, commas
    .trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/** Convert rupees to paise for Razorpay. */
export function toPaise(rupees) {
  return Math.round(parsePrice(rupees) * 100);
}
