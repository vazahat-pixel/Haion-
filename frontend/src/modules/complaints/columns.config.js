export const complaintColumns = [
  { key: 'ticketNo', label: 'Ticket #', width: 130 },
  { key: 'customer', label: 'Customer', width: 140 },
  { key: 'product', label: 'Product', width: 160 },
  { key: 'priority', label: 'Priority', width: 100, render: 'badge' },
  { key: 'status', label: 'Status', width: 110, render: 'badge' },
  { key: 'assignedTo', label: 'Assigned', width: 130 },
  { key: 'createdAt', label: 'Created', width: 120, render: 'relativeDate' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right' },
];

export const complaintDetailFields = [
  { key: 'ticketNo', label: 'Ticket Number' },
  { key: 'customer', label: 'Customer' },
  { key: 'product', label: 'Product' },
  { key: 'priority', label: 'Priority', format: 'badge' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'assignedTo', label: 'Assigned To' },
  { key: 'createdAt', label: 'Created', format: 'datetime' },
];
