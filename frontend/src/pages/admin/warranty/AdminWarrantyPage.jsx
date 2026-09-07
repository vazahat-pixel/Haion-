import { PageShell } from '@/components/layout/PageShell';
import { AdminWarrantyTable } from '@/modules/warranty';

export default function AdminWarrantyPage() {
  return (
    <PageShell
      title="Extended Warranty Management"
      subtitle="Track customer warranties, serial numbers, validity and coverage"
    >
      <AdminWarrantyTable />
    </PageShell>
  );
}
