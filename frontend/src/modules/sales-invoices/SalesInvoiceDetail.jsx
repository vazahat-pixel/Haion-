import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Printer, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { salesInvoicesService } from '@/services/sales-invoices.service';
import { settingsService } from '@/services/settings.service';
import { queryKeys } from '@/services/api/queryKeys';
import { toast } from '@/utils/toast';
import { InvoicePreview as ThemedInvoicePreview } from '@/modules/business-settings/InvoicePreview';
import { formatCurrency } from '@/utils/format';

function Badge({ status }) {
  const colors = {
    DRAFT: 'bg-amber-100 text-amber-700 border-amber-200',
    SENT: 'bg-blue-100 text-blue-700 border-blue-200',
    PAID: 'bg-green-100 text-green-700 border-green-200',
    CANCELLED: 'bg-red-100 text-red-700 border-red-200',
  };
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colors[status] || 'bg-surface-2 text-[var(--color-text-secondary)]'}`}>
      {status}
    </span>
  );
}

function fmt(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function SalesInvoiceDetail({ id }) {
  const printRef = useRef(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.salesInvoices.detail(id),
    queryFn: () => salesInvoicesService.getDetail(id),
    enabled: !!id,
  });

  const { data: bundle } = useQuery({
    queryKey: ['settings', 'profile-bundle'],
    queryFn: settingsService.getProfileBundle,
  });

  if (isLoading) return <LoadingState message="Loading invoice…" />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  const companyName = bundle?.business?.businessName || data.dealerName || 'Company';

  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  const handleOpenPrint = async () => {
    try {
      // Fetch the HTML version from backend
      const res = await fetch(`/api/sales-invoices/${id}/pdf`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        credentials: 'include',
      });
      const html = await res.text();
      if (html) {
        const w = window.open('', '_blank', 'width=900,height=700');
        w.document.write(html);
        w.document.close();
      } else {
        throw new Error('No HTML');
      }
    } catch {
      toast.error('Failed to open print view');
    }
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/sales-invoices/${id}/pdf?download=true`, {
        credentials: 'include',
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.invoiceNo}.html`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Invoice downloaded');
    } catch {
      toast.error('Failed to download invoice');
    }
  };

  const normalizedBill = {
    invoiceNo: data.invoiceNo,
    issuedAt: data.invoiceDate,
    customer: data.dealerName,
    customerGstin: data.dealerGstin,
    customerAddress: data.dealerAddress,
    lineItems: (data.lineItems || []).map(item => ({
      ...item,
      product: item.name || item.product,
      amount: item.lineTotal || (item.quantity * item.unitPrice),
    })),
    cgst: data.cgst,
    sgst: data.sgst,
    igst: data.igst,
    amount: data.total,
    notes: data.notes,
    termsAndConditions: data.termsAndConditions,
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={handleOpenPrint}>
          <Printer className="h-3.5 w-3.5" /> Open Print View
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-3.5 w-3.5" /> Print This Page
        </Button>
        <Button size="sm" onClick={handleDownload}>
          <Download className="h-3.5 w-3.5" /> Download HTML
        </Button>
      </div>

      {/* Invoice Card */}
      <div ref={printRef} className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-surface-3 bg-white p-2 shadow-sm print:shadow-none print:border-none">
        <ThemedInvoicePreview
          business={bundle?.business || {}}
          invoice={bundle?.invoice || {}}
          bill={normalizedBill}
        />
      </div>
    </div>
  );
}
