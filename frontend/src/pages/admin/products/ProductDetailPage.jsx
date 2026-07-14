import { useState } from 'react';

import { useParams } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Pencil, Power } from 'lucide-react';

import { DetailPageShell } from '@/components/layout/DetailPageShell';

import { ProductDetail, ProductEditDrawer } from '@/modules/products';

import { productsService } from '@/services/products.service';

import { queryKeys } from '@/services/api/queryKeys';

import { Button } from '@/components/ui/button';

import { toast } from '@/utils/toast';



export default function ProductDetailPage() {

  const { id } = useParams();

  const qc = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);



  const { data } = useQuery({

    queryKey: queryKeys.products.detail(id),

    queryFn: () => productsService.getDetail(id),

  });



  const toggleStatus = useMutation({

    mutationFn: () => productsService.updateStatus(id, data?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'),

    onSuccess: () => {

      toast.success(data?.status === 'ACTIVE' ? 'Item deactivated' : 'Item activated');

      qc.invalidateQueries({ queryKey: queryKeys.products.all });

    },

    onError: () => toast.error('Failed to update status'),

  });



  const isActive = data?.status === 'ACTIVE';



  return (

    <DetailPageShell

      back={{ label: 'Items', href: '/admin/products' }}

      title={data?.name || 'Item Details'}

      subtitle={data?.sku ? `SKU ${data.sku} · ${data.category || ''}` : 'Catalog item information'}

      actions={data ? (

        <>

          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>

            <Pencil className="h-4 w-4" /> Edit

          </Button>

          <Button

            size="sm"

            variant={isActive ? 'outline' : 'default'}

            onClick={() => toggleStatus.mutate()}

            disabled={toggleStatus.isPending}

          >

            <Power className="h-4 w-4" /> {isActive ? 'Deactivate' : 'Activate'}

          </Button>

        </>

      ) : null}

    >

      <ProductDetail id={id} />

      <ProductEditDrawer productId={id} open={editOpen} onOpenChange={setEditOpen} />

    </DetailPageShell>

  );

}


