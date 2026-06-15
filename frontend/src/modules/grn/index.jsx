import { queryKeys } from '@/services/api/queryKeys';
import { grnService } from '@/services/grn.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { grnColumns, grnDetailFields } from './columns.config';
import { FormCard } from '@/components/data-entry/FormCard';
import { z } from 'zod';

export const GRNTable = createListTable({
  service: grnService,
  queryKey: queryKeys.grn.list,
  columns: grnColumns,
  basePath: '/admin/grn',
  searchKeys: ['grnNo', 'warehouse', 'supplier'],
  filterKey: 'status',
  filterOptions: [
    { value: 'VERIFIED', label: 'Verified' },
    { value: 'PENDING_VERIFICATION', label: 'Pending' },
  ],
  searchPlaceholder: 'Search GRNs…',
});

export { GRNStepperForm } from './GRNStepperForm';

export const GRNDetail = createDetailView({
  service: grnService,
  queryKey: queryKeys.grn.detail,
  fields: grnDetailFields,
});

const grnSchema = z.object({
  warehouse: z.string().min(1, 'Required'),
  supplier: z.string().min(1, 'Required'),
  items: z.coerce.number().min(1, 'At least 1 item'),
  notes: z.string().optional(),
});

export function GRNForm({ onSubmit }) {
  return (
    <FormCard
      title="Create Goods Receipt Note"
      schema={grnSchema}
      defaultValues={{ warehouse: 'WH-BLR', supplier: '', items: 1, notes: '' }}
      fields={[
        { name: 'warehouse', label: 'Warehouse', type: 'select', options: [
          { value: 'WH-BLR', label: 'Bangalore Central' },
          { value: 'WH-MUM', label: 'Mumbai Hub' },
          { value: 'WH-DEL', label: 'Delhi NCR' },
        ]},
        { name: 'supplier', label: 'Supplier' },
        { name: 'items', label: 'Item Count', type: 'number' },
        { name: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
      ]}
      onSubmit={(data) => grnService.create(data).then(onSubmit)}
      submitLabel="Create GRN"
    />
  );
}
