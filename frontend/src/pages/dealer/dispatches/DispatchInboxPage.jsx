import { PageShell } from '@/components/layout/PageShell';
import { DealerDispatchTable } from '@/modules/dealer-dispatch';

export default function DispatchInboxPage() {
  return (
    <PageShell title="Incoming Dispatches" subtitle="Track shipments from Haion warehouses">
      <DealerDispatchTable />
    </PageShell>
  );
}
