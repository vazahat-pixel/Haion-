import { PageShell } from '@/components/layout/PageShell';
import { PerformancePanel } from '@/modules/employee-performance';

export default function PerformancePage() {
  return (
    <PageShell title="Performance" subtitle="Your KPIs, achievements, and weekly trends">
      <PerformancePanel />
    </PageShell>
  );
}
