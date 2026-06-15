import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/api/queryKeys';
import { customersService } from '@/services/customers.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { customerColumns, customerDetailFields } from './columns.config';
import { DrawerForm } from '@/components/data-entry/DrawerForm';

export const CustomerTable = createListTable({
  service: customersService,
  queryKey: queryKeys.customers.list,
  columns: customerColumns,
  basePath: '/dealer/customers',
  searchKeys: ['code', 'name', 'phone', 'email', 'city'],
  filterKey: 'status',
  filterOptions: [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
  ],
});

export const CustomerDetail = createDetailView({
  service: customersService,
  queryKey: queryKeys.customers.detail,
  fields: customerDetailFields,
});

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional().or(z.literal('')),
  city: z.string().min(2),
  gstin: z.string().optional(),
});

export function CustomerDrawer({ open, onOpenChange }) {
  const qc = useQueryClient();
  return (
    <DrawerForm
      open={open}
      onOpenChange={onOpenChange}
      title="Add Customer"
      description="Register a new customer"
      schema={schema}
      defaultValues={{ name: '', phone: '', email: '', city: '', gstin: '' }}
      fields={[
        { name: 'name', label: 'Full Name' },
        { name: 'phone', label: 'Phone' },
        { name: 'email', label: 'Email' },
        { name: 'city', label: 'City' },
        { name: 'gstin', label: 'GSTIN (optional)' },
      ]}
      onSubmit={async (data) => {
        await customersService.create(data);
        qc.invalidateQueries({ queryKey: queryKeys.customers.all });
      }}
    />
  );
}
