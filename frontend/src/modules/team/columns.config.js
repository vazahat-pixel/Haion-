export const teamColumns = [
  { key: 'name', label: 'Name', width: 160 },
  { key: 'role', label: 'Role', width: 140 },
  { key: 'target', label: 'Target', width: 110, align: 'right', render: 'currency' },
  { key: 'achieved', label: 'Achieved', width: 110, align: 'right', render: 'currency' },
  { key: 'achievementPct', label: '%', width: 70, align: 'right', render: 'number' },
  { key: 'status', label: 'Status', width: 100, render: 'badge' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right' },
];
