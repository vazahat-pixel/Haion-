import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { ProductTierTable, ProductTierDrawer } from '@/modules/product-tiers';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function ProductTierListPage() {
  const [open, setOpen] = useState(false);
  return (
    <PageShell
      title="Product Tiers"
      subtitle="Volume-based pricing tiers across products"
      actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Tier</Button>}
    >
      <ProductTierTable />
      <ProductTierDrawer open={open} onOpenChange={setOpen} />
    </PageShell>
  );
}
