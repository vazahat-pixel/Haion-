import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { PricingDetail, PricingDrawer } from '@/modules/pricing';
import { pricingService } from '@/services/pricing.service';
import { queryKeys } from '@/services/api/queryKeys';
import { Button } from '@/components/ui/button';

export default function PricingDetailPage() {
  const { id } = useParams();
  const [editOpen, setEditOpen] = useState(false);

  const { data } = useQuery({
    queryKey: queryKeys.pricing.detail(id),
    queryFn: () => pricingService.getDetail(id),
  });

  return (
    <DetailPageShell
      back={{ label: 'Pricing', href: '/admin/pricing' }}
      title={data?.product || 'Pricing Details'}
      subtitle={data ? `${data.sku} · ${data.region} · ${data.dealerTier}` : 'Price rule'}
      actions={data ? (
        <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4" /> Edit
        </Button>
      ) : null}
    >
      <PricingDetail id={id} />
      {data && (
        <PricingDrawer
          open={editOpen}
          onOpenChange={setEditOpen}
          editData={{
            id: data.id,
            sku: data.sku,
            productName: data.product || data.productName,
            region: data.region,
            dealerTier: data.dealerTier,
            basePrice: data.basePrice,
            discountPct: data.discountPct ?? 0,
            gst: data.gst ?? 18,
          }}
        />
      )}
    </DetailPageShell>
  );
}
