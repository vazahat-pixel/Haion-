export const PARTY_TYPE_OPTIONS = [
  { value: 'SUPPLIER', label: 'Supplier' },
  { value: 'DEALER', label: 'Dealer' },
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'OTHER', label: 'Other' },
];

export const partyColumns = [
  { key: 'code', label: 'Code', width: 110 },
  { key: 'name', label: 'Name', width: 200 },
  { key: 'type', label: 'Type', width: 110, render: 'badge' },
  { key: 'partyCategory', label: 'Category', width: 120 },
  { key: 'phone', label: 'Mobile', width: 120 },
  { key: 'gstin', label: 'GSTIN', width: 150 },
  { key: 'status', label: 'Status', width: 100, render: 'badge' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right', sortable: false },
];

export const partyDetailFields = [
  { key: 'code', label: 'Party Code' },
  { key: 'name', label: 'Party Name' },
  { key: 'type', label: 'Type', format: 'badge' },
  { key: 'partyCategory', label: 'Category' },
  { key: 'phone', label: 'Mobile Number' },
  { key: 'email', label: 'Email' },
  { key: 'openingBalance', label: 'Opening Balance', format: 'currency' },
  { key: 'gstin', label: 'GSTIN' },
  { key: 'pan', label: 'PAN Number' },
  { key: 'billingAddress', label: 'Billing Address' },
  { key: 'shippingAddress', label: 'Shipping Address' },
  { key: 'creditPeriodDays', label: 'Credit Period (Days)', format: 'number' },
  { key: 'creditLimit', label: 'Credit Limit', format: 'currency' },
  { key: 'contactPerson', label: 'Contact Person' },
  { key: 'dateOfBirth', label: 'Date of Birth', format: 'date' },
  { key: 'status', label: 'Status', format: 'badge' },
  { key: 'updatedAt', label: 'Last Updated', format: 'datetime' },
];
