import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/api/queryKeys';
import { employeesService } from '@/services/employees.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { employeeColumns, employeeDetailFields } from './columns.config';
import { DrawerForm } from '@/components/data-entry/DrawerForm';
import { ROLES } from '@/constants/roles';

export const EmployeeTable = createListTable({
  service: employeesService,
  queryKey: queryKeys.employees.list,
  columns: employeeColumns,
  basePath: '/admin/employees',
  emptyTitle: 'No employees',
  emptyDescription: 'Add staff members to manage operations.',
  searchKeys: ['empId', 'name', 'email', 'department', 'role'],
  filterKey: 'status',
  filterOptions: [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'ON_LEAVE', label: 'On Leave' },
  ],
  searchPlaceholder: 'Search employees…',
});

export const EmployeeDetail = createDetailView({
  service: employeesService,
  queryKey: queryKeys.employees.detail,
  fields: employeeDetailFields,
});

const createSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Phone required'),
  department: z.string().min(2, 'Department required'),
  role: z.string().min(1, 'Role required'),
});

const editSchema = z.object({
  department: z.string().min(2),
  role: z.string().min(1),
  status: z.string().min(1),
});

const roleOptions = [
  { value: ROLES.MASTER_ADMIN, label: 'Master Admin' },
  { value: ROLES.WAREHOUSE_MANAGER, label: 'Warehouse Manager' },
  { value: ROLES.EMPLOYEE, label: 'Employee' },
  { value: ROLES.MANAGER, label: 'Manager' },
  { value: ROLES.CUSTOMER_SUPPORT, label: 'Customer Support' },
];

const deptOptions = [
  { value: 'Operations', label: 'Operations' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Warehouse', label: 'Warehouse' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Service', label: 'Service' },
];

export function EmployeeDrawer({ open, onOpenChange }) {
  const qc = useQueryClient();
  return (
    <DrawerForm
      open={open}
      onOpenChange={onOpenChange}
      title="Add Employee"
      schema={createSchema}
      defaultValues={{ name: '', email: '', phone: '', department: 'Operations', role: ROLES.EMPLOYEE }}
      fields={[
        { name: 'name', label: 'Full Name' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'phone', label: 'Phone', type: 'tel' },
        { name: 'department', label: 'Department', type: 'select', options: deptOptions },
        { name: 'role', label: 'Role', type: 'select', options: roleOptions },
      ]}
      onSubmit={async (data) => {
        await employeesService.create(data);
        qc.invalidateQueries({ queryKey: queryKeys.employees.all });
      }}
      submitLabel="Add Employee"
    />
  );
}

export function EmployeeEditDrawer({ employee, open, onOpenChange }) {
  const qc = useQueryClient();
  if (!employee) return null;
  return (
    <DrawerForm
      key={employee.id}
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Employee"
      schema={editSchema}
      defaultValues={{
        department: employee.department || 'Operations',
        role: employee.role || ROLES.EMPLOYEE,
        status: employee.status || 'ACTIVE',
      }}
      fields={[
        { name: 'department', label: 'Department', type: 'select', options: deptOptions },
        { name: 'role', label: 'Role', type: 'select', options: roleOptions },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { value: 'ACTIVE', label: 'Active' },
            { value: 'INACTIVE', label: 'Inactive' },
            { value: 'ON_LEAVE', label: 'On Leave' },
          ],
        },
      ]}
      onSubmit={async (data) => {
        await employeesService.update(employee.id, data);
        qc.invalidateQueries({ queryKey: queryKeys.employees.all });
      }}
      submitLabel="Save Changes"
    />
  );
}
