export const serviceRequestColumns = [
  { key: 'requestNo', label: 'Request #', width: 130 },
  { key: 'product', label: 'Product', width: 160 },
  { key: 'issue', label: 'Issue', width: 220 },
  { key: 'status', label: 'Status', width: 110, render: 'badge' },
  { key: 'createdAt', label: 'Created', width: 120, render: 'relativeDate' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right' },
];

export const serviceRequestDetailFields = [
  { key: 'requestNo', label: 'Request Number' },
  { key: 'product', label: 'Product' },
  { key: 'issue', label: 'Issue' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'createdAt', label: 'Created', format: 'datetime' },
];
