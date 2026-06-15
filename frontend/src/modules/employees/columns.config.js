export const employeeColumns = [
  { key: 'empId', label: 'ID', width: 100 },
  { key: 'name', label: 'Name', width: 160 },
  { key: 'department', label: 'Department', width: 120 },
  { key: 'role', label: 'Role', width: 150 },
  { key: 'email', label: 'Email', width: 180 },
  { key: 'status', label: 'Status', width: 100, render: 'badge' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right' },
];

export const employeeDetailFields = [
  { key: 'empId', label: 'Employee ID' },
  { key: 'name', label: 'Name' },
  { key: 'department', label: 'Department' },
  { key: 'role', label: 'Role' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'joinedAt', label: 'Joined', format: 'date' },
];
