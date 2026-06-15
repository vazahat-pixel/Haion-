import { PageShell } from '@/components/layout/PageShell';
import { TeamDashboard } from '@/modules/dashboards';

export default function TeamDashboardPage() {
  return (
    <PageShell title="Team Dashboard" subtitle="Team activity overview">
      <TeamDashboard />
    </PageShell>
  );
}
