/**
 * Excel (.xlsx) import / export for the Distributor panel. ExcelJS is loaded on demand so it does not
 * weigh down the first page load. CSV files are still accepted on import.
 */
const loadExcel = async () => (await import('exceljs')).default;

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF337AB7' } }; // reference table header blue

function save(buffer, filename) {
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const numeric = (v) => (typeof v === 'number' ? v : typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim()) && v.trim().length < 15 ? Number(v) : v);

/** Export rows as a formatted .xlsx. columns: [{ label, key, text?(row) }] */
export async function exportXlsx(name, columns, rows, { title } = {}) {
  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Distributor DMS';
  wb.created = new Date();
  const ws = wb.addWorksheet((title || name).slice(0, 31).replace(/[\\/?*[\]:]/g, ' '));
  let r = 1;
  if (title) {
    ws.mergeCells(1, 1, 1, Math.max(1, columns.length));
    ws.getCell(1, 1).value = title;
    ws.getCell(1, 1).font = { bold: true, size: 13 };
    r = 3;
  }
  const head = ws.getRow(r);
  columns.forEach((c, i) => {
    const cell = head.getCell(i + 1);
    cell.value = c.label;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  rows.forEach((row, ri) => {
    const xr = ws.getRow(r + 1 + ri);
    columns.forEach((c, i) => {
      const v = c.text ? c.text(row) : row[c.key];
      xr.getCell(i + 1).value = v === undefined || v === null ? '' : numeric(typeof v === 'object' ? String(v) : v);
    });
  });
  ws.views = [{ state: 'frozen', ySplit: r }];
  columns.forEach((c, i) => {
    const len = Math.max(String(c.label).length, ...rows.slice(0, 200).map((row) => String((c.text ? c.text(row) : row[c.key]) ?? '').length));
    ws.getColumn(i + 1).width = Math.min(45, Math.max(8, len + 2));
  });
  save(await wb.xlsx.writeBuffer(), `${name.replace(/[^\w.-]+/g, '_')}.xlsx`);
}

/** Download an upload template: header row (bold), sample rows, and an Instructions sheet. */
export async function downloadTemplate(name, headers, samples = [], notes = []) {
  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Data');
  ws.addRow(headers);
  ws.getRow(1).eachCell((c) => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = HEADER_FILL; });
  samples.forEach((s) => ws.addRow(s));
  headers.forEach((h, i) => { ws.getColumn(i + 1).width = Math.max(14, h.length + 4); });
  const info = wb.addWorksheet('Instructions');
  ['Fill the "Data" sheet. Keep the header row exactly as it is.', 'One record per row. Do not merge cells.', ...notes].forEach((n) => info.addRow([n]));
  info.getColumn(1).width = 110;
  save(await wb.xlsx.writeBuffer(), `${name}.xlsx`);
}

function parseCsvText(text) {
  const out = [];
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim());
  const split = (line) => {
    const cells = []; let cur = ''; let q = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i += 1; } else q = !q; } else if (ch === ',' && !q) { cells.push(cur); cur = ''; } else cur += ch;
    }
    cells.push(cur);
    return cells.map((c) => c.trim());
  };
  const head = split(lines.shift() || '');
  for (const l of lines) { const c = split(l); out.push(Object.fromEntries(head.map((h, i) => [h, c[i] ?? '']))); }
  return out;
}

/** Read the first sheet of an .xlsx (or a .csv) into [{ header: value }]. Blank rows are skipped. */
export async function readSheet(file) {
  if (!file) return [];
  if (/\.csv$/i.test(file.name) || /\.txt$/i.test(file.name)) return parseCsvText(await file.text());
  if (!/\.xlsx$/i.test(file.name)) throw new Error('Upload an .xlsx or .csv file');
  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const ws = wb.worksheets[0];
  if (!ws) return [];
  const cellText = (v) => {
    if (v === null || v === undefined) return '';
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    if (typeof v === 'object') return String(v.text ?? v.result ?? v.richText?.map((t) => t.text).join('') ?? '');
    return String(v).trim();
  };
  const headers = [];
  ws.getRow(1).eachCell({ includeEmpty: true }, (c, i) => { headers[i - 1] = cellText(c.value); });
  const rows = [];
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const o = {};
    let any = false;
    headers.forEach((h, i) => { if (!h) return; const v = cellText(row.getCell(i + 1).value); if (v !== '') any = true; o[h] = v; });
    if (any) rows.push(o);
  });
  return rows;
}

/** Read a one-column list (serial numbers) from .xlsx / .csv / .txt. */
export async function readList(file) {
  if (/\.xlsx$/i.test(file.name)) {
    const rows = await readSheet(file);
    const first = rows.length ? Object.keys(rows[0])[0] : null;
    return rows.map((r) => r[first]).filter(Boolean);
  }
  return (await file.text()).replace(/\r/g, '').split(/[\n,;]+/).map((s) => s.trim()).filter((s) => s && !/^serial/i.test(s));
}
