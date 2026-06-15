export const tierColumns = [
  { key: 'productName', label: 'Product', width: 180 },
  { key: 'name', label: 'Tier', width: 120 },
  { key: 'code', label: 'Code', width: 100 },
  { key: 'basePrice', label: 'Base Price', width: 110, align: 'right', render: 'currency' },
  { key: 'gstRate', label: 'GST %', width: 70, align: 'right', render: 'number' },
  { key: 'warrantyDuration', label: 'Warranty', width: 90, align: 'right', render: 'number' },
  { key: 'status', label: 'Status', width: 100, render: 'badge' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right' },
];

export const tierDetailFields = [
  { key: 'productName', label: 'Product' },
  { key: 'productSku', label: 'SKU' },
  { key: 'name', label: 'Tier Name' },
  { key: 'code', label: 'Tier Code' },
  { key: 'basePrice', label: 'Base Price', format: 'currency' },
  { key: 'gstRate', label: 'GST %', format: 'number' },
  { key: 'warrantyDuration', label: 'Warranty Duration', format: 'number' },
  { key: 'warrantyUnit', label: 'Warranty Unit' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status', format: 'badge' },
];
