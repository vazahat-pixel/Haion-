import { PageShell } from '@/components/layout/PageShell';
import { AdminApprovalTable } from '@/modules/approvals';

export default function ApprovalListPage() {
  return (
    <PageShell title="Approvals" subtitle="Review discount overrides and expense claims">
      <AdminApprovalTable />
    </PageShell>
  );
}
