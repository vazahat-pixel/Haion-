export function nextSequence(prefix, year = new Date().getFullYear(), pad = 4) {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${year}-${String(n).padStart(pad, '0')}`;
}
