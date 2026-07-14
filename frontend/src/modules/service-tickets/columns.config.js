export const serviceTicketColumns = [
  { key: 'requestNo', label: 'Ticket #', width: 130 },
  { key: 'customerName', label: 'Customer', width: 140 },
  { key: 'product', label: 'Product', width: 160 },
  { key: 'priority', label: 'Priority', width: 90, render: 'badge' },
  { key: 'status', label: 'Status', width: 120, render: 'badge' },
  { key: 'assignedToName', label: 'Assignee', width: 120 },
  { key: 'createdAt', label: 'Created', width: 110, render: 'relativeDate' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right', sortable: false },
];
