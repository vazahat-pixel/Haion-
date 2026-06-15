import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { DealerOnboardingForm } from '@/modules/dealers';

export default function DealerOnboardingPage() {
  return (
    <DetailPageShell
      back={{ label: 'Dealers', href: '/admin/dealers' }}
      title="Dealer Onboarding"
      subtitle="Register a new dealer in the network"
    >
      <DealerOnboardingForm />
    </DetailPageShell>
  );
}
