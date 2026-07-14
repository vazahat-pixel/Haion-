export const stockMovementColumns = [
  { key: 'timestamp', label: 'Date', width: 140, render: 'date' },
  { key: 'sku', label: 'SKU', width: 110 },
  { key: 'name', label: 'Product', width: 160 },
  { key: 'movementType', label: 'Action', width: 130, render: 'badge' },
  { key: 'direction', label: 'Dir', width: 70 },
  { key: 'quantity', label: 'Qty', width: 70, align: 'right' },
  { key: 'qtyAfter', label: 'Balance', width: 80, align: 'right' },
  { key: 'reference', label: 'Reference', width: 140 },
  { key: 'performedBy', label: 'By', width: 120 },
];
