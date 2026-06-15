import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { WarehouseTable, WarehouseDrawer } from '@/modules/warehouses';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function WarehouseListPage() {
  const [open, setOpen] = useState(false);
  return (
    <PageShell
      title="Warehouses"
      subtitle="Manage warehouse locations and capacity"
      actions={
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add Warehouse
        </Button>
      }
    >
      <WarehouseTable />
      <WarehouseDrawer open={open} onOpenChange={setOpen} />
    </PageShell>
  );
}
