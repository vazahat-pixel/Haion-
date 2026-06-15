import { PageShell } from '@/components/layout/PageShell';
import { ComplaintCreateForm } from '@/modules/complaints';

export default function ComplaintNewPage() {
  return (
    <PageShell title="New Complaint" subtitle="Register a complaint">
      <ComplaintCreateForm />
    </PageShell>
  );
}
