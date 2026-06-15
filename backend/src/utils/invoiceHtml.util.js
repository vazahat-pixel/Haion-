import { env } from '../config/env.js';

function fmt(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function buildInvoiceHtml(invoice) {
  const lines = (invoice.lineItems || [])
    .map(
      (item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${item.product || ''}</td>
        <td>${item.hsn || ''}</td>
        <td style="text-align:right">${item.quantity}</td>
        <td style="text-align:right">${fmt(item.unitPrice)}</td>
        <td style="text-align:right">${fmt(item.amount || item.quantity * item.unitPrice)}</td>
      </tr>`
    )
    .join('');

  const subtotal = invoice.lineItems?.reduce((s, l) => s + (l.amount || l.quantity * l.unitPrice || 0), 0) || invoice.total;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${invoice.invoiceNo}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; margin: 40px; }
    h1 { color: #1e40af; margin: 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: 8px; font-size: 13px; }
    th { text-align: left; background: #f9fafb; font-size: 11px; text-transform: uppercase; }
    .totals { margin-top: 16px; width: 280px; margin-left: auto; }
    .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
    .grand { font-weight: bold; font-size: 16px; border-top: 2px solid #111; padding-top: 8px; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #e5e7eb;padding-bottom:16px">
    <div>
      <h1>TAX INVOICE</h1>
      <p style="color:#6b7280;margin:4px 0 0">${invoice.invoiceNo}</p>
    </div>
    <div style="text-align:right;font-size:13px">
      <strong>Status:</strong> ${invoice.status}<br/>
      <strong>Date:</strong> ${fmtDate(invoice.issuedAt)}
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:24px;font-size:13px">
    <div>
      <p style="font-size:11px;text-transform:uppercase;color:#6b7280;margin:0">From</p>
      <p style="font-weight:600;margin:4px 0">${invoice.dealerName || env.companyName}</p>
      <p style="margin:0;color:#374151">${invoice.dealerAddress || ''}</p>
      <p style="margin:4px 0 0">GSTIN: ${invoice.dealerGstin || env.companyGstin}</p>
    </div>
    <div>
      <p style="font-size:11px;text-transform:uppercase;color:#6b7280;margin:0">Bill To</p>
      <p style="font-weight:600;margin:4px 0">${invoice.customerName || invoice.customer || ''}</p>
      ${invoice.customerGstin ? `<p style="margin:0">GSTIN: ${invoice.customerGstin}</p>` : ''}
      <p style="margin:4px 0 0;color:#6b7280">Bill Ref: ${invoice.billNo}</p>
    </div>
  </div>
  <table>
    <thead>
      <tr><th>#</th><th>Description</th><th>HSN</th><th style="text-align:right">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr>
    </thead>
    <tbody>${lines}</tbody>
  </table>
  <div class="totals">
    <div><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
    ${invoice.cgst ? `<div><span>CGST</span><span>${fmt(invoice.cgst)}</span></div>` : ''}
    ${invoice.sgst ? `<div><span>SGST</span><span>${fmt(invoice.sgst)}</span></div>` : ''}
    ${invoice.igst ? `<div><span>IGST</span><span>${fmt(invoice.igst)}</span></div>` : ''}
    <div class="grand"><span>Grand Total</span><span>${fmt(invoice.total)}</span></div>
  </div>
  <p style="margin-top:40px;font-size:11px;color:#9ca3af;text-align:center">Computer-generated invoice from ${env.companyName}</p>
</body>
</html>`;
}
