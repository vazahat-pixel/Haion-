import { PageShell } from '@/components/layout/PageShell';
import { CompanyLedgerPage } from '@/modules/ledger/CompanyLedgerPage';

export default function CompanyLedgerPageWrapper() {
  return (
    <PageShell
      title="Company Ledger"
      subtitle="Complete financial movement of the warehouse — every rupee in and out"
    >
      <CompanyLedgerPage />
    </PageShell>
  );
}
