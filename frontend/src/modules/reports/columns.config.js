export const reportColumns = [
  { key: 'title', label: 'Report', width: 220 },
  { key: 'type', label: 'Type', width: 120 },
  { key: 'author', label: 'Author', width: 140 },
  { key: 'status', label: 'Status', width: 110, render: 'badge' },
  { key: 'createdAt', label: 'Created', width: 120, render: 'relativeDate' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right' },
];

export const reportDetailFields = [
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
  { key: 'author', label: 'Author' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'createdAt', label: 'Created', format: 'datetime' },
];
