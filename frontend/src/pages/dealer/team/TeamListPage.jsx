import { PageShell } from '@/components/layout/PageShell';
import { TeamTable } from '@/modules/team';

export default function TeamListPage() {
  return (
    <PageShell title="Team" subtitle="Your sales team">
      <TeamTable />
    </PageShell>
  );
}
