import { PageShell } from '@/components/layout/PageShell';
import { DealerReportTable } from '@/modules/dealer-reports';

export default function DealerReportsPage() {
  return (
    <PageShell title="Reports" subtitle="Sales, customer, and inventory analytics">
      <DealerReportTable />
    </PageShell>
  );
}
