import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { CategoryDetail, CategoryDrawer } from '@/modules/categories';
import { categoriesService } from '@/services/categories.service';
import { queryKeys } from '@/services/api/queryKeys';
import { Button } from '@/components/ui/button';

export default function CategoryDetailPage() {
  const { id } = useParams();
  const [editOpen, setEditOpen] = useState(false);

  const { data } = useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: () => categoriesService.getDetail(id),
  });

  return (
    <DetailPageShell
      back={{ label: 'Categories', href: '/admin/categories' }}
      title={data?.name || 'Category Details'}
      subtitle={data?.code ? `Code ${data.code}` : 'Product category'}
      actions={data ? (
        <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4" /> Edit
        </Button>
      ) : null}
    >
      <CategoryDetail id={id} />
      <CategoryDrawer open={editOpen} onOpenChange={setEditOpen} item={data} />
    </DetailPageShell>
  );
}
