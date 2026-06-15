export const taskColumns = [
  { key: 'title', label: 'Task', width: 240 },
  { key: 'assignee', label: 'Assignee', width: 140 },
  { key: 'priority', label: 'Priority', width: 100, render: 'badge' },
  { key: 'status', label: 'Status', width: 110, render: 'badge' },
  { key: 'dueDate', label: 'Due', width: 120, render: 'date' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right' },
];

export const taskDetailFields = [
  { key: 'title', label: 'Title' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'priority', label: 'Priority', format: 'badge' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'dueDate', label: 'Due Date', format: 'date' },
  { key: 'createdAt', label: 'Created', format: 'datetime' },
];
