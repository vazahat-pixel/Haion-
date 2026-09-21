import { z } from 'zod';
import { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/api/queryKeys';
import { employeesService } from '@/services/employees.service';
import { dealersService } from '@/services/dealers.service';
import { serviceCenterService } from '@/services/serviceCenter.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { employeeColumns, employeeDetailFields } from './columns.config';
import { DrawerForm } from '@/components/data-entry/DrawerForm';
import {
  ROLES,
  ROLE_LABELS,
  VERTICALS,
  VERTICAL_LABELS,
  SUB_VERTICALS,
  SUB_VERTICAL_LABELS,
  HIERARCHY_LEVELS,
  HIERARCHY_LEVEL_LABELS,
} from '@/constants/roles';
import { EmployeeDealersDrawer } from './EmployeeDealersDrawer';
import { EmployeeReportingLinePanel } from './EmployeeReportingLinePanel';

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
  designation: z.string().optional(),
  role: z.string().min(1, 'Role required'),
  managerId: z.string().optional(),
  vertical: z.string().optional(),
  subVertical: z.string().optional(),
  hierarchyLevel: z.string().optional(),
  territoryState: z.string().optional(),
  territoryDistrict: z.string().optional(),
  dealerId: z.string().optional(),
  serviceCenterId: z.string().optional(),
});

const editSchema = z.object({
  department: z.string().min(2),
  designation: z.string().optional(),
  role: z.string().min(1),
  status: z.string().min(1),
  managerId: z.string().optional(),
  vertical: z.string().optional(),
  subVertical: z.string().optional(),
  hierarchyLevel: z.string().optional(),
  territoryState: z.string().optional(),
  territoryDistrict: z.string().optional(),
  dealerId: z.string().optional(),
  serviceCenterId: z.string().optional(),
});

const roleOptions = [
  { value: ROLES.MASTER_ADMIN, label: ROLE_LABELS.MASTER_ADMIN },
  { value: ROLES.CEO, label: ROLE_LABELS.CEO },
  { value: ROLES.NSM, label: ROLE_LABELS.NSM },
  { value: ROLES.STATE_HEAD, label: ROLE_LABELS.STATE_HEAD },
  { value: ROLES.ASM, label: ROLE_LABELS.ASM },
  { value: ROLES.STORE_MANAGER, label: ROLE_LABELS.STORE_MANAGER },
  { value: ROLES.WAREHOUSE_MANAGER, label: ROLE_LABELS.WAREHOUSE_MANAGER },
  { value: ROLES.EMPLOYEE, label: ROLE_LABELS.EMPLOYEE },
  { value: ROLES.MANAGER, label: ROLE_LABELS.MANAGER },
  { value: ROLES.CUSTOMER_SUPPORT, label: ROLE_LABELS.CUSTOMER_SUPPORT },
];

const verticalOptions = [
  { value: '', label: 'Select Vertical' },
  ...Object.keys(VERTICALS).map((k) => ({ value: k, label: VERTICAL_LABELS[k] })),
];

const subVerticalOptions = [
  { value: '', label: 'Select Sub-Vertical' },
  ...Object.keys(SUB_VERTICALS).map((k) => ({ value: k, label: SUB_VERTICAL_LABELS[k] })),
];

const hierarchyLevelOptions = [
  { value: '', label: 'Select Level' },
  ...HIERARCHY_LEVELS.map((k) => ({ value: k, label: HIERARCHY_LEVEL_LABELS[k] })),
];

const deptOptions = [
  { value: 'Operations', label: 'Operations' },
  { value: 'Sales & Marketing', label: 'Sales & Marketing' },
  { value: 'Manufacturing & Assembly', label: 'Manufacturing & Assembly' },
  { value: 'Warehouse & Logistics', label: 'Warehouse & Logistics' },
  { value: 'Service & Technical Support', label: 'Service & Technical Support' },
  { value: 'Finance & Accounts', label: 'Finance & Accounts' },
  { value: 'Human Resources', label: 'Human Resources' },
];

// Hierarchy roles that should show vertical/level fields
const HIERARCHY_ROLES = [ROLES.CEO, ROLES.NSM, ROLES.STATE_HEAD, ROLES.ASM, ROLES.STORE_MANAGER];

