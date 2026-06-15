import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { BrandTable, BrandDrawer } from '@/modules/brands';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function BrandListPage() {
  const [open, setOpen] = useState(false);
  return (
    <PageShell title="Brands" subtitle="Brand partners and manufacturers" actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Brand</Button>}>
      <BrandTable />
      <BrandDrawer open={open} onOpenChange={setOpen} />
    </PageShell>
  );
}
