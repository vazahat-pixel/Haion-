export const purchaseColumns = [
  { key: 'purchaseNo', label: 'Purchase #', width: 130 },
  { key: 'billNo', label: 'Bill No', width: 130 },
  { key: 'partyName', label: 'Supplier', width: 180 },
  { key: 'warehouse', label: 'Warehouse', width: 110 },
  { key: 'itemCount', label: 'Items', width: 70, align: 'right', render: 'number' },
  { key: 'total', label: 'Total', width: 110, align: 'right', render: 'currency' },
  { key: 'status', label: 'Status', width: 110, render: 'badge' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right', sortable: false },
];

export const purchaseDetailFields = [
  { key: 'purchaseNo', label: 'Purchase #' },
  { key: 'billNo', label: 'Supplier Bill No' },
  { key: 'partyName', label: 'Supplier' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'subtotal', label: 'Subtotal', format: 'currency' },
  { key: 'tax', label: 'Tax', format: 'currency' },
  { key: 'total', label: 'Grand Total', format: 'currency' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'receivedAt', label: 'Received At', format: 'datetime' },
  { key: 'notes', label: 'Notes' },
  { key: 'createdAt', label: 'Created', format: 'datetime' },
];
