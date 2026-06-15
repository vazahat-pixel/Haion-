import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Power, Pencil } from 'lucide-react';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { ProductTierDetail, ProductTierEditDrawer } from '@/modules/product-tiers';
import { productTiersService } from '@/services/product-tiers.service';
import { queryKeys } from '@/services/api/queryKeys';
import { Button } from '@/components/ui/button';
import { toast } from '@/utils/toast';

export default function ProductTierDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const { data } = useQuery({
    queryKey: queryKeys.productTiers.detail(id),
    queryFn: () => productTiersService.getDetail(id),
  });

  const toggleStatus = useMutation({
    mutationFn: () =>
      productTiersService.updateStatus(
        data.productId,
        id,
        data?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      ),
    onSuccess: () => {
      toast.success(data?.status === 'ACTIVE' ? 'Tier deactivated' : 'Tier activated');
      qc.invalidateQueries({ queryKey: queryKeys.productTiers.all });
    },
    onError: () => toast.error('Failed to update status'),
  });

  return (
    <DetailPageShell
      back={{ label: 'Product Tiers', href: '/admin/product-tiers' }}
      title={data?.name || 'Tier Details'}
      subtitle={data ? `${data.productName} · ${data.code}` : 'Product tier pricing'}
      actions={data?.productId ? (
        <>
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => toggleStatus.mutate()} disabled={toggleStatus.isPending}>
            <Power className="h-4 w-4" /> {data?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </Button>
        </>
      ) : null}
    >
      <ProductTierDetail id={id} />
      <ProductTierEditDrawer open={editOpen} onOpenChange={setEditOpen} item={data} />
    </DetailPageShell>
  );
}
