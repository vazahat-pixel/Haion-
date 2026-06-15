import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil } from 'lucide-react';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { WarehouseDetail, WarehouseDrawer } from '@/modules/warehouses';
import { warehousesService } from '@/services/warehouses.service';
import { queryKeys } from '@/services/api/queryKeys';
import { Button } from '@/components/ui/button';

export default function WarehouseDetailPage() {
  const { id } = useParams();
  const [editOpen, setEditOpen] = useState(false);

  const { data } = useQuery({
    queryKey: queryKeys.warehouses.detail(id),
    queryFn: () => warehousesService.getDetail(id),
  });

  return (
    <DetailPageShell
      back={{ label: 'Warehouses', href: '/admin/warehouses' }}
      title={data?.name || 'Warehouse Details'}
      subtitle={data ? `${data.code} · ${data.city}, ${data.state}` : 'Warehouse information'}
      actions={
        <>
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button size="sm" asChild>
            <Link to={`/admin/warehouses/${id}/grn`}><Plus className="h-4 w-4" /> Create GRN</Link>
          </Button>
        </>
      }
    >
      <WarehouseDetail id={id} />
      <WarehouseDrawer open={editOpen} onOpenChange={setEditOpen} item={data} />
    </DetailPageShell>
  );
}
