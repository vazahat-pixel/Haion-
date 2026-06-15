import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/api/queryKeys';
import { pricingService } from '@/services/pricing.service';
import { productsService } from '@/services/products.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { pricingColumns, pricingDetailFields } from './columns.config';
import { DrawerForm } from '@/components/data-entry/DrawerForm';

export const PricingTable = createListTable({
  service: pricingService,
  queryKey: queryKeys.pricing.list,
  columns: pricingColumns,
  basePath: '/admin/pricing',
  emptyTitle: 'No pricing rules',
  emptyDescription: 'Create regional or tier-based price lists.',
  searchKeys: ['product', 'sku', 'region', 'dealerTier'],
  filterKey: 'status',
  filterOptions: [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'EXPIRED', label: 'Expired' },
  ],
  searchPlaceholder: 'Search pricing…',
});

export const PricingDetail = createDetailView({
  service: pricingService,
  queryKey: queryKeys.pricing.detail,
  fields: pricingDetailFields,
});

const pricingSchema = z.object({
  sku: z.string().min(1, 'SKU required'),
  productName: z.string().min(2, 'Product name required'),
  region: z.string().min(2, 'Region required'),
  dealerTier: z.string().min(2, 'Dealer tier required'),
  basePrice: z.coerce.number().min(1),
  discountPct: z.coerce.number().min(0).max(100).optional(),
  gst: z.coerce.number().min(0).max(28),
});

export function PricingDrawer({ open, onOpenChange, editData }) {
  const qc = useQueryClient();
  const isEdit = Boolean(editData?.id);
  const { data: productsRes } = useQuery({
    queryKey: ['products', 'pricing-form'],
    queryFn: () => productsService.getList({ perPage: 100, status: 'ACTIVE' }),
    enabled: open && !isEdit,
  });
  const productOptions = (productsRes?.data || []).map((p) => ({
    value: p.sku,
    label: `${p.sku} — ${p.name}`,
    name: p.name,
  }));

  return (
    <DrawerForm
      key={isEdit ? editData.id : 'new'}
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Pricing Rule' : 'Add Pricing Rule'}
      schema={pricingSchema}
      defaultValues={editData || {
        sku: '',
        productName: '',
        region: 'North',
        dealerTier: 'Gold',
        basePrice: '',
        discountPct: 0,
        gst: 18,
      }}
      fields={[
        ...(isEdit ? [] : [{
          name: 'sku',
          label: 'Product SKU',
          type: 'select',
          options: productOptions.map((o) => ({ value: o.value, label: o.label })),
        }]),
        { name: 'productName', label: 'Product Name' },
        {
          name: 'region',
          label: 'Region',
          type: 'select',
          options: [
            { value: 'North', label: 'North' },
            { value: 'South', label: 'South' },
            { value: 'East', label: 'East' },
            { value: 'West', label: 'West' },
          ],
        },
        {
          name: 'dealerTier',
          label: 'Dealer Tier',
          type: 'select',
          options: [
            { value: 'Gold', label: 'Gold' },
            { value: 'Silver', label: 'Silver' },
            { value: 'Bronze', label: 'Bronze' },
          ],
        },
        { name: 'basePrice', label: 'Base Price (₹)', type: 'number' },
        { name: 'discountPct', label: 'Discount %', type: 'number' },
        {
          name: 'gst',
          label: 'GST %',
          type: 'select',
          options: [
            { value: 0, label: '0%' },
            { value: 5, label: '5%' },
            { value: 12, label: '12%' },
            { value: 18, label: '18%' },
            { value: 28, label: '28%' },
          ],
        },
      ]}
      onSubmit={async (data) => {
        if (isEdit) {
          await pricingService.update(editData.id, data);
        } else {
          const match = productOptions.find((p) => p.value === data.sku);
          await pricingService.create({ ...data, productName: data.productName || match?.name });
        }
        qc.invalidateQueries({ queryKey: queryKeys.pricing.all });
      }}
      submitLabel={isEdit ? 'Save Changes' : 'Create Rule'}
    />
  );
}
