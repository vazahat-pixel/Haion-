import { PageShell } from '@/components/layout/PageShell';
import { ReportTable } from '@/modules/reports';

export default function ReportListPage() {
  return (
    <PageShell title="Reports" subtitle="Generated reports">
      <ReportTable />
    </PageShell>
  );
}
