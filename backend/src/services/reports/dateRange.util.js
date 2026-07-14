export function parseDateRange(fromDate, toDate) {
  const now = new Date();
  const from = fromDate ? new Date(fromDate) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = toDate ? new Date(toDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  if (from > to) {
    throw new Error('From date must be before to date');
  }
  return { from, to };
}

export function formatPeriodLabel(from, to) {
  const opts = { day: 'numeric', month: 'short', year: 'numeric' };
  return `${from.toLocaleDateString('en-IN', opts)} – ${to.toLocaleDateString('en-IN', opts)}`;
}

export function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
