import { PageShell } from '@/components/layout/PageShell';
import { ReturnsTable } from '@/modules/returns';

export default function DefectiveReturnsListPage() {
  return (
    <PageShell title="Defective Returns" subtitle="Returned defective items">
      <ReturnsTable />
    </PageShell>
  );
}
