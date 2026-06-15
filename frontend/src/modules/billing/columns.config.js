export const billingColumns = [
  { key: 'billNo', label: 'Bill #', width: 140 },
  { key: 'customer', label: 'Customer', width: 160 },
  { key: 'amount', label: 'Amount', width: 110, align: 'right', render: 'currency' },
  { key: 'tax', label: 'Tax', width: 90, align: 'right', render: 'currency' },
  { key: 'total', label: 'Total', width: 110, align: 'right', render: 'currency' },
  { key: 'status', label: 'Status', width: 100, render: 'badge' },
  { key: 'createdAt', label: 'Created', width: 120, render: 'relativeDate' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right' },
];

export const billingDetailFields = [
  { key: 'billNo', label: 'Bill Number' },
  { key: 'customer', label: 'Customer' },
  { key: 'amount', label: 'Subtotal', format: 'currency' },
  { key: 'tax', label: 'Tax', format: 'currency' },
  { key: 'total', label: 'Total', format: 'currency' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'dueDate', label: 'Due Date', format: 'date' },
  { key: 'createdAt', label: 'Created', format: 'datetime' },
];

export const invoiceColumns = [
  { key: 'invoiceNo', label: 'Invoice #', width: 140 },
  { key: 'billNo', label: 'Bill #', width: 130 },
  { key: 'customer', label: 'Customer', width: 160 },
  { key: 'amount', label: 'Amount', width: 120, align: 'right', render: 'currency' },
  { key: 'status', label: 'Status', width: 100, render: 'badge' },
  { key: 'issuedAt', label: 'Issued', width: 120, render: 'relativeDate' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right' },
];

export const invoiceDetailFields = [
  { key: 'invoiceNo', label: 'Invoice Number' },
  { key: 'billNo', label: 'Bill Number' },
  { key: 'customer', label: 'Customer' },
  { key: 'amount', label: 'Amount', format: 'currency' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'issuedAt', label: 'Issued', format: 'datetime' },
];
