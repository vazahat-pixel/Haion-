export const dealerGrnColumns = [
  { key: 'grnNo', label: 'GRN #', width: 130 },
  { key: 'dispatchNo', label: 'Dispatch', width: 140 },
  { key: 'items', label: 'Items', width: 70, align: 'right', render: 'number' },
  { key: 'received', label: 'Received', width: 80, align: 'right', render: 'number' },
  { key: 'status', label: 'Status', width: 110, render: 'badge' },
  { key: 'receivedAt', label: 'Date', width: 120, render: 'relativeDate' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right', sortable: false },
];

export const dealerGrnDetailFields = [
  { key: 'grnNo', label: 'GRN Number' },
  { key: 'dispatchNo', label: 'Dispatch Reference' },
  { key: 'items', label: 'Expected Items', format: 'number' },
  { key: 'received', label: 'Received Items', format: 'number' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'receivedAt', label: 'Received At', format: 'datetime' },
];
