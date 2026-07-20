export const productColumns = [
  { key: 'sku', label: 'SKU', width: 110 },
  { key: 'name', label: 'Item', width: 200 },
  { key: 'category', label: 'Category', width: 120 },
  { key: 'brand', label: 'Brand', width: 100 },
  { key: 'gstRate', label: 'GST %', width: 80, align: 'right', render: 'percent' },
  { key: 'stockTotal', label: 'Stock', width: 80, align: 'right', render: 'number' },
  { key: 'status', label: 'Status', width: 100, render: 'badge' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right', sortable: false },
];

export const productDetailFields = [
  { key: 'sku', label: 'SKU' },
  { key: 'name', label: 'Item Name' },
  { key: 'category', label: 'Category' },
  { key: 'brand', label: 'Brand' },
  { key: 'hsn', label: 'HSN Code' },
  { key: 'gstRate', label: 'GST Rate', format: 'percent' },
  { key: 'unitOfMeasure', label: 'Measuring Unit' },
  { key: 'imageUrl', label: 'Image', format: 'image' },
  { key: 'stockTotal', label: 'Total Stock', format: 'number' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'updatedAt', label: 'Last Updated', format: 'datetime' },
];

export const GST_RATE_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 5, label: '5%' },
  { value: 12, label: '12%' },
  { value: 18, label: '18%' },
  { value: 28, label: '28%' },
];
