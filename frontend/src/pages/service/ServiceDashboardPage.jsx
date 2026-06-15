import { PageShell } from '@/components/layout/PageShell';
import { ServiceDashboard } from '@/modules/dashboards';

export default function ServiceDashboardPage() {
  return (
    <PageShell title="Dashboard" subtitle="Service center overview">
      <ServiceDashboard />
    </PageShell>
  );
}
