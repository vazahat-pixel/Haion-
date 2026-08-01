import { PageShell } from '@/components/layout/PageShell';
import { LedgerReport } from '@/modules/ledger';

export default function LedgerPage() {
  return (
    <PageShell
      title="Party Ledger"
      subtitle="View complete party statement with running balance"
    >
      <LedgerReport />
    </PageShell>
  );
}
