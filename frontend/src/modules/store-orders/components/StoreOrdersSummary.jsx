import { useQuery } from '@tanstack/react-query';
import { IndianRupee, Package, ShoppingBag, Truck, CreditCard } from 'lucide-react';
import { storeAdminService } from '@/services/storeAdmin.service';
import { formatCurrency } from '@/utils/format';
import { LoadingState } from '@/components/feedback/LoadingState';

const CARD_ICONS = [IndianRupee, ShoppingBag, Package, Truck, CreditCard];

export function StoreOrdersSummary() {
  const { data, isLoading } = useQuery({
    queryKey: ['store-analytics', 'summary'],
    queryFn: () => storeAdminService.getAnalyticsSummary(),
    staleTime: 30_000,
  });

  if (isLoading) return <LoadingState message="Loading sales summary…" />;

  const cards = [
    { label: 'Sales today', value: formatCurrency(data?.todayRevenue || 0), sub: `${data?.todayOrders ?? 0} orders` },
    { label: 'This month', value: formatCurrency(data?.monthRevenue || 0), sub: `${data?.monthOrders ?? 0} orders` },
    { label: 'Total orders', value: String(data?.totalOrders ?? 0), sub: 'All time' },
    { label: 'Pending COD', value: String(data?.pendingCod ?? 0), sub: 'Awaiting delivery' },
    { label: 'Online paid', value: String(data?.onlinePaid ?? 0), sub: 'Razorpay success' },
  ];

  return (
    <div className="mb-5 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-5">
      {cards.map((c, i) => {
        const Icon = CARD_ICONS[i];
        return (
          <div
            key={c.label}
            className="min-w-0 rounded-lg border border-surface-3 bg-surface-1 p-3 shadow-sm sm:p-3.5"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] truncate">
                {c.label}
              </p>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-500/10 text-brand-600">
                <Icon className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="mt-1.5 text-lg font-bold tabular-nums truncate sm:text-xl">{c.value}</p>
            <p className="mt-0.5 text-[11px] text-[var(--color-text-secondary)] truncate">{c.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
