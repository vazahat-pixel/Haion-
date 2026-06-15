import { CustomerPageShell } from '@/components/layout/CustomerPageShell';
import { OrderTable } from '@/modules/orders';

export default function OrderListPage() {
  return (
    <CustomerPageShell title="Orders" subtitle="Your order history">
      <OrderTable />
    </CustomerPageShell>
  );
}
