import { PageShell } from '@/components/layout/PageShell';
import { DealerInventoryTable } from '@/modules/dealer-inventory';

export default function DealerInventoryListPage() {
  return (
    <PageShell title="My Inventory" subtitle="Stock at your location">
      <DealerInventoryTable />
    </PageShell>
  );
}
