import { PageShell } from '@/components/layout/PageShell';
import { WarrantyTable } from '@/modules/warranty';

export default function WarrantyListPage() {
  return (
    <PageShell title="Warranty" subtitle="Registered warranties">
      <WarrantyTable />
    </PageShell>
  );
}
