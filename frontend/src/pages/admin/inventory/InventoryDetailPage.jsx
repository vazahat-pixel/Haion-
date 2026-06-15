import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { InventoryDetail, InventoryEditDrawer } from '@/modules/inventory';
import { inventoryService } from '@/services/inventory.service';
import { queryKeys } from '@/services/api/queryKeys';
import { Button } from '@/components/ui/button';

export default function InventoryDetailPage() {
  const { id } = useParams();
  const [editOpen, setEditOpen] = useState(false);

  const { data } = useQuery({
    queryKey: queryKeys.inventory.detail(id),
    queryFn: () => inventoryService.getDetail(id),
  });

  return (
    <DetailPageShell
      back={{ label: 'Inventory', href: '/admin/inventory' }}
      title={data?.name || 'Inventory Item'}
      subtitle={data?.sku ? `${data.sku} · ${data.warehouse || ''}` : 'Stock item details'}
      actions={data ? (
        <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4" /> Edit
        </Button>
      ) : null}
    >
      <InventoryDetail id={id} />
      <InventoryEditDrawer open={editOpen} onOpenChange={setEditOpen} item={data} />
    </DetailPageShell>
  );
}
