import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { Button } from '@/components/ui/button';
import { SalesInvoiceDetail } from '@/modules/sales-invoices';
import { salesInvoicesService } from '@/services/sales-invoices.service';
import { queryKeys } from '@/services/api/queryKeys';

export default function SalesInvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: queryKeys.salesInvoices.detail(id),
    queryFn: () => salesInvoicesService.getDetail(id),
    enabled: !!id,
  });

  return (
    <DetailPageShell
      back={{ label: 'Sales Invoices', href: '/admin/sales-invoices' }}
      title={data?.invoiceNo || 'Invoice Details'}
      subtitle={data ? `${data.dealerName} · ${data.status}` : 'Sales Invoice'}
      actions={
        data?.status === 'DRAFT' ? (
          <Button size="sm" variant="outline" onClick={() => navigate(`/admin/sales-invoices/${id}/edit`)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        ) : null
      }
    >
      <SalesInvoiceDetail id={id} />
    </DetailPageShell>
  );
}
