import { PageShell } from '@/components/layout/PageShell';
import { SalesInvoiceForm } from '@/modules/sales-invoices';

export default function SalesInvoiceNewPage() {
  return (
    <PageShell
      title="New Sales Invoice"
      subtitle="Select a registered dealer, add items and generate a B2B sales invoice"
      back={{ label: 'Sales Invoices', href: '/admin/sales-invoices' }}
    >
      <SalesInvoiceForm />
    </PageShell>
  );
}
