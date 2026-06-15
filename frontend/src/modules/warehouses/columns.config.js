export const warehouseColumns = [
  { key: 'code', label: 'Code', width: 100 },
  { key: 'name', label: 'Warehouse', width: 200 },
  { key: 'city', label: 'City', width: 120 },
  { key: 'state', label: 'State', width: 120 },
  { key: 'stockCount', label: 'Stock', width: 80, align: 'right', render: 'number' },
  { key: 'manager', label: 'Manager', width: 140 },
  { key: 'updatedAt', label: 'Updated', width: 120, render: 'relativeDate' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right' },
];

export const warehouseDetailFields = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'capacity', label: 'Capacity', format: 'number' },
  { key: 'stockCount', label: 'Current Stock', format: 'number' },
  { key: 'manager', label: 'Manager' },
  { key: 'status', label: 'Status', format: 'badge' },
];
