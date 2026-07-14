import { PageShell } from '@/components/layout/PageShell';
import { TeamPerformanceDashboard } from '@/modules/team';

export default function TeamPerformancePage() {
  return (
    <PageShell title="Team Performance" subtitle="Live metrics from paid invoices">
      <TeamPerformanceDashboard />
    </PageShell>
  );
}
