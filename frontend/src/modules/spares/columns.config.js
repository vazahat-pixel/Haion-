export const sparesColumns = [
  { key: 'requestNo', label: 'Request #', width: 130 },
  { key: 'partName', label: 'Part', width: 180 },
  { key: 'quantity', label: 'Qty', width: 70, align: 'right', render: 'number' },
  { key: 'requestedBy', label: 'Requested By', width: 160 },
  { key: 'status', label: 'Status', width: 110, render: 'badge' },
  { key: 'createdAt', label: 'Created', width: 120, render: 'relativeDate' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right' },
];

export const sparesDetailFields = [
  { key: 'requestNo', label: 'Request Number' },
  { key: 'partName', label: 'Part Name' },
  { key: 'quantity', label: 'Quantity', format: 'number' },
  { key: 'requestedBy', label: 'Requested By' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'createdAt', label: 'Created', format: 'datetime' },
];
