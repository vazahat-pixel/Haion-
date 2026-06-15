import { PageShell } from '@/components/layout/PageShell';
import { AuditLogPanel } from '@/modules/audit/AuditLogPanel';

export default function AuditLogPage() {
  return (
    <PageShell title="Audit Logs" subtitle="System activity trail">
      <AuditLogPanel />
    </PageShell>
  );
}
