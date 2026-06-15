import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { CategoryTable, CategoryDrawer } from '@/modules/categories';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function CategoryListPage() {
  const [open, setOpen] = useState(false);
  return (
    <PageShell title="Categories" subtitle="Product category hierarchy" actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Category</Button>}>
      <CategoryTable />
      <CategoryDrawer open={open} onOpenChange={setOpen} />
    </PageShell>
  );
}
