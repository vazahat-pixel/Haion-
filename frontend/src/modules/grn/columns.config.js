export const grnColumns = [
  { key: 'grnNo', label: 'GRN #', width: 130 },
  { key: 'warehouse', label: 'Warehouse', width: 100 },
  { key: 'supplier', label: 'Supplier', width: 160 },
  { key: 'items', label: 'Items', width: 70, align: 'right', render: 'number' },
  { key: 'status', label: 'Status', width: 130, render: 'badge' },
  { key: 'receivedAt', label: 'Received', width: 120, render: 'relativeDate' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right' },
];

export const grnDetailFields = [
  { key: 'grnNo', label: 'GRN Number' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'items', label: 'Items', format: 'number' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'receivedAt', label: 'Received', format: 'datetime' },
];
