import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { InventoryListPanel } from '@/modules/inventory';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function InventoryListPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <PageShell
      title="Inventory"
      subtitle="Manage stock levels across warehouses"
      actions={<Button size="sm" onClick={() => setDrawerOpen(true)}><Plus className="h-4 w-4" /> Add Item</Button>}
    >
      <InventoryListPanel drawerOpen={drawerOpen} onDrawerChange={setDrawerOpen} />
    </PageShell>
  );
}
