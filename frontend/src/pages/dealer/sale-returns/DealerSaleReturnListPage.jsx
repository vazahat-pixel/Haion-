import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { saleReturnsService } from '@/services/saleReturns.service';
import { queryKeys } from '@/services/api/queryKeys';
import { formatCurrency } from '@/utils/format';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DealerSaleReturnListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filters = { perPage: 50 };
  if (search) filters.search = search;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.saleReturns.list(filters),
    queryFn: () => saleReturnsService.getList(filters),
  });

  const rows = data?.data ?? [];

  return (
    <PageShell
      title="Sale Returns"
      subtitle="Record customer product returns received at your shop"
      actions={
        <Button asChild size="sm">
          <Link to="/dealer/sale-returns/new">
            <Plus className="h-4 w-4" /> New Sale Return
          </Link>
        </Button>
      }
    >
      <div className="mb-4">
        <Input
          placeholder="Search return no, customer, bill no…"
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
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Bill No</th>
              <th className="px-4 py-3 text-right">Refund</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--color-text-tertiary)]">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-[var(--color-text-tertiary)]">No sale returns recorded yet</td></tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => navigate(`/dealer/sale-returns/${row.id}`)}
                  className="cursor-pointer border-b border-surface-3 transition-colors hover:bg-surface-2/50"
                >
                  <td className="px-4 py-3 font-mono text-xs">{row.returnNo}</td>
                  <td className="px-4 py-3 font-medium">{row.customerName}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.billNo || '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">{formatCurrency(row.refundAmount)}</td>
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
