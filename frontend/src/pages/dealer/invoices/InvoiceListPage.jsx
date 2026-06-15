import { PageShell } from '@/components/layout/PageShell';
import { InvoiceTable } from '@/modules/billing';

export default function InvoiceListPage() {
  return (
    <PageShell title="Invoices" subtitle="View issued invoices">
      <InvoiceTable />
    </PageShell>
  );
}
