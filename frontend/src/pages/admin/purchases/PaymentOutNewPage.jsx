import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { PaymentOutForm } from '@/modules/payments';

export default function PaymentOutNewPage() {
  return (
    <DetailPageShell
      back={{ label: 'Payment Out', href: '/admin/purchases/payment-out' }}
      title="New Payment Out"
      subtitle="Record money paid to a party"
    >
      <PaymentOutForm />
    </DetailPageShell>
  );
}
