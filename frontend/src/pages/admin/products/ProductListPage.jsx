import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { ProductTable, ProductDrawer } from '@/modules/products';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function ProductListPage() {
  const [open, setOpen] = useState(false);
  return (
    <PageShell
      title="Products"
      subtitle="Manage product catalog and specifications"
      actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Product</Button>}
    >
      <ProductTable />
      <ProductDrawer open={open} onOpenChange={setOpen} />
    </PageShell>
  );
}
