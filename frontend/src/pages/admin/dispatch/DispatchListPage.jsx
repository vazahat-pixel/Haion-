import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { DispatchTable } from '@/modules/dispatch';
import { DispatchCreateDrawer } from '@/modules/dispatch/DispatchCreateDrawer';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function DispatchListPage() {
  const [open, setOpen] = useState(false);
  return (
    <PageShell
      title="Dispatch"
      subtitle="Track outbound shipments"
      actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Create Dispatch</Button>}
    >
      <DispatchTable />
      <DispatchCreateDrawer open={open} onOpenChange={setOpen} />
    </PageShell>
  );
}
