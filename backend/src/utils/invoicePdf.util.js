import PDFDocument from 'pdfkit';

function fmt(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function streamInvoicePdf(invoice, res) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNo || 'invoice'}.pdf"`);
  doc.pipe(res);

  doc.fontSize(20).fillColor('#1e40af').text('TAX INVOICE', { align: 'left' });
  doc.fontSize(10).fillColor('#666').text(invoice.invoiceNo || '', { align: 'left' });
  doc.moveDown();

  doc.fillColor('#000').fontSize(11);
  doc.text(`From: ${invoice.dealerName || 'Dealer'}`);
  if (invoice.dealerGstin) doc.text(`GSTIN: ${invoice.dealerGstin}`);
  doc.moveDown(0.5);
  doc.text(`Bill To: ${invoice.customer || ''}`);
  if (invoice.customerGstin) doc.text(`Customer GSTIN: ${invoice.customerGstin}`);
  doc.text(`Issued: ${fmtDate(invoice.issuedAt)}`);
  doc.text(`Bill Ref: ${invoice.billNo || '—'}`);
  doc.moveDown();

  const tableTop = doc.y;
  const cols = [30, 180, 60, 50, 70, 80];
  let x = 50;
  ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Amount'].forEach((h, i) => {
    doc.fontSize(9).fillColor('#444').text(h, x, tableTop, { width: cols[i], align: i >= 3 ? 'right' : 'left' });
    x += cols[i];
  });
  doc.moveTo(50, tableTop + 14).lineTo(545, tableTop + 14).stroke('#ccc');

  let y = tableTop + 20;
  (invoice.lineItems || []).forEach((item, i) => {
    x = 50;
    const amount = item.amount || item.quantity * item.unitPrice;
    const row = [String(i + 1), item.product || '', item.hsn || '', String(item.quantity), fmt(item.unitPrice), fmt(amount)];
    row.forEach((cell, ci) => {
      doc.fontSize(9).fillColor('#000').text(cell, x, y, { width: cols[ci], align: ci >= 3 ? 'right' : 'left' });
      x += cols[ci];
    });
    y += 18;
  });

  doc.y = y + 10;
  const totalsX = 380;
  if (invoice.cgst > 0) doc.text(`CGST: ${fmt(invoice.cgst)}`, totalsX, doc.y, { align: 'right', width: 165 });
  if (invoice.sgst > 0) doc.text(`SGST: ${fmt(invoice.sgst)}`, totalsX, doc.y + 14, { align: 'right', width: 165 });
  if (invoice.igst > 0) doc.text(`IGST: ${fmt(invoice.igst)}`, totalsX, doc.y + 14, { align: 'right', width: 165 });
  doc.fontSize(12).fillColor('#1e40af').text(`Total: ${fmt(invoice.amount)}`, totalsX, doc.y + 32, { align: 'right', width: 165 });

  doc.fontSize(8).fillColor('#888').text(
    'Computer-generated invoice. Authorized signatory not required.',
    50,
    750,
    { align: 'center', width: 500 }
  );

  doc.end();
}
