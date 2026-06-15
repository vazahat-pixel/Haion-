export const pricingColumns = [
  { key: 'sku', label: 'SKU', width: 100 },
  { key: 'product', label: 'Product', width: 180 },
  { key: 'region', label: 'Region', width: 90 },
  { key: 'dealerTier', label: 'Dealer Tier', width: 110 },
  { key: 'effectivePrice', label: 'Price', width: 110, align: 'right', render: 'currency' },
  { key: 'gst', label: 'GST %', width: 70, align: 'right', render: 'number' },
  { key: 'status', label: 'Status', width: 100, render: 'badge' },
  { key: 'actions', label: '', width: 60, render: 'actions', sticky: 'right', sortable: false },
];

export const pricingDetailFields = [
  { key: 'product', label: 'Product' },
  { key: 'sku', label: 'SKU' },
  { key: 'region', label: 'Region' },
  { key: 'dealerTier', label: 'Dealer Tier' },
  { key: 'basePrice', label: 'Base Price', format: 'currency' },
  { key: 'effectivePrice', label: 'Effective Price', format: 'currency' },
  { key: 'gst', label: 'GST %', format: 'number' },
  { key: 'validFrom', label: 'Valid From', format: 'date' },
  { key: 'validTo', label: 'Valid To', format: 'date' },
  { key: 'status', label: 'Status', format: 'badge' },
];
