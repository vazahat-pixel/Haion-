import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { BrandDetail, BrandDrawer } from '@/modules/brands';
import { brandsService } from '@/services/brands.service';
import { queryKeys } from '@/services/api/queryKeys';
import { Button } from '@/components/ui/button';

export default function BrandDetailPage() {
  const { id } = useParams();
  const [editOpen, setEditOpen] = useState(false);

  const { data } = useQuery({
    queryKey: queryKeys.brands.detail(id),
    queryFn: () => brandsService.getDetail(id),
  });

  return (
    <DetailPageShell
      back={{ label: 'Brands', href: '/admin/brands' }}
      title={data?.name || 'Brand Details'}
      subtitle={data?.code ? `Code ${data.code} · ${data.country || ''}` : 'Product brand'}
      actions={data ? (
        <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4" /> Edit
        </Button>
      ) : null}
    >
      <BrandDetail id={id} />
      <BrandDrawer open={editOpen} onOpenChange={setEditOpen} item={data} />
    </DetailPageShell>
  );
}
