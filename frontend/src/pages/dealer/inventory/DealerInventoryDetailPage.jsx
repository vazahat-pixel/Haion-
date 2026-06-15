import { PageShell } from '@/components/layout/PageShell';
import { useParams } from 'react-router-dom';
import { DealerInventoryDetail } from '@/modules/dealer-inventory';

export default function DealerInventoryDetailPage() {
  const { id } = useParams();
  return (
    <PageShell title="Product Details" subtitle="Inventory item">
      <DealerInventoryDetail id={id} />
    </PageShell>
  );
}
