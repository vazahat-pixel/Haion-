import PDFDocument from 'pdfkit';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function streamWarrantyPdf(warranty, res) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="warranty-${warranty.serialNo || 'certificate'}.pdf"`);
  doc.pipe(res);

  doc.fontSize(22).fillColor('#4f46e5').text('WARRANTY CERTIFICATE', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#64748b').text('Haion Industries — Manufacturer Warranty', { align: 'center' });
  doc.moveDown(1.5);

  doc.fillColor('#000').fontSize(11);
  const rows = [
    ['Serial Number', warranty.serialNo || '—'],
    ['Product', warranty.product || '—'],
    ['Customer', warranty.customerName || warranty.customer || '—'],
    ['Bill / Invoice No.', warranty.billNo || '—'],
    ['Coverage Start', fmtDate(warranty.startDate)],
    ['Coverage End', fmtDate(warranty.endDate)],
    ['Status', warranty.status || '—'],
    ['Warranty Period', `${warranty.warrantyMonths || 12} months`],
  ];

  rows.forEach(([label, value]) => {
    doc.font('Helvetica-Bold').text(`${label}:`, { continued: true });
    doc.font('Helvetica').text(` ${value}`);
    doc.moveDown(0.3);
  });

  doc.moveDown(1);
  doc.fontSize(9).fillColor('#64748b').text(
    'This certificate confirms manufacturer warranty coverage subject to standard terms and conditions. '
    + 'For service, quote your bill number at any authorized service center.',
    { align: 'justify' }
  );

  doc.end();
}
