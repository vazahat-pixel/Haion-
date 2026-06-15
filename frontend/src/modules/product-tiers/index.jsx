import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/api/queryKeys';
import { productTiersService } from '@/services/product-tiers.service';
import { productsService } from '@/services/products.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { tierColumns, tierDetailFields } from './columns.config';
import { DrawerForm } from '@/components/data-entry/DrawerForm';

export const ProductTierTable = createListTable({
  service: productTiersService,
  queryKey: queryKeys.productTiers.list,
  columns: tierColumns,
  basePath: '/admin/product-tiers',
  emptyTitle: 'No product tiers',
  emptyDescription: 'Add pricing tiers to products for volume-based pricing.',
  searchKeys: ['productName', 'name', 'code', 'productSku'],
  filterKey: 'status',
  filterOptions: [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
  ],
  searchPlaceholder: 'Search tiers…',
});

export const ProductTierDetail = createDetailView({
  service: productTiersService,
  queryKey: queryKeys.productTiers.detail,
  fields: tierDetailFields,
});

const tierSchema = z.object({
  productId: z.string().min(1, 'Product required'),
  name: z.string().min(2, 'Name required'),
  code: z.string().min(2, 'Code required'),
  basePrice: z.coerce.number().min(1, 'Price required'),
  gstRate: z.coerce.number().refine((v) => [0, 5, 12, 18, 28].includes(v), 'Invalid GST rate'),
  warrantyDuration: z.coerce.number().min(1, 'Warranty required'),
  warrantyUnit: z.string().min(1),
  description: z.string().optional(),
});

export function ProductTierDrawer({ open, onOpenChange }) {
  const qc = useQueryClient();
  const { data: productsRes } = useQuery({
    queryKey: ['products', 'tier-form'],
    queryFn: () => productsService.getList({ perPage: 100, status: 'ACTIVE' }),
    enabled: open,
  });
  const productOptions = (productsRes?.data || []).map((p) => ({
    value: p.id,
    label: `${p.sku} — ${p.name}`,
  }));

  return (
    <DrawerForm
      open={open}
      onOpenChange={onOpenChange}
      title="Add Product Tier"
      schema={tierSchema}
      defaultValues={{
        productId: '',
        name: '',
        code: '',
        basePrice: '',
        gstRate: 18,
        warrantyDuration: 12,
        warrantyUnit: 'Months',
        description: '',
      }}
      fields={[
        { name: 'productId', label: 'Product', type: 'select', options: productOptions },
        { name: 'name', label: 'Tier Name' },
        { name: 'code', label: 'Tier Code' },
        { name: 'basePrice', label: 'Base Price (₹)', type: 'number' },
        {
          name: 'gstRate',
          label: 'GST Rate',
          type: 'select',
          options: [
            { value: 0, label: '0%' },
            { value: 5, label: '5%' },
            { value: 12, label: '12%' },
            { value: 18, label: '18%' },
            { value: 28, label: '28%' },
          ],
        },
        { name: 'warrantyDuration', label: 'Warranty Duration', type: 'number' },
        {
          name: 'warrantyUnit',
          label: 'Warranty Unit',
          type: 'select',
          options: [
            { value: 'Months', label: 'Months' },
            { value: 'Years', label: 'Years' },
          ],
        },
        { name: 'description', label: 'Description', type: 'textarea' },
      ]}
      onSubmit={async (data) => {
        const { productId, ...tier } = data;
        await productTiersService.create(productId, tier);
        qc.invalidateQueries({ queryKey: queryKeys.productTiers.all });
      }}
      submitLabel="Create Tier"
    />
  );
}

export function ProductTierEditDrawer({ open, onOpenChange, item }) {
  const qc = useQueryClient();
  if (!item?.productId) return null;

  return (
    <DrawerForm
      key={item.id}
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Product Tier"
      schema={tierSchema.omit({ productId: true })}
      defaultValues={{
        name: item.name || '',
        code: item.code || '',
        basePrice: item.basePrice ?? '',
        gstRate: item.gstRate ?? 18,
        warrantyDuration: item.warrantyDuration ?? 12,
        warrantyUnit: item.warrantyUnit || 'Months',
        description: item.description || '',
      }}
      fields={[
        { name: 'name', label: 'Tier Name' },
        { name: 'code', label: 'Tier Code' },
        { name: 'basePrice', label: 'Base Price (₹)', type: 'number' },
        {
          name: 'gstRate',
          label: 'GST Rate',
          type: 'select',
          options: [
            { value: 0, label: '0%' },
            { value: 5, label: '5%' },
            { value: 12, label: '12%' },
            { value: 18, label: '18%' },
            { value: 28, label: '28%' },
          ],
        },
        { name: 'warrantyDuration', label: 'Warranty Duration', type: 'number' },
        {
          name: 'warrantyUnit',
          label: 'Warranty Unit',
          type: 'select',
          options: [
            { value: 'Months', label: 'Months' },
            { value: 'Years', label: 'Years' },
          ],
        },
        { name: 'description', label: 'Description', type: 'textarea' },
      ]}
      onSubmit={async (data) => {
        await productTiersService.update(item.productId, item.id, data);
        qc.invalidateQueries({ queryKey: queryKeys.productTiers.all });
      }}
      submitLabel="Save Changes"
    />
  );
}
