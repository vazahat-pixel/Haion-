import { PageShell } from '@/components/layout/PageShell';
import { EmployeeDashboard } from '@/modules/dashboards';

export default function EmployeeDashboardPage() {
  return (
    <PageShell title="Dashboard" subtitle="Your work overview">
      <EmployeeDashboard />
    </PageShell>
  );
}
