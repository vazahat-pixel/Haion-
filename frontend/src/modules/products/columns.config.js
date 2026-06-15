export const productColumns = [
  { key: 'sku', label: 'SKU', width: 110 },
  { key: 'name', label: 'Product', width: 200 },
  { key: 'category', label: 'Category', width: 120 },
  { key: 'brand', label: 'Brand', width: 100 },
  { key: 'dealerPrice', label: 'Dealer Price', width: 120, align: 'right', render: 'currency' },
  { key: 'stockTotal', label: 'Stock', width: 80, align: 'right', render: 'number' },
  { key: 'status', label: 'Status', width: 100, render: 'badge' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right', sortable: false },
];

export const productDetailFields = [
  { key: 'sku', label: 'SKU' },
  { key: 'name', label: 'Product Name' },
  { key: 'category', label: 'Category' },
  { key: 'brand', label: 'Brand' },
  { key: 'hsn', label: 'HSN Code' },
  { key: 'imageUrl', label: 'Image', format: 'image' },
  { key: 'mrp', label: 'MRP', format: 'currency' },
  { key: 'dealerPrice', label: 'Dealer Price', format: 'currency' },
  { key: 'stockTotal', label: 'Total Stock', format: 'number' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'updatedAt', label: 'Last Updated', format: 'datetime' },
];
