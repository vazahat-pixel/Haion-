import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Printer } from 'lucide-react';
import { useEntityDetail } from '@/hooks/useEntityDetail';
import { invoicesService } from '@/services/invoices.service';
import { settingsService } from '@/services/settings.service';
import { queryKeys } from '@/services/api/queryKeys';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Button } from '@/components/ui/button';
import { InvoicePreview as ThemedInvoicePreview } from '@/modules/business-settings/InvoicePreview';
import { toast } from '@/utils/toast';

export function InvoicePreview({ id }) {
  const printRef = useRef(null);
  const { data, isLoading, isError, refetch } = useEntityDetail(queryKeys.invoices.detail, invoicesService.getDetail, id);
  const { data: bundle } = useQuery({
    queryKey: ['settings', 'profile-bundle'],
    queryFn: settingsService.getProfileBundle,
  });

  if (isLoading) return <LoadingState message="Loading invoice…" />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  const business = {
    ...bundle?.business,
    businessName: bundle?.business?.businessName || data.dealerName,
    gstin: bundle?.business?.gstin || data.dealerGstin,
    billingAddress: bundle?.business?.billingAddress || data.dealerAddress,
  };

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

      <div ref={printRef} className="mx-auto max-w-3xl print:shadow-none">
        <ThemedInvoicePreview
          business={business}
          invoice={bundle?.invoice || {}}
          bill={{
            invoiceNo: data.invoiceNo,
            issuedAt: data.issuedAt,
            customer: data.customer,
            customerGstin: data.customerGstin,
            lineItems: data.lineItems,
            cgst: data.cgst,
            sgst: data.sgst,
            igst: data.igst,
            amount: data.amount,
          }}
        />
      </div>
    </div>
  );
}
