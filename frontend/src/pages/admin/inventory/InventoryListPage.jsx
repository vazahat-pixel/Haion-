import { PageShell } from '@/components/layout/PageShell';
import { InventoryListPanel } from '@/modules/inventory';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

export default function InventoryListPage() {
  return (
    <PageShell
      title="Inventory"
      subtitle="Stock is automatically updated when purchases are received"
      actions={
        <Button size="sm" variant="outline" asChild>
          <Link to="/admin/purchases/new"><ShoppingCart className="h-4 w-4" /> New Purchase</Link>
        </Button>
      }
    >
      <InventoryListPanel />
    </PageShell>
  );
}
