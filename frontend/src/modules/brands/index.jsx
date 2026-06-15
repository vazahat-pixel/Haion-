import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/api/queryKeys';
import { brandsService } from '@/services/brands.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { brandColumns, brandDetailFields } from './columns.config';
import { DrawerForm } from '@/components/data-entry/DrawerForm';

export const BrandTable = createListTable({
  service: brandsService,
  queryKey: queryKeys.brands.list,
  columns: brandColumns,
  basePath: '/admin/brands',
  emptyTitle: 'No brands',
  emptyDescription: 'Add brands to associate with products.',
  searchKeys: ['code', 'name', 'country'],
  filterKey: 'status',
  filterOptions: [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
  ],
});

export const BrandDetail = createDetailView({
  service: brandsService,
  queryKey: queryKeys.brands.detail,
  fields: brandDetailFields,
});

const schema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  country: z.string().min(2),
  website: z.string().optional(),
});

export function BrandDrawer({ open, onOpenChange, item = null }) {
  const qc = useQueryClient();
  const isEdit = Boolean(item?.id);
  const defaults = isEdit
    ? { code: item.code || '', name: item.name || '', country: item.country || 'India', website: item.website || '' }
    : { code: '', name: '', country: 'India', website: '' };

  return (
    <DrawerForm
      key={isEdit ? item.id : 'new'}
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Brand' : 'Add Brand'}
      schema={schema}
      defaultValues={defaults}
      fields={[
        { name: 'code', label: 'Brand Code' },
        { name: 'name', label: 'Brand Name' },
        { name: 'country', label: 'Country' },
        { name: 'website', label: 'Website' },
      ]}
      onSubmit={async (data) => {
        if (isEdit) {
          await brandsService.update(item.id, data);
        } else {
          await brandsService.create(data);
        }
        qc.invalidateQueries({ queryKey: queryKeys.brands.all });
      }}
      submitLabel={isEdit ? 'Save Changes' : 'Create Brand'}
    />
  );
}
