import { PageShell } from '@/components/layout/PageShell';
import { ApprovalTable } from '@/modules/approvals';

export default function ApprovalListPage() {
  return (
    <PageShell title="Approvals" subtitle="Pending approval requests">
      <ApprovalTable />
    </PageShell>
  );
}
