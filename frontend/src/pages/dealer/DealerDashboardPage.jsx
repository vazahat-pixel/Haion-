import { PageShell } from '@/components/layout/PageShell';
import { DealerDashboard } from '@/modules/dashboards';

export default function DealerDashboardPage() {
  return (
    <PageShell title="Dashboard" subtitle="Sales overview">
      <DealerDashboard />
    </PageShell>
  );
}