function useManagerOptions({ enabled }) {
  const { data: hierarchy } = useQuery({
    queryKey: queryKeys.employees.hierarchy(),
    queryFn: () => employeesService.getHierarchy(),
    enabled,
    staleTime: 60_000,
  });

  const managers = useMemo(() => {
    const out = [];
    const seen = new Set();
    const walk = (nodes) => {
      (nodes || []).forEach((n) => {
        const id = String(n.id);
        if (!seen.has(id)) {
          seen.add(id);
          const level = n.hierarchyLevel ? ` (${HIERARCHY_LEVEL_LABELS[n.hierarchyLevel] || n.hierarchyLevel})` : '';
          out.push({ id, name: `${n.name}${level}` });
        }
        if (n?.children) walk(n.children);
      });
    };
    walk(hierarchy);
    return out;
  }, [hierarchy]);

  return useMemo(() => {
    return [
      { value: '', label: 'No manager / Top-level' },
      ...managers.map((m) => ({ value: m.id, label: m.name })),
    ];
  }, [managers]);
}

function useDealerOptions({ enabled }) {
  const { data } = useQuery({
    queryKey: ['dealers', 'options-list'],
    queryFn: () => dealersService.getList({ perPage: 100, status: 'ACTIVE' }),
    enabled,
    staleTime: 60_000,
  });

  return useMemo(() => {
    const list = data?.data || data || [];
    return [
      { value: '', label: 'Select Store / Dealer…' },
      ...list.map((d) => ({
        value: String(d.id || d._id),
        label: `${d.name} (${d.city || d.state || 'Store'})`,
      })),
    ];
  }, [data]);
}

function useServiceCenterOptions({ enabled }) {
  const { data } = useQuery({
    queryKey: ['service-centers', 'options-list'],
    queryFn: () => serviceCenterService.getList({ perPage: 100 }),
    enabled,
    staleTime: 60_000,
  });

  return useMemo(() => {
    const list = data?.data || data || [];
    return [
      { value: '', label: 'Select Service Center…' },
      ...list.map((sc) => ({
        value: String(sc.id || sc._id),
        label: `${sc.name} (${sc.city || sc.state || 'Service'})`,
      })),
    ];
  }, [data]);
}

function buildHierarchyFields(role, dealerOptions = [], serviceCenterOptions = []) {
  if (!HIERARCHY_ROLES.includes(role)) return [];

  const fields = [
    { name: 'vertical', label: 'Vertical', type: 'select', options: verticalOptions },
    { name: 'hierarchyLevel', label: 'Hierarchy Level', type: 'select', options: hierarchyLevelOptions },
  ];

  // Sub-vertical only for SALES_PRODUCTION vertical (NSM level specifically)
  if (role === ROLES.NSM) {
    fields.splice(1, 0, {
      name: 'subVertical',
      label: 'Sub-Vertical (Sales / Service)',
      type: 'select',
      options: subVerticalOptions,
    });
  }

  // Territory for STATE_HEAD and ASM
  if ([ROLES.STATE_HEAD, ROLES.ASM].includes(role)) {
    fields.push({ name: 'territoryState', label: 'State (Territory)', type: 'text' });
  }
  if (role === ROLES.ASM) {
    fields.push({ name: 'territoryDistrict', label: 'District (Territory)', type: 'text' });
  }

  // Store Manager linked to Dealer / Store
  if (role === ROLES.STORE_MANAGER) {
    fields.push({
      name: 'dealerId',
      label: 'Assigned Store / Dealer',
      type: 'select',
      options: dealerOptions,
    });
  }

  // Service Center assignment for Service NSM
  if (role === ROLES.NSM) {
    fields.push({
      name: 'serviceCenterId',
      label: 'Service Center (If Service Sub-Vertical)',
      type: 'select',
      options: serviceCenterOptions,
    });
  }

  return fields;
}

