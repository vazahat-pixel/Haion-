import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { ManufactureTable } from '@/modules/manufacture';
import { Button } from '@/components/ui/button';
import { Plus, Package } from 'lucide-react';

export default function ManufactureListPage() {
  return (
    <PageShell
      title="Manufacture"
      subtitle="Combine purchased raw materials into finished goods, then dispatch from Finished Goods"
      actions={(
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link to="/admin/finished-goods"><Package className="h-4 w-4" /> Finished Goods</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/admin/manufacture/new"><Plus className="h-4 w-4" /> Make Product</Link>
          </Button>
        </div>
      )}
    >
      <ManufactureTable />
    </PageShell>
  );
}
