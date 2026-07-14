import { useRef } from 'react';
import { Download, Printer, Link2 } from 'lucide-react';
import { useEntityDetail } from '@/hooks/useEntityDetail';
import { warrantyService } from '@/services/warranty.service';
import { queryKeys } from '@/services/api/queryKeys';
import { DetailView } from '@/components/data-display/DetailView';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/utils/format';
import { toast } from '@/utils/toast';
import { ROUTES } from '@/constants/routes';

export function WarrantyDetailPanel({ id }) {
  const printRef = useRef(null);
  const { data, isLoading, isError, refetch } = useEntityDetail(queryKeys.warranty.detail, warrantyService.getDetail, id);

  if (isLoading || isError || !data) {
    return <DetailView fields={[]} data={data} isLoading={isLoading} isError={isError} onRetry={refetch} />;
  }

  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  const handleDownload = async () => {
    await warrantyService.downloadCertificate(id);
    toast.success('Warranty certificate downloaded');
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}${ROUTES.PUBLIC_WARRANTY_CHECK}?bill=${encodeURIComponent(data.billNo)}`;
    navigator.clipboard.writeText(url);
    toast.success('Public warranty link copied');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold font-mono">{data.serialNo}</h2>
          <StatusBadge status={data.status} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyShareLink}><Link2 className="h-3.5 w-3.5" /> Share Link</Button>
          <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-3.5 w-3.5" /> Print</Button>
          <Button size="sm" onClick={handleDownload}><Download className="h-3.5 w-3.5" /> Download Certificate</Button>
        </div>
      </div>

      <DetailView
        fields={[
          { key: 'product', label: 'Product' },
          { key: 'customer', label: 'Registered To' },
          { key: 'billNo', label: 'Invoice / Bill' },
          { key: 'startDate', label: 'Start Date', format: 'date' },
          { key: 'endDate', label: 'End Date', format: 'date' },
        ]}
        data={data}
      />

      <Card ref={printRef} className="print:shadow-none print:border-0">
        <CardContent className="p-6 space-y-4">
          <div className="border-b border-surface-3 pb-4 text-center">
            <p className="text-xs uppercase tracking-widest text-[var(--color-text-tertiary)]">Warranty Certificate</p>
            <h3 className="mt-1 text-xl font-bold text-brand-700">Haion Industries Pvt Ltd</h3>
          </div>
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <p><span className="text-[var(--color-text-tertiary)]">Serial:</span> <strong className="font-mono">{data.serialNo}</strong></p>
            <p><span className="text-[var(--color-text-tertiary)]">Product:</span> <strong>{data.product}</strong></p>
            <p><span className="text-[var(--color-text-tertiary)]">Coverage:</span> <strong>{formatDate(data.startDate)} — {formatDate(data.endDate)}</strong></p>
            <p><span className="text-[var(--color-text-tertiary)]">Status:</span> <strong>{data.status}</strong></p>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            This certificate confirms manufacturer warranty coverage subject to terms and conditions.
            For service requests, visit the Service Requests section in your portal.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
