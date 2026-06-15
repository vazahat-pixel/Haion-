export const customerColumns = [
  { key: 'code', label: 'Code', width: 100 },
  { key: 'name', label: 'Customer', width: 160 },
  { key: 'phone', label: 'Phone', width: 120 },
  { key: 'city', label: 'City', width: 100 },
  { key: 'totalPurchases', label: 'Total Purchases', width: 130, align: 'right', render: 'currency' },
  { key: 'status', label: 'Status', width: 100, render: 'badge' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right', sortable: false },
];

export const customerDetailFields = [
  { key: 'code', label: 'Customer Code' },
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'city', label: 'City' },
  { key: 'gstin', label: 'GSTIN' },
  { key: 'totalPurchases', label: 'Total Purchases', format: 'currency' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'lastOrderAt', label: 'Last Order', format: 'relativeDate' },
];
