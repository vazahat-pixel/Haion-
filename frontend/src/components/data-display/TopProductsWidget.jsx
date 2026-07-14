import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/format';
import { useStoreTopProducts } from '@/modules/store-orders';
import { LoadingState } from '@/components/feedback/LoadingState';

export function TopProductsWidget({ adminView = false }) {
  const { data: products, isLoading } = useStoreTopProducts(5, adminView);
  const list = products?.length ? products : [];

  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Top Store Products</CardTitle>
        <Link
          to={adminView ? '/admin/store-orders' : '/dealer/reports'}
          className="text-xs text-brand-600 hover:underline"
        >
          View orders
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState message="Loading products…" />
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground">No store sales yet.</p>
        ) : (
          <ul className="space-y-3">
            {list.map((p, i) => (
              <li key={p.productId || p.name} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-50 text-xs font-semibold text-brand-700">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">{p.units} units sold</p>
                </div>
                <span className="text-sm font-medium tabular-nums">{formatCurrency(p.revenue)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
