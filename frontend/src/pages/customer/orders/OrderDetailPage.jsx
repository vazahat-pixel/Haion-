import { CustomerPageShell } from '@/components/layout/CustomerPageShell';
import { useParams } from 'react-router-dom';
import { OrderDetail } from '@/modules/orders';

export default function OrderDetailPage() {
  const { id } = useParams();
  return (
    <CustomerPageShell title="Order Details" subtitle="Order information">
      <OrderDetail id={id} />
    </CustomerPageShell>
  );
}
