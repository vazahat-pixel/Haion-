export const returnsColumns = [
  { key: 'returnNo', label: 'Return #', width: 130 },
  { key: 'product', label: 'Product', width: 160 },
  { key: 'serialNo', label: 'Serial #', width: 140 },
  { key: 'reason', label: 'Reason', width: 180 },
  { key: 'status', label: 'Status', width: 110, render: 'badge' },
  { key: 'receivedAt', label: 'Received', width: 120, render: 'relativeDate' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right' },
];

export const returnsDetailFields = [
  { key: 'returnNo', label: 'Return Number' },
  { key: 'product', label: 'Product' },
  { key: 'serialNo', label: 'Serial Number' },
  { key: 'reason', label: 'Reason' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'receivedAt', label: 'Received', format: 'datetime' },
];
