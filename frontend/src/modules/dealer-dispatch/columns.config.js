export const dealerDispatchColumns = [
  { key: 'dispatchNo', label: 'Dispatch #', width: 140 },
  { key: 'warehouse', label: 'From', width: 100 },
  { key: 'items', label: 'Items', width: 70, align: 'right', render: 'number' },
  { key: 'trackingNo', label: 'Tracking', width: 120 },
  { key: 'status', label: 'Status', width: 110, render: 'badge' },
  { key: 'eta', label: 'ETA', width: 110, render: 'relativeDate' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right', sortable: false },
];

export const dealerDispatchDetailFields = [
  { key: 'dispatchNo', label: 'Dispatch Number' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'items', label: 'Items', format: 'number' },
  { key: 'trackingNo', label: 'Tracking Number' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'createdAt', label: 'Dispatched', format: 'datetime' },
  { key: 'eta', label: 'Expected Arrival', format: 'date' },
];
