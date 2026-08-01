import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { purchaseReturnsService } from '@/services/purchaseReturns.service';
import { queryKeys } from '@/services/api/queryKeys';
import { formatCurrency } from '@/utils/format';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DealerPurchaseReturnListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filters = { perPage: 50 };
  if (search) filters.search = search;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.purchaseReturns.list(filters),
    queryFn: () => purchaseReturnsService.getList(filters),
  });

  const rows = data?.data ?? [];

  return (
    <PageShell
      title="Purchase Returns"
      subtitle="Send stock back to admin when you need to return product"
      actions={
        <Button asChild size="sm">
          <Link to="/dealer/purchase-returns/new">
            <Plus className="h-4 w-4" /> New Purchase Return
          </Link>
        </Button>
      }
    >
      <div className="mb-4">
        <Input
          placeholder="Search return no…"
          className="h-8 w-64 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-surface-2 text-left text-xs uppercase text-[var(--color-text-secondary)]">
              <th className="px-4 py-3">Return No</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-[var(--color-text-tertiary)]">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-[var(--color-text-tertiary)]">No purchase returns yet</td></tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => navigate(`/dealer/purchase-returns/${row.id}`)}
                  className="cursor-pointer border-b border-surface-3 transition-colors hover:bg-surface-2/50"
                >
                  <td className="px-4 py-3 font-mono text-xs">{row.returnNo}</td>
                  <td className="px-4 py-3">{(row.lineItems || []).length} item(s)</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">{formatCurrency(row.returnAmount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">{fmtDate(row.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
