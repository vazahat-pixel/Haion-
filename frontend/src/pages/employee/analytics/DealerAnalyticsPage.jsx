import { PageShell } from '@/components/layout/PageShell';
import { DealerAnalyticsPanel } from '@/modules/dealer-analytics';

export default function DealerAnalyticsPage() {
  return (
    <PageShell title="Dealer Analytics" subtitle="Zone distribution, regional sales, and top performers">
      <DealerAnalyticsPanel />
    </PageShell>
  );
}
