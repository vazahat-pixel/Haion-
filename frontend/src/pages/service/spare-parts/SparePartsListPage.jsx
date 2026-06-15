import { PageShell } from '@/components/layout/PageShell';
import { SparesTable } from '@/modules/spares';

export default function SparePartsListPage() {
  return (
    <PageShell title="Spare Parts" subtitle="Parts requests">
      <SparesTable />
    </PageShell>
  );
}
