import { useRef } from 'react';
import { Download, Printer } from 'lucide-react';
import { useEntityDetail } from '@/hooks/useEntityDetail';
import { invoicesService } from '@/services/invoices.service';
import { queryKeys } from '@/services/api/queryKeys';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/utils/format';
import { toast } from '@/utils/toast';

export function InvoicePreview({ id }) {
  const printRef = useRef(null);
  const { data, isLoading, isError, refetch } = useEntityDetail(queryKeys.invoices.detail, invoicesService.getDetail, id);

  if (isLoading) return <LoadingState message="Loading invoice…" />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  const lineItems = data.lineItems || [];

  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  const handleDownload = async () => {
    try {
      await invoicesService.downloadPdf(id, data.invoiceNo);
      toast.success('Invoice downloaded');
    } catch {
      toast.error('Failed to download invoice');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-3.5 w-3.5" /> Print</Button>
        <Button size="sm" onClick={handleDownload}><Download className="h-3.5 w-3.5" /> Download PDF</Button>
      </div>

      <div ref={printRef} className="mx-auto max-w-3xl rounded-xl border border-surface-3 bg-white p-8 shadow-md print:shadow-none print:border-0">
        <div className="flex items-start justify-between border-b border-surface-3 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-brand-700">TAX INVOICE</h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{data.invoiceNo}</p>
          </div>
          <StatusBadge status={data.status} />
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">From</p>
            <p className="mt-1 font-semibold">{data.dealerName || 'Sharma Motors'}</p>
            <p className="text-[var(--color-text-secondary)]">{data.dealerAddress || 'Jaipur, Rajasthan'}</p>
            <p className="mt-1">GSTIN: {data.dealerGstin || '08AABCS1429B1Z5'}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">Bill To</p>
            <p className="mt-1 font-semibold">{data.customer}</p>
            {data.customerGstin && <p className="mt-1">GSTIN: {data.customerGstin}</p>}
            <p className="mt-2 text-[var(--color-text-tertiary)]">Issued: {formatDate(data.issuedAt)}</p>
            <p className="text-[var(--color-text-tertiary)]">Ref: {data.billNo}</p>
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-surface-3 text-left text-xs uppercase text-[var(--color-text-secondary)]">
              <th className="pb-2">#</th>
              <th className="pb-2">Description</th>
              <th className="pb-2">HSN</th>
              <th className="pb-2 text-right">Qty</th>
              <th className="pb-2 text-right">Rate</th>
              <th className="pb-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, i) => (
              <tr key={i} className="border-b border-surface-3">
                <td className="py-2.5">{i + 1}</td>
                <td className="py-2.5">{item.product}</td>
                <td className="py-2.5">{item.hsn}</td>
                <td className="py-2.5 text-right tabular-nums">{item.quantity}</td>
                <td className="py-2.5 text-right tabular-nums">{formatCurrency(item.unitPrice)}</td>
                <td className="py-2.5 text-right tabular-nums">{formatCurrency(item.amount || item.quantity * item.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-6 ml-auto max-w-xs space-y-1.5 text-sm">
          {data.cgst > 0 && <div className="flex justify-between"><dt>CGST</dt><dd className="tabular-nums">{formatCurrency(data.cgst)}</dd></div>}
          {data.sgst > 0 && <div className="flex justify-between"><dt>SGST</dt><dd className="tabular-nums">{formatCurrency(data.sgst)}</dd></div>}
          {data.igst > 0 && <div className="flex justify-between"><dt>IGST</dt><dd className="tabular-nums">{formatCurrency(data.igst)}</dd></div>}
          <div className="flex justify-between border-t-2 border-surface-3 pt-2 text-lg font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums text-brand-700">{formatCurrency(data.amount)}</dd>
          </div>
        </dl>

        <p className="mt-8 text-center text-xs text-[var(--color-text-tertiary)]">
          This is a computer-generated invoice. Authorized signatory not required.
        </p>
      </div>
    </div>
  );
}