export function EmployeeDrawer({ open, onOpenChange }) {
  const qc = useQueryClient();
  const managerOptions = useManagerOptions({ enabled: open });
  const dealerOptions = useDealerOptions({ enabled: open });
  const serviceCenterOptions = useServiceCenterOptions({ enabled: open });
  const [selectedRole, setSelectedRole] = useState(ROLES.EMPLOYEE);

  useEffect(() => {
    if (open) setSelectedRole(ROLES.EMPLOYEE);
  }, [open]);

  return (
    <DrawerForm
      open={open}
      onOpenChange={onOpenChange}
      title="Add Employee / Onboarding"
      schema={createSchema}
      defaultValues={{
        name: '', email: '', phone: '',
        department: 'Operations', designation: '',
        role: ROLES.EMPLOYEE, managerId: '',
        vertical: '', subVertical: '', hierarchyLevel: '',
        territoryState: '', territoryDistrict: '',
        dealerId: '', serviceCenterId: '',
      }}
      fields={[
        { name: 'name', label: 'Full Name' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'phone', label: 'Phone', type: 'tel' },
        { name: 'department', label: 'Department', type: 'select', options: deptOptions },
        { name: 'designation', label: 'Designation (Job Title)' },
        {
          name: 'role',
          label: 'Role',
          type: 'select',
          options: roleOptions,
          onChange: (val) => setSelectedRole(val),
        },
        { name: 'managerId', label: 'Reports To (Manager)', type: 'select', options: managerOptions },
        // Hierarchy-specific fields rendered based on selected role
        ...buildHierarchyFields(selectedRole, dealerOptions, serviceCenterOptions),
      ]}
      onSubmit={async (data) => {
        const payload = {
          ...data,
          managerId: data.managerId || null,
          dealerId: data.dealerId || null,
          serviceCenterId: data.serviceCenterId || null,
          territory: {
            state: data.territoryState || '',
            district: data.territoryDistrict || '',
          },
        };
        // Clean up flat territory fields before sending
        delete payload.territoryState;
        delete payload.territoryDistrict;
        await employeesService.create(payload);
        qc.invalidateQueries({ queryKey: queryKeys.employees.all });
      }}
      submitLabel="Add Employee"
    />
  );
}

export function EmployeeEditDrawer({ employee, open, onOpenChange }) {
  const qc = useQueryClient();
  const managerOptions = useManagerOptions({ enabled: open });
  const dealerOptions = useDealerOptions({ enabled: open });
  const serviceCenterOptions = useServiceCenterOptions({ enabled: open });
  const [selectedRole, setSelectedRole] = useState(employee?.role || ROLES.EMPLOYEE);

  useEffect(() => {
    if (employee?.role) setSelectedRole(employee.role);
  }, [employee?.role, open]);

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
        designation: employee.designation || '',
        role: employee.role || ROLES.EMPLOYEE,
        status: employee.status || 'ACTIVE',
        managerId: employee.manager ? String(employee.manager) : '',
        vertical: employee.vertical || '',
        subVertical: employee.subVertical || '',
        hierarchyLevel: employee.hierarchyLevel || '',
        territoryState: employee.territory?.state || '',
        territoryDistrict: employee.territory?.district || '',
        dealerId: employee.dealerId ? String(employee.dealerId) : '',
        serviceCenterId: employee.serviceCenterId ? String(employee.serviceCenterId) : '',
      }}
      fields={[
        { name: 'department', label: 'Department', type: 'select', options: deptOptions },
        { name: 'designation', label: 'Designation' },
        {
          name: 'role',
          label: 'Role',
          type: 'select',
          options: roleOptions,
          onChange: (val) => setSelectedRole(val),
        },
        { name: 'managerId', label: 'Reports To', type: 'select', options: managerOptions },
        ...buildHierarchyFields(selectedRole, dealerOptions, serviceCenterOptions),
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          options: [
            { value: 'ACTIVE', label: 'Active' },
            { value: 'INACTIVE', label: 'Inactive' },
            { value: 'ON_LEAVE', label: 'On Leave' },
            { value: 'PROBATION', label: 'Probation' },
            { value: 'NOTICE_PERIOD', label: 'Notice Period' },
          ],
        },
      ]}
      onSubmit={async (data) => {
        const payload = {
          ...data,
          managerId: data.managerId || null,
          dealerId: data.dealerId || null,
          serviceCenterId: data.serviceCenterId || null,
          territory: {
            state: data.territoryState || '',
            district: data.territoryDistrict || '',
          },
        };
        delete payload.territoryState;
        delete payload.territoryDistrict;
        await employeesService.update(employee.id, payload);
        qc.invalidateQueries({ queryKey: queryKeys.employees.all });
      }}
      submitLabel="Save Changes"
    />
  );
}

export { EmployeeDealersDrawer };
export { EmployeeReportingLinePanel };
