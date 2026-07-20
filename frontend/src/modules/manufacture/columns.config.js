export const manufactureColumns = [
  { key: 'manufactureNo', label: 'MFG #', width: 130 },
  { key: 'finishedName', label: 'Finished Product', width: 200 },
  { key: 'finishedSku', label: 'SKU', width: 110 },
  { key: 'qtyProduced', label: 'Qty', width: 70, align: 'right', render: 'number' },
  { key: 'componentCount', label: 'Materials', width: 90, align: 'right', render: 'number' },
  { key: 'warehouse', label: 'Warehouse', width: 100 },
  { key: 'totalCost', label: 'Material Cost', width: 120, align: 'right', render: 'currency' },
  { key: 'sellingPrice', label: 'Selling Price', width: 120, align: 'right', render: 'currency' },
  { key: 'status', label: 'Status', width: 110, render: 'badge' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right', sortable: false },
];

export const manufactureDetailFields = [
  { key: 'manufactureNo', label: 'Manufacture #' },
  { key: 'finishedName', label: 'Finished Product' },
  { key: 'finishedSku', label: 'SKU' },
  { key: 'qtyProduced', label: 'Qty Produced', format: 'number' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'unitCost', label: 'Material Cost / Unit', format: 'currency' },
  { key: 'totalCost', label: 'Total Material Cost', format: 'currency' },
  { key: 'sellingPrice', label: 'Selling Price / Unit', format: 'currency' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'manufacturedAt', label: 'Manufactured At', format: 'datetime' },
  { key: 'notes', label: 'Notes' },
  { key: 'createdAt', label: 'Created', format: 'datetime' },
];
