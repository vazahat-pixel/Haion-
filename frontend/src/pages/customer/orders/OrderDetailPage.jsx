import { CustomerPageShell } from '@/components/layout/CustomerPageShell';
import { useParams } from 'react-router-dom';
import { OrderTrackingPanel } from '@/modules/orders/OrderTrackingPanel';
import { useEntityDetail } from '@/hooks/useEntityDetail';
import { ordersService } from '@/services/orders.service';
import { queryKeys } from '@/services/api/queryKeys';
import { DetailView } from '@/components/data-display/DetailView';
import { orderDetailFields } from '@/modules/orders/columns.config';

export default function OrderDetailPage() {
  const { id } = useParams();
  const { data, isLoading, isError, refetch } = useEntityDetail(
    queryKeys.orders.detail,
    ordersService.getDetail,
    id
  );

  return (
    <CustomerPageShell title="Order Details" subtitle="Live tracking & order information">
      <OrderTrackingPanel id={id} />
      <DetailView
        fields={orderDetailFields}
        data={data}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
      />
    </CustomerPageShell>
  );
}
