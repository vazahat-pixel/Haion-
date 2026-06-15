export const dispatchColumns = [
  { key: 'dispatchNo', label: 'Dispatch #', width: 140 },
  { key: 'dealer', label: 'Dealer', width: 160 },
  { key: 'warehouse', label: 'Warehouse', width: 100 },
  { key: 'items', label: 'Items', width: 70, align: 'right', render: 'number' },
  { key: 'status', label: 'Status', width: 110, render: 'badge' },
  { key: 'createdAt', label: 'Created', width: 120, render: 'relativeDate' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right' },
];

export const dispatchDetailFields = [
  { key: 'dispatchNo', label: 'Dispatch Number' },
  { key: 'dealer', label: 'Dealer' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'items', label: 'Items', format: 'number' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'createdAt', label: 'Created', format: 'datetime' },
  { key: 'eta', label: 'ETA', format: 'date' },
];
