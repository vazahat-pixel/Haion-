import { Link } from 'react-router-dom';
import { CustomerPageShell } from '@/components/layout/CustomerPageShell';
import { OrderTable } from '@/modules/orders';
import { useEntityList } from '@/hooks/useEntityList';
import { ordersService } from '@/services/orders.service';
import { queryKeys } from '@/services/api/queryKeys';
import { CustomerCardList, CustomerCardRow } from '@/components/data-display/CustomerCardList';
import { formatCurrency, formatRelative } from '@/utils/format';

export default function OrderListPage() {
  const { data, isLoading, isError, refetch } = useEntityList(queryKeys.orders.list, ordersService.getList);
  const rows = data?.data ?? data ?? [];

  return (
    <CustomerPageShell title="Orders" subtitle="Your order history">
      <CustomerCardList
        items={rows}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        basePath="/customer/orders"
        emptyTitle="No orders yet"
        renderItem={(o) => (
          <CustomerCardRow
            title={o.orderNo}
            subtitle={`${o.items ?? 0} items · ${formatCurrency(o.total)}`}
            meta={formatRelative(o.placedAt || o.createdAt)}
            status={o.status}
          />
        )}
      />
      <div className="hidden lg:block">
        <OrderTable />
      </div>
    </CustomerPageShell>
  );
}
