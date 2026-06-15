export const brandColumns = [
  { key: 'code', label: 'Code', width: 100 },
  { key: 'name', label: 'Brand', width: 140 },
  { key: 'country', label: 'Country', width: 100 },
  { key: 'productCount', label: 'Products', width: 90, align: 'right', render: 'number' },
  { key: 'status', label: 'Status', width: 100, render: 'badge' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right', sortable: false },
];

export const brandDetailFields = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Brand' },
  { key: 'country', label: 'Country' },
  { key: 'website', label: 'Website' },
  { key: 'productCount', label: 'Products', format: 'number' },
  { key: 'status', label: 'Status', format: 'badge' },
];
