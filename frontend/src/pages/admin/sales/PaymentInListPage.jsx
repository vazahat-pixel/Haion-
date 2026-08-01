import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { paymentsService } from '@/services/payments.service';
import { queryKeys } from '@/services/api/queryKeys';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/utils/cn';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const MODE_COLORS = {
  CASH: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  BANK_TRANSFER: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  UPI: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  NETBANKING: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400',
  CHEQUE: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  OTHER: 'bg-surface-3 text-[var(--color-text-secondary)]',
};

export default function PaymentInListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('');
  const [page, setPage] = useState(1);

  const filters = { type: 'PAYMENT_IN', page, perPage: 20 };
  if (search) filters.search = search;
  if (mode) filters.paymentMode = mode;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.payments.list(filters),
    queryFn: () => paymentsService.getList(filters),
  });

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <PageShell
      title="Payment In"
      subtitle={`${total} payment(s) received`}
      actions={
        <Button asChild size="sm">
          <Link to="/admin/sales/payment-in/new">
            <Plus className="h-4 w-4" /> New Payment In
          </Link>
        </Button>
      }
    >
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Input
          placeholder="Search party, payment no…"
          className="h-8 w-60 text-sm"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <Select
          className="h-8 text-sm w-44"
          value={mode}
          onChange={(e) => { setMode(e.target.value); setPage(1); }}
        >
          <option value="">All Modes</option>
          {['CASH', 'BANK_TRANSFER', 'UPI', 'NETBANKING', 'CHEQUE', 'OTHER'].map((m) => (
            <option key={m} value={m}>{m.replace('_', ' ')}</option>
          ))}
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-surface-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-surface-2 text-left text-xs uppercase text-[var(--color-text-secondary)]">
              <th className="px-4 py-3">Payment No</th>
              <th className="px-4 py-3">Party</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Mode</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Discount</th>
              <th className="px-4 py-3 text-right">Net</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-[var(--color-text-tertiary)]">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-[var(--color-text-tertiary)]">No payment in records yet</td></tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => navigate(`/admin/sales/payment-in/${row.id}`)}
                  className="cursor-pointer border-b border-surface-3 transition-colors hover:bg-surface-2/50"
                >
                  <td className="px-4 py-3 font-mono text-xs">{row.paymentNo}</td>
                  <td className="px-4 py-3 font-medium">{row.partyName}</td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">{fmtDate(row.paymentDate)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-semibold', MODE_COLORS[row.paymentMode] || MODE_COLORS.OTHER)}>
                      {(row.paymentMode || '').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(row.amount)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--color-text-secondary)]">
                    {row.discount > 0 ? formatCurrency(row.discount) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(row.netAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                      row.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-red-500/15 text-red-700 dark:text-red-400'
                    )}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-[var(--color-text-secondary)]">Page {page} of {Math.ceil(total / 20)}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
            <Button size="sm" variant="outline" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
