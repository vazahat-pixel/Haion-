import { PageShell } from '@/components/layout/PageShell';
import { GRNTable } from '@/modules/grn';
import { NewGRNButton } from '@/components/admin/NewGRNButton';

export default function GRNMonitoringPage() {
  return (
    <PageShell
      title="GRN Monitoring"
      subtitle="Track goods receipt notes across all warehouses"
      actions={<NewGRNButton />}
    >
      <GRNTable />
    </PageShell>
  );
}
