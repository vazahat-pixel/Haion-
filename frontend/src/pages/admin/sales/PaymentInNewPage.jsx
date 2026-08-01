import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { PaymentInForm } from '@/modules/payments';

export default function PaymentInNewPage() {
  return (
    <DetailPageShell
      back={{ label: 'Payment In', href: '/admin/sales/payment-in' }}
      title="New Payment In"
      subtitle="Record money received from a party"
    >
      <PaymentInForm />
    </DetailPageShell>
  );
}
