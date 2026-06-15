export const dealerInventoryColumns = [
  { key: 'sku', label: 'SKU', width: 100 },
  { key: 'name', label: 'Product', width: 200 },
  { key: 'quantity', label: 'Qty', width: 80, align: 'right', render: 'number' },
  { key: 'reorderLevel', label: 'Reorder', width: 90, align: 'right', render: 'number' },
  { key: 'status', label: 'Status', width: 110, render: 'badge' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right' },
];

export const dealerInventoryDetailFields = [
  { key: 'sku', label: 'SKU' },
  { key: 'name', label: 'Product' },
  { key: 'quantity', label: 'Quantity', format: 'number' },
  { key: 'reorderLevel', label: 'Reorder Level', format: 'number' },
  { key: 'status', label: 'Status', format: 'badge' },
];
