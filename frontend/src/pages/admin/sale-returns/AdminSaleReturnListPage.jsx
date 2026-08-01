import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageShell } from '@/components/layout/PageShell';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { saleReturnsService } from '@/services/saleReturns.service';
import { queryKeys } from '@/services/api/queryKeys';
import { formatCurrency } from '@/utils/format';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminSaleReturnListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const filters = { perPage: 50 };
  if (search) filters.search = search;
  if (status) filters.status = status;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.saleReturns.list(filters),
    queryFn: () => saleReturnsService.getList(filters),
  });

  const rows = data?.data ?? [];

  return (
    <PageShell title="Dealer Sale Returns" subtitle="Customer product returns recorded by dealers">
      <div className="flex flex-wrap gap-3 mb-4">
        <Input
          placeholder="Search return no, customer, bill no…"
          className="h-8 w-64 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select className="h-8 text-sm w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="COMPLETED">Completed</option>
          <option value="VOIDED">Voided</option>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-surface-2 text-left text-xs uppercase text-[var(--color-text-secondary)]">
              <th className="px-4 py-3">Return No</th>
              <th className="px-4 py-3">Dealer</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Bill No</th>
              <th className="px-4 py-3 text-right">Refund</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[var(--color-text-tertiary)]">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-[var(--color-text-tertiary)]">No sale returns yet</td></tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => navigate(`/admin/dealer-sale-returns/${row.id}`)}
                  className="cursor-pointer border-b border-surface-3 transition-colors hover:bg-surface-2/50"
                >
                  <td className="px-4 py-3 font-mono text-xs">{row.returnNo}</td>
                  <td className="px-4 py-3">{row.dealerName}</td>
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
