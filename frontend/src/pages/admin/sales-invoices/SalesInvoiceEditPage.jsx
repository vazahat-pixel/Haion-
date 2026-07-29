import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageShell } from '@/components/layout/PageShell';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SalesInvoiceForm } from '@/modules/sales-invoices';
import { salesInvoicesService } from '@/services/sales-invoices.service';
import { queryKeys } from '@/services/api/queryKeys';

export default function SalesInvoiceEditPage() {
  const { id } = useParams();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.salesInvoices.detail(id),
    queryFn: () => salesInvoicesService.getDetail(id),
    enabled: !!id,
  });

  if (isLoading) return <LoadingState message="Loading invoice for edit…" />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  return (
    <PageShell
      title={`Edit Sales Invoice ${data.invoiceNo}`}
      subtitle="Modify draft sales invoice details and line items"
      back={{ label: 'Invoice Details', href: `/admin/sales-invoices/${id}` }}
    >
      <SalesInvoiceForm initialData={data} isEdit />
    </PageShell>
  );
}
