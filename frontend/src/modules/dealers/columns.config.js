export const dealerColumns = [
  { key: 'code', label: 'Code', width: 100 },
  { key: 'name', label: 'Dealer', width: 180 },
  { key: 'city', label: 'City', width: 120 },
  { key: 'gstin', label: 'GSTIN', width: 160 },
  { key: 'outstanding', label: 'Outstanding', width: 120, align: 'right', render: 'currency' },
  { key: 'status', label: 'Status', width: 130, render: 'badge' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right' },
];

export const dealerDetailFields = [
  { key: 'code', label: 'Dealer Code' },
  { key: 'name', label: 'Business Name' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'gstin', label: 'GSTIN' },
  { key: 'creditLimit', label: 'Credit Limit', format: 'currency' },
  { key: 'outstanding', label: 'Outstanding', format: 'currency' },
  { key: 'teamSize', label: 'Team Size', format: 'number' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'onboardedAt', label: 'Onboarded', format: 'date' },
];
