import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { PurchaseTable } from '@/modules/purchases';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function PurchaseListPage() {
  return (
    <PageShell
      title="Purchases"
      subtitle="Record supplier purchases and receive stock into warehouse inventory"
      actions={(
        <Button size="sm" asChild>
          <Link to="/admin/purchases/new"><Plus className="h-4 w-4" /> New Purchase</Link>
        </Button>
      )}
    >
      <PurchaseTable />
    </PageShell>
  );
}
