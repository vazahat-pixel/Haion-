export const orderColumns = [
  { key: 'orderNo', label: 'Order #', width: 130 },
  { key: 'items', label: 'Items', width: 70, align: 'right', render: 'number' },
  { key: 'total', label: 'Total', width: 110, align: 'right', render: 'currency' },
  { key: 'status', label: 'Status', width: 110, render: 'badge' },
  { key: 'placedAt', label: 'Placed', width: 120, render: 'relativeDate' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right' },
];

export const orderDetailFields = [
  { key: 'orderNo', label: 'Order Number' },
  { key: 'items', label: 'Items', format: 'number' },
  { key: 'total', label: 'Total', format: 'currency' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'placedAt', label: 'Placed', format: 'datetime' },
  { key: 'eta', label: 'ETA', format: 'date' },
];
