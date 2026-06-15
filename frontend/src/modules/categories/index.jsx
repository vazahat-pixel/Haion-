import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/api/queryKeys';
import { categoriesService } from '@/services/categories.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { categoryColumns, categoryDetailFields } from './columns.config';
import { DrawerForm } from '@/components/data-entry/DrawerForm';
import { InventoryIllustration } from '@/components/illustrations';

export const CategoryTable = createListTable({
  service: categoriesService,
  queryKey: queryKeys.categories.list,
  columns: categoryColumns,
  basePath: '/admin/categories',
  emptyTitle: 'No categories',
  emptyDescription: 'Create categories to organize your product catalog.',
  emptyIllustration: InventoryIllustration,
  searchKeys: ['code', 'name', 'description'],
  searchPlaceholder: 'Search categories…',
});

export const CategoryDetail = createDetailView({
  service: categoriesService,
  queryKey: queryKeys.categories.detail,
  fields: categoryDetailFields,
});

const schema = z.object({
  code: z.string().min(2, 'Code required'),
  name: z.string().min(2, 'Name required'),
  description: z.string().optional(),
});

export function CategoryDrawer({ open, onOpenChange, item = null }) {
  const qc = useQueryClient();
  const isEdit = Boolean(item?.id);
  const defaults = isEdit
    ? { code: item.code || '', name: item.name || '', description: item.description || '' }
    : { code: '', name: '', description: '' };

  return (
    <DrawerForm
      key={isEdit ? item.id : 'new'}
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Category' : 'Add Category'}
      schema={schema}
      defaultValues={defaults}
      fields={[
        { name: 'code', label: 'Category Code' },
        { name: 'name', label: 'Name' },
        { name: 'description', label: 'Description', type: 'textarea' },
      ]}
      onSubmit={async (data) => {
        if (isEdit) {
          await categoriesService.update(item.id, data);
        } else {
          await categoriesService.create(data);
        }
        qc.invalidateQueries({ queryKey: queryKeys.categories.all });
      }}
      submitLabel={isEdit ? 'Save Changes' : 'Create Category'}
    />
  );
}
