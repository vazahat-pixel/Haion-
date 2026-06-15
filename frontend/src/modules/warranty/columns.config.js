export const warrantyColumns = [
  { key: 'serialNo', label: 'Serial #', width: 140 },
  { key: 'product', label: 'Product', width: 160 },
  { key: 'customer', label: 'Customer', width: 140 },
  { key: 'billNo', label: 'Bill #', width: 130 },
  { key: 'status', label: 'Status', width: 100, render: 'badge' },
  { key: 'endDate', label: 'Expires', width: 120, render: 'date' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right' },
];

export const warrantyDetailFields = [
  { key: 'serialNo', label: 'Serial Number' },
  { key: 'product', label: 'Product' },
  { key: 'customer', label: 'Customer' },
  { key: 'billNo', label: 'Bill Number' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'startDate', label: 'Start Date', format: 'date' },
  { key: 'endDate', label: 'End Date', format: 'date' },
];
