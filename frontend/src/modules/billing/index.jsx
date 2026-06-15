import { queryKeys } from '@/services/api/queryKeys';
import { billingService } from '@/services/billing.service';
import { invoicesService } from '@/services/invoices.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { billingColumns, billingDetailFields, invoiceColumns, invoiceDetailFields } from './columns.config';

export { BillingInvoiceBuilder } from './BillingInvoiceBuilder';
export { BillingDetailPanel } from './BillingDetailPanel';
export { InvoicePreview } from './InvoicePreview';

export const BillingTable = createListTable({
  service: billingService,
  queryKey: queryKeys.billing.list,
  columns: billingColumns,
  basePath: '/dealer/billing',
  searchKeys: ['billNo', 'customer'],
  filterKey: 'status',
  filterOptions: [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SENT', label: 'Sent' },
    { value: 'PAID', label: 'Paid' },
  ],
  searchPlaceholder: 'Search bills…',
});

export const BillingDetail = createDetailView({
  service: billingService,
  queryKey: queryKeys.billing.detail,
  fields: billingDetailFields,
});

export const InvoiceTable = createListTable({
  service: invoicesService,
  queryKey: queryKeys.invoices.list,
  columns: invoiceColumns,
  basePath: '/dealer/invoices',
  searchKeys: ['invoiceNo', 'billNo', 'customer'],
  filterKey: 'status',
  filterOptions: [
    { value: 'SENT', label: 'Sent' },
    { value: 'PAID', label: 'Paid' },
  ],
});

export const InvoiceDetail = createDetailView({
  service: invoicesService,
  queryKey: queryKeys.invoices.detail,
  fields: invoiceDetailFields,
});
