import { PageShell } from '@/components/layout/PageShell';
import { DealerGRNTable } from '@/modules/dealer-grn';

export default function DealerGRNListPage() {
  return (
    <PageShell title="Goods Receipt" subtitle="Confirm incoming stock from dispatches">
      <DealerGRNTable />
    </PageShell>
  );
}
