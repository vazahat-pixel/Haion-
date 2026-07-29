import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, ClipboardCheck } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { dealerOrdersService } from '@/services/dealer-orders.service';
import { queryKeys } from '@/services/api/queryKeys';
import { useAuth } from '@/hooks/useAuth';

function Badge({ status }) {
  const map = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-blue-100 text-blue-700',
    REJECTED: 'bg-red-100 text-red-700',
    FULFILLED: 'bg-green-100 text-green-700',
  };
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${map[status] || 'bg-surface-2'}`}>{status}</span>;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DealerOrderListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const filters = {
    dealerId: user?.dealerId || undefined,
    search: search || undefined,
    perPage: 50,
  };

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.dealerOrders.list(filters),
    queryFn: () => dealerOrdersService.getList(filters),
    enabled: !!user?.dealerId,
  });

  const orders = data?.data || [];

  return (
    <PageShell
      title="My Purchase Orders"
      subtitle="Orders placed by you to company admin"
      actions={
        <Button onClick={() => navigate('/dealer/orders/new')}>
          <Plus className="h-4 w-4" /> Place Order
        </Button>
      }
    >
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <Input className="w-64 pl-9" placeholder="Search orders by number…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading ? <LoadingState message="Loading orders…" /> : orders.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No orders placed yet"
          description="Place a purchase order to request items from the company admin"
          action={<Button onClick={() => navigate('/dealer/orders/new')}><Plus className="h-4 w-4" /> Place Order</Button>}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-surface-2 text-left text-xs uppercase text-[var(--color-text-secondary)]">
                    <th className="px-4 py-3">Order No</th>
                    <th className="px-4 py-3">Items Count</th>
                    <th className="px-4 py-3">Order Date</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord.id} className="border-b border-surface-3 hover:bg-surface-2 cursor-pointer" onClick={() => navigate(`/dealer/orders/${ord.id}`)}>
                      <td className="px-4 py-3 font-mono font-semibold text-brand-600">{ord.orderNo}</td>
                      <td className="px-4 py-3 tabular-nums">{ord.lineItems?.length || 0} items</td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">{fmtDate(ord.createdAt)}</td>
                      <td className="px-4 py-3"><Badge status={ord.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
