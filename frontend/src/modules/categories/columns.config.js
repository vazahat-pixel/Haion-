export const categoryColumns = [
  { key: 'code', label: 'Code', width: 100 },
  { key: 'name', label: 'Category', width: 160 },
  { key: 'description', label: 'Description', width: 220 },
  { key: 'productCount', label: 'Products', width: 90, align: 'right', render: 'number' },
  { key: 'status', label: 'Status', width: 100, render: 'badge' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right', sortable: false },
];

export const categoryDetailFields = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'productCount', label: 'Products', format: 'number' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'updatedAt', label: 'Updated', format: 'datetime' },
];
