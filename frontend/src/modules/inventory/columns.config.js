export const inventoryColumns = [
  { key: 'sku', label: 'SKU', width: 120, sortable: true, pinnable: true },
  { key: 'name', label: 'Product', width: 280, sortable: true },
  { key: 'category', label: 'Category', width: 140, filterable: true },
  { key: 'quantity', label: 'Qty', width: 80, align: 'right', sortable: true, render: 'number' },
  { key: 'status', label: 'Status', width: 110, render: 'badge' },
  { key: 'updatedAt', label: 'Updated', width: 140, render: 'relativeDate' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right' },
];

export const inventoryDetailFields = [
  { key: 'sku', label: 'SKU' },
  { key: 'name', label: 'Product Name' },
  { key: 'category', label: 'Category' },
  { key: 'quantity', label: 'Quantity', format: 'number' },
  { key: 'unitPrice', label: 'Unit Price', format: 'currency' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'hsn', label: 'HSN Code' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'updatedAt', label: 'Last Updated', format: 'datetime' },
];
