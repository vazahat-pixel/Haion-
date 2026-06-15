import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/services/api/queryKeys';
import { expensesService } from '@/services/expenses.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { expenseColumns, expenseDetailFields } from './columns.config';
import { DrawerForm } from '@/components/data-entry/DrawerForm';

export const ExpenseTable = createListTable({
  service: expensesService,
  queryKey: queryKeys.expenses.list,
  columns: expenseColumns,
  basePath: '/admin/expenses',
  searchKeys: ['expenseNo', 'category', 'description', 'submittedBy', 'vendor'],
  filterKey: 'status',
  filterOptions: [
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
  ],
});

export const ExpenseDetail = createDetailView({
  service: expensesService,
  queryKey: queryKeys.expenses.detail,
  fields: expenseDetailFields,
});

const schema = z.object({
  category: z.string().min(1),
  description: z.string().min(5),
  amount: z.coerce.number().min(1),
  vendor: z.string().optional(),
  submittedBy: z.string().min(1),
});

export function ExpenseDrawer({ open, onOpenChange }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const submitter = user?.name || user?.email || '';
  return (
    <DrawerForm
      key={open ? submitter : 'closed'}
      open={open}
      onOpenChange={onOpenChange}
      title="Submit Expense"
      schema={schema}
      defaultValues={{ category: 'Operations', description: '', amount: '', vendor: '', submittedBy: submitter }}
      fields={[
        { name: 'category', label: 'Category', type: 'select', options: [
          { value: 'Logistics', label: 'Logistics' },
          { value: 'Travel', label: 'Travel' },
          { value: 'Marketing', label: 'Marketing' },
          { value: 'Operations', label: 'Operations' },
        ]},
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'amount', label: 'Amount (₹)', type: 'number' },
        { name: 'vendor', label: 'Vendor' },
        { name: 'submittedBy', label: 'Submitted By', readOnly: true },
      ]}
      onSubmit={async (data) => {
        await expensesService.create(data);
        qc.invalidateQueries({ queryKey: queryKeys.expenses.all });
      }}
      submitLabel="Submit Expense"
    />
  );
}
