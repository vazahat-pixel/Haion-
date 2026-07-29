import { useParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { SalesInvoiceDetail } from '@/modules/sales-invoices';

export default function DealerPurchaseDetailPage() {
  const { id } = useParams();

  return (
    <PageShell
      title="Purchase Details"
      subtitle="View details and print your purchase invoice"
      back={{ label: 'Purchases', href: '/dealer/purchases' }}
    >
      <SalesInvoiceDetail id={id} />
    </PageShell>
  );
}
