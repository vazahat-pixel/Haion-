export const approvalColumns = [
  { key: 'type', label: 'Type', width: 180 },
  { key: 'requester', label: 'Requester', width: 160 },
  { key: 'amount', label: 'Amount', width: 120, align: 'right', render: 'currency' },
  { key: 'status', label: 'Status', width: 110, render: 'badge' },
  { key: 'submittedAt', label: 'Submitted', width: 120, render: 'relativeDate' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right' },
];

export const approvalDetailFields = [
  { key: 'type', label: 'Approval Type' },
  { key: 'requester', label: 'Requester' },
  { key: 'amount', label: 'Amount', format: 'currency' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'submittedAt', label: 'Submitted', format: 'datetime' },
];
