import { useParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { BillingDetailPanel } from '@/modules/billing';

export default function BillingDetailPage() {
  const { billId } = useParams();
  return (
    <PageShell title="Bill Details" subtitle="Invoice lifecycle and line items">
      <BillingDetailPanel id={billId} />
    </PageShell>
  );
}
