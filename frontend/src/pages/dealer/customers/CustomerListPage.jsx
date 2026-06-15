import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { CustomerTable, CustomerDrawer } from '@/modules/customers';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function CustomerListPage() {
  const [open, setOpen] = useState(false);
  return (
    <PageShell title="Customers" subtitle="Manage your customer base" actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Customer</Button>}>
      <CustomerTable />
      <CustomerDrawer open={open} onOpenChange={setOpen} />
    </PageShell>
  );
}
