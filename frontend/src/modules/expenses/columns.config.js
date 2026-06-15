export const expenseColumns = [
  { key: 'expenseNo', label: 'Expense #', width: 130 },
  { key: 'category', label: 'Category', width: 110 },
  { key: 'description', label: 'Description', width: 200 },
  { key: 'amount', label: 'Amount', width: 110, align: 'right', render: 'currency' },
  { key: 'submittedBy', label: 'Submitted By', width: 130 },
  { key: 'status', label: 'Status', width: 110, render: 'badge' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right', sortable: false },
];

export const expenseDetailFields = [
  { key: 'expenseNo', label: 'Expense Number' },
  { key: 'category', label: 'Category' },
  { key: 'description', label: 'Description' },
  { key: 'amount', label: 'Amount', format: 'currency' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'submittedBy', label: 'Submitted By' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'submittedAt', label: 'Submitted', format: 'datetime' },
];
