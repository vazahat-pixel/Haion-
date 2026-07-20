import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { InventoryListPanel } from '@/modules/inventory';
import { Button } from '@/components/ui/button';
import { Factory, Truck } from 'lucide-react';

export default function FinishedGoodsPage() {
  return (
    <PageShell
      title="Finished Goods"
      subtitle="Products manufactured from purchased materials — ready to dispatch to dealers"
      actions={(
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link to="/admin/manufacture/new"><Factory className="h-4 w-4" /> Make Product</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/admin/dispatch"><Truck className="h-4 w-4" /> Create Dispatch</Link>
          </Button>
        </div>
      )}
    >
      <InventoryListPanel
        filters={{ stockType: 'FINISHED' }}
        basePath="/admin/inventory"
        emptyTitle="No finished goods yet"
        emptyDescription="Make a product from purchased materials — finished goods will appear here, ready to dispatch."
      />
    </PageShell>
  );
}
