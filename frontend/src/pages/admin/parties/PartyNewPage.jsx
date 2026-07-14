import { PageShell } from '@/components/layout/PageShell';
import { PartyForm } from '@/modules/parties/PartyForm';

export default function PartyNewPage() {
  return (
    <PageShell title="Create Party" subtitle="Add supplier, dealer, customer or any business party" back={{ label: 'Parties', href: '/admin/parties' }}>
      <PartyForm />
    </PageShell>
  );
}
