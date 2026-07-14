import { Phone, Mail, Globe, MapPin } from 'lucide-react';
import { assetUrl, resolveInvoiceLogo } from '@/constants/business';
import { resolveEffectiveInvoiceTheme, amountInWords } from '@/constants/invoiceThemes';
import {
  CornerFlourish,
  FestivalWatermark,
  GoldDivider,
  HaionBrandStrip,
} from './InvoiceDecorations';

const SAMPLE_LINES = [
  { name: 'HAION TIGER Scooter', desc: 'Premium electric scooter', hsn: '87116020', qty: 1, unit: 'PCS', rate: 42857.14, disc: 0, tax: 5, cgst: 1071.43, sgst: 1071.43, total: 45000 },
  { name: 'Battery Pack 48V', desc: 'Lithium-ion battery', hsn: '85076000', qty: 1, unit: 'PCS', rate: 12000, disc: 5, tax: 18, cgst: 1026, sgst: 1026, total: 13374 },
];

function fmt(n) {
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d) {
  if (!d) return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function InvoicePreview({ business: biz = {}, invoice: inv = {}, bill, compact = false }) {
  const theme = resolveEffectiveInvoiceTheme(inv);
  const lines = bill?.lineItems?.length
    ? bill.lineItems.map((item) => {
        const qty = item.quantity || 1;
        const rate = item.unitPrice || 0;
        const amount = item.amount || qty * rate;
        const taxPct = item.taxPercent || item.tax || 0;
        const taxAmt = item.taxAmount || (amount * taxPct) / (100 + taxPct);
        return {
          name: item.product || item.name || 'Item',
          desc: item.description || '',
          hsn: item.hsn || '—',
          qty,
          unit: item.unit || 'PCS',
          rate,
          disc: item.discount || 0,
          tax: taxPct,
          cgst: taxAmt / 2,
          sgst: taxAmt / 2,
          total: amount,
        };
      })
    : SAMPLE_LINES;

  const subtotal = lines.reduce((s, l) => s + l.rate * l.qty * (1 - l.disc / 100), 0);
  const tax = bill?.cgst != null || bill?.sgst != null
    ? (bill.cgst || 0) + (bill.sgst || 0) + (bill.igst || 0)
    : lines.reduce((s, l) => s + (l.cgst || 0) + (l.sgst || 0), 0);
  const total = bill?.amount != null ? Math.round(bill.amount) : Math.round(subtotal + tax);
  const dark = theme.darkHeader;
  const fs = compact ? 8 : 10;
  const colSpan = 2 + (inv.showHsn !== false ? 1 : 0) + 2 + (inv.showDiscount !== false ? 1 : 0) + 2;

  const metaStyle = { color: dark ? 'rgba(254,243,199,0.85)' : '#64748b', fontFamily: theme.fontBody, fontSize: fs };
  const bodyStyle = { fontFamily: theme.fontBody, fontSize: fs };

  return (
    <div className="relative overflow-hidden bg-white" style={bodyStyle}>
      {/* Festival ribbon */}
      {theme.ribbonBg && theme.ribbonText && (
        <div
          className="relative z-10 px-4 py-1.5 text-center uppercase tracking-[0.25em]"
          style={{
            background: theme.ribbonBg,
            color: '#fff',
            fontFamily: theme.fontDisplay,
            fontSize: compact ? 8 : 10,
            fontWeight: 600,
            letterSpacing: '0.2em',
          }}
        >
          {theme.ribbonText}
        </div>
      )}

      {/* Double border frame */}
      <div className="relative m-3" style={{ border: `2px solid ${theme.border}` }}>
        <div className="relative m-1.5" style={{ border: `1px solid ${theme.borderInner}` }}>
          <FestivalWatermark motif={theme.motif} color={theme.accent} />

          <CornerFlourish color={theme.border} className="absolute left-0 top-0" size={compact ? 28 : 36} />
          <CornerFlourish color={theme.border} className="absolute right-0 top-0 rotate-90" size={compact ? 28 : 36} />
          <CornerFlourish color={theme.border} className="absolute bottom-0 left-0 -rotate-90" size={compact ? 28 : 36} />
          <CornerFlourish color={theme.border} className="absolute bottom-0 right-0 rotate-180" size={compact ? 28 : 36} />

          {/* Header */}
          <div className="relative px-5 pb-4 pt-6" style={{ background: theme.headerBg }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                {inv.showLogo !== false && (
                  <div
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 bg-white p-1.5 shadow-sm"
                    style={{ borderColor: theme.border }}
                  >
                    <img
                      src={resolveInvoiceLogo(biz.logoUrl)}
                      alt="Haion"
                      className="h-full w-full rounded-full object-contain"
                    />
                  </div>
                )}
                <div>
                  <h1
                    className="leading-tight"
                    style={{
                      fontFamily: theme.fontDisplay,
                      fontSize: compact ? 16 : 22,
                      fontWeight: 700,
                      color: theme.headerText,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {biz.businessName || 'Haion Industries Pvt Ltd'}
                  </h1>
                  <div className="mt-2 space-y-0.5" style={metaStyle}>
                    {biz.pan && (
                      <p><span className="font-semibold" style={{ color: theme.headerText }}>PAN </span>{biz.pan}</p>
                    )}
                    {biz.gstin && (
                      <p><span className="font-semibold" style={{ color: theme.headerText }}>GSTIN </span>{biz.gstin}</p>
                    )}
                    {biz.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 shrink-0 opacity-70" strokeWidth={1.75} />
                        {biz.phone}
                      </p>
                    )}
                    {biz.email && (
                      <p className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 shrink-0 opacity-70" strokeWidth={1.75} />
                        {biz.email}
                      </p>
                    )}
                    {biz.billingAddress && (
                      <p className="flex items-start gap-1.5 max-w-[260px] leading-snug">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0 opacity-70" strokeWidth={1.75} />
                        {biz.billingAddress}
                      </p>
                    )}
                    {biz.website && (
                      <p className="flex items-center gap-1.5 font-medium" style={{ color: theme.accent }}>
                        <Globe className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                        {biz.website}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p
                  className="uppercase tracking-[0.15em]"
                  style={{
                    fontFamily: theme.fontDisplay,
                    fontSize: compact ? 14 : 18,
                    fontWeight: 700,
                    color: dark ? theme.accentSecondary : theme.accentSecondary || theme.headerText,
                  }}
                >
                  {inv.invoiceTitle || 'TAX INVOICE'}
                </p>
                <div
                  className="mt-2 inline-block border px-2.5 py-1 uppercase tracking-wider"
                  style={{
                    borderColor: theme.border,
                    color: dark ? 'rgba(254,243,199,0.9)' : '#64748b',
                    fontSize: compact ? 7 : 8,
                    fontWeight: 600,
                  }}
                >
                  {inv.copyLabel || 'ORIGINAL FOR RECIPIENT'}
                </div>
              </div>
            </div>

            <GoldDivider color={theme.border} className="my-3" />

            <div className="grid grid-cols-3 gap-4" style={metaStyle}>
              <p>
                <span className="font-semibold" style={{ color: theme.headerText }}>Invoice No. </span>
                ({bill?.invoiceNo || 'INV-0001'})
              </p>
              <p>
                <span className="font-semibold" style={{ color: theme.headerText }}>Invoice Date </span>
                ({fmtDate(bill?.issuedAt)})
              </p>
              <p>
                <span className="font-semibold" style={{ color: theme.headerText }}>Due Date </span>
                ({fmtDate(Date.now() + (inv.dueDateDays || 30) * 86400000)})
              </p>
            </div>
          </div>

          <div className="h-px" style={{ background: theme.border }} />

          {/* Bill / Ship */}
          <div className="grid grid-cols-2" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <div className="border-r p-4" style={{ borderColor: theme.border }}>
              <p
                className="mb-2 uppercase tracking-[0.12em]"
                style={{ color: theme.accent, fontSize: compact ? 8 : 9, fontWeight: 700 }}
              >
                Bill To
              </p>
              <p className="font-semibold text-slate-900">{bill?.customer || 'Sample Customer'}</p>
              <p className="mt-0.5 text-slate-600">{bill?.customerAddress || `123 Sample Street, ${biz.city || 'City'}`}</p>
              <p className="text-slate-600">Mobile: {bill?.customerPhone || '9876543210'}</p>
              <p className="text-slate-600">GSTIN: {bill?.customerGstin || '—'}</p>
              <p className="text-slate-600">Place of Supply: {biz.state || 'State'}</p>
            </div>
            <div className="p-4">
              <p
                className="mb-2 uppercase tracking-[0.12em]"
                style={{ color: theme.accent, fontSize: compact ? 8 : 9, fontWeight: 700 }}
              >
                Ship To
              </p>
              <p className="font-semibold text-slate-900">{bill?.customer || 'Sample Customer'}</p>
              <p className="mt-0.5 text-slate-600">{biz.city || 'City'}, {biz.state || 'State'}</p>
            </div>
          </div>

          {/* Items table */}
          <table className="w-full text-left" style={{ fontSize: fs }}>
            <thead>
              <tr style={{ background: theme.tableHead, color: theme.tableHeadText }}>
                <th className="px-3 py-2.5 font-semibold">No</th>
                <th className="px-3 py-2.5 font-semibold">Items</th>
                {inv.showHsn !== false && <th className="px-3 py-2.5 font-semibold">HSN No.</th>}
                <th className="px-3 py-2.5 font-semibold">Qty.</th>
                <th className="px-3 py-2.5 font-semibold">Rate</th>
                {inv.showDiscount !== false && <th className="px-3 py-2.5 font-semibold">Disc.</th>}
                <th className="px-3 py-2.5 font-semibold">Tax</th>
                <th className="px-3 py-2.5 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="border-t border-slate-200">
                  <td className="px-3 py-2.5 text-slate-700">{i + 1}</td>
                  <td className="px-3 py-2.5">
                    <p className="font-semibold text-slate-900">{line.name}</p>
                    {line.desc && <p className="text-slate-500">{line.desc}</p>}
                  </td>
                  {inv.showHsn !== false && <td className="px-3 py-2.5 text-slate-700">{line.hsn}</td>}
                  <td className="px-3 py-2.5 text-slate-700">{line.qty} {line.unit}</td>
                  <td className="px-3 py-2.5 tabular-nums text-slate-700">₹ {fmt(line.rate)}</td>
                  {inv.showDiscount !== false && <td className="px-3 py-2.5 text-slate-700">{line.disc}%</td>}
                  <td className="px-3 py-2.5 text-slate-700">
                    ₹ {fmt((line.cgst || 0) + (line.sgst || 0))}
                    <span className="text-slate-400"> ({line.tax}%)</span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                    ₹ {fmt(line.total)}
                  </td>
                </tr>
              ))}
              <tr style={{ background: theme.accentLight }}>
                <td colSpan={colSpan - 1} className="px-3 py-2 text-right font-semibold text-slate-700">Subtotal</td>
                <td className="px-3 py-2 text-right font-bold tabular-nums text-slate-900">₹ {fmt(total)}</td>
              </tr>
            </tbody>
          </table>

          {/* Footer */}
          <div className="grid grid-cols-2" style={{ borderTop: `1px solid ${theme.border}` }}>
            <div className="space-y-3 border-r p-4" style={{ borderColor: theme.border }}>
              {inv.showNotes !== false && (
                <div>
                  <p className="mb-1 font-bold text-slate-800" style={{ fontSize: fs }}>Notes</p>
                  <p className="text-slate-600">{inv.notes || 'Thanks for your business.'}</p>
                </div>
              )}
              {inv.showTerms !== false && (inv.termsAndConditions || []).length > 0 && (
                <div>
                  <p className="mb-1 font-bold text-slate-800" style={{ fontSize: fs }}>Terms & Conditions</p>
                  <ol className="list-decimal space-y-0.5 pl-4 text-slate-600">
                    {(inv.termsAndConditions || []).map((t, i) => <li key={i}>{t}</li>)}
                  </ol>
                </div>
              )}
              {inv.showBankDetails !== false && (biz.bankName || biz.bankAccount) && (
                <div>
                  <p className="mb-1 font-bold text-slate-800" style={{ fontSize: fs }}>Bank Details</p>
                  <p className="text-slate-600">Name: {biz.accountHolderName || biz.businessName}</p>
                  {biz.ifsc && <p className="text-slate-600">IFSC Code: {biz.ifsc}</p>}
                  {biz.bankAccount && <p className="text-slate-600">Account No.: {biz.bankAccount}</p>}
                  {biz.bankName && <p className="text-slate-600">Bank: {biz.bankName}</p>}
                </div>
              )}
            </div>

            <div className="space-y-1 p-4 text-right">
              <p className="text-slate-700">
                Taxable Amount <span className="font-semibold tabular-nums">₹ {fmt(Math.round(subtotal))}</span>
              </p>
              {inv.showTaxBreakdown !== false && tax > 0 && (
                <>
                  <p className="text-slate-700">
                    CGST
                    <span className="ml-2 font-semibold tabular-nums">₹ {fmt(tax / 2)}</span>
                  </p>
                  <p className="text-slate-700">
                    SGST
                    <span className="ml-2 font-semibold tabular-nums">₹ {fmt(tax / 2)}</span>
                  </p>
                </>
              )}
              <div className="my-2 h-px bg-slate-200" />
              <p className="text-base font-bold tabular-nums" style={{ color: theme.accentSecondary || theme.accent }}>
                Total Amount: ₹ {fmt(total)}
              </p>
              <p className="text-slate-500">Received Amount: ₹ 0</p>
              <p className="text-slate-500">Balance: ₹ {fmt(total)}</p>
              <p className="mt-1 italic text-slate-600" style={{ fontSize: compact ? 7 : 9 }}>
                {amountInWords(total)}
              </p>

              {inv.showSignature !== false && (
                <div className="mt-4 flex flex-col items-end">
                  <div
                    className="rounded-lg border px-5 py-3"
                    style={{ borderColor: theme.borderInner }}
                  >
                    {biz.signatureUrl ? (
                      <img src={assetUrl(biz.signatureUrl)} alt="" className="mx-auto h-12 object-contain" />
                    ) : (
                      <div className="h-12 w-28" />
                    )}
                    <p className="mt-2 border-t pt-1.5 text-slate-500" style={{ fontSize: compact ? 7 : 8 }}>
                      Authorized Signatory
                    </p>
                    <p className="font-semibold text-slate-800" style={{ fontSize: fs }}>
                      {biz.businessName}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <HaionBrandStrip
            accent={theme.accent}
            accentLight={theme.accentLight}
            businessName={biz.businessName || 'Your Business'}
          />
        </div>
      </div>
    </div>
  );
}
