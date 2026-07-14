import { PageShell } from '@/components/layout/PageShell';
import { PurchaseForm } from '@/modules/purchases';

export default function PurchaseNewPage() {
  return (
    <PageShell
      title="New Purchase"
      subtitle="Select supplier, enter bill number and add items from catalog"
      back={{ label: 'Purchases', href: '/admin/purchases' }}
    >
      <PurchaseForm />
    </PageShell>
  );
}
