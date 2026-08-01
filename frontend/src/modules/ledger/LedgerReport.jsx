import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, TrendingUp, TrendingDown, IndianRupee } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { partiesService } from '@/services/parties.service';
import { paymentsService } from '@/services/payments.service';
import { queryKeys } from '@/services/api/queryKeys';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/utils/cn';

const VOUCHER_LABELS = {
  PAYMENT_IN: 'Payment In',
  PAYMENT_OUT: 'Payment Out',
  SALES_INVOICE: 'Sales Invoice',
  PURCHASE: 'Purchase',
  OPENING_BALANCE: 'Opening Balance',
  JOURNAL: 'Journal',
};

const VOUCHER_COLORS = {
  PAYMENT_IN: 'text-emerald-600 dark:text-emerald-400',
  PAYMENT_OUT: 'text-blue-600 dark:text-blue-400',
  SALES_INVOICE: 'text-violet-600 dark:text-violet-400',
  PURCHASE: 'text-orange-600 dark:text-orange-400',
  OPENING_BALANCE: 'text-[var(--color-text-secondary)]',
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function LedgerReport() {
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data: partiesRes } = useQuery({
    queryKey: queryKeys.parties.list({ status: 'ACTIVE', perPage: 300 }),
    queryFn: () => partiesService.getList({ status: 'ACTIVE', perPage: 300 }),
  });
  const parties = partiesRes?.data ?? [];

  const filters = {};
  if (from) filters.from = from;
  if (to) filters.to = to;

  const { data: ledgerData, isLoading, refetch } = useQuery({
    queryKey: queryKeys.payments.ledger(selectedPartyId, filters),
    queryFn: () => paymentsService.getLedger(selectedPartyId, filters),
    enabled: !!selectedPartyId,
  });

  const party = ledgerData?.party;
  const entries = ledgerData?.entries ?? [];
  const totalCredit = ledgerData?.totalCredit ?? 0;
  const totalDebit = ledgerData?.totalDebit ?? 0;
  const balance = ledgerData?.balance ?? 0;
  const openingBalance = ledgerData?.openingBalance ?? 0;

  // Summary cards
  const summaryCards = [
    {
      label: 'Total Received',
      value: totalCredit,
      icon: TrendingDown,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    {
      label: 'Total Paid Out',
      value: totalDebit,
      icon: TrendingUp,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800',
    },
    {
      label: balance > 0 ? 'Party Owes You' : balance < 0 ? 'You Owe Party' : 'Balance',
      value: Math.abs(balance),
      icon: IndianRupee,
      color: balance > 0 ? 'text-red-600 dark:text-red-400' : balance < 0 ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--color-text-secondary)]',
      bg: balance > 0 ? 'bg-red-50 dark:bg-red-950/30' : balance < 0 ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-surface-2',
      border: balance > 0 ? 'border-red-200 dark:border-red-800' : balance < 0 ? 'border-amber-200 dark:border-amber-800' : 'border-surface-3',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <Label>Select Party</Label>
              <Select value={selectedPartyId} onChange={(e) => setSelectedPartyId(e.target.value)}>
                <option value="">Select party to view ledger…</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>From Date</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label>To Date</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty state */}
      {!selectedPartyId && (
        <div className="flex flex-col items-center py-16 text-center text-[var(--color-text-secondary)]">
          <BookOpen className="mb-3 h-12 w-12 opacity-30" />
          <p className="text-sm">Select a party above to view their complete ledger statement</p>
        </div>
      )}

      {selectedPartyId && isLoading && (
        <div className="py-12 text-center text-sm text-[var(--color-text-tertiary)]">Loading ledger…</div>
      )}

      {selectedPartyId && !isLoading && ledgerData && (
        <>
          {/* Party header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">{party?.name}</h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {party?.type} · {party?.code}
                {party?.gstin && ` · GSTIN: ${party.gstin}`}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Refresh</Button>
          </div>

          {/* Summary cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className={cn('rounded-xl border p-4', card.bg, card.border)}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[var(--color-text-secondary)]">{card.label}</p>
                  <card.icon className={cn('h-4 w-4', card.color)} />
                </div>
                <p className={cn('mt-1 text-xl font-bold tabular-nums', card.color)}>
                  {formatCurrency(card.value)}
                </p>
              </div>
            ))}
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto rounded-xl border border-surface-3 bg-[var(--color-surface-1)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-surface-2 text-left text-xs uppercase text-[var(--color-text-secondary)]">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Voucher Type</th>
                  <th className="px-4 py-3">Sr No / Ref</th>
                  <th className="px-4 py-3">Payment Mode</th>
                  <th className="px-4 py-3 text-right">Credit (Received)</th>
                  <th className="px-4 py-3 text-right">Debit (Paid)</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {/* Opening Balance row */}
                <tr className="border-b border-surface-3 bg-surface-2/60">
                  <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">—</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Opening Balance</span>
                  </td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3 text-right">—</td>
                  <td className="px-4 py-3 text-right">—</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">
                    {formatCurrency(openingBalance)}
                  </td>
                  <td className="px-4 py-3">—</td>
                </tr>

                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-[var(--color-text-tertiary)]">
                      No transactions for this party
                      {(from || to) && ' in the selected date range'}
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => {
                    const isCredit = entry.credit > 0;
                    const isDebit = entry.debit > 0;
                    return (
                      <tr
                        key={entry.id}
                        className="border-b border-surface-3 transition-colors hover:bg-surface-2/50"
                      >
                        <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">
                          {fmtDate(entry.date)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('text-xs font-semibold', VOUCHER_COLORS[entry.voucherType])}>
                            {VOUCHER_LABELS[entry.voucherType] || entry.voucherType}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono text-xs">{entry.voucherNo || '—'}</div>
                          {entry.referenceNo && (
                            <div className="text-[10px] text-[var(--color-text-tertiary)]">
                              ({entry.referenceNo})
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">
                          {entry.paymentMode ? entry.paymentMode.replace('_', ' ') : '—'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {isCredit ? (
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(entry.credit)}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {isDebit ? (
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {formatCurrency(entry.debit)}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className={cn(
                            'font-bold',
                            entry.balance > 0 ? 'text-red-600 dark:text-red-400' :
                            entry.balance < 0 ? 'text-emerald-600 dark:text-emerald-400' :
                            'text-[var(--color-text-primary)]'
                          )}>
                            {entry.balance < 0 ? '-' : ''}{formatCurrency(Math.abs(entry.balance))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">
                          {entry.dueDate ? fmtDate(entry.dueDate) : '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {entries.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-surface-3 bg-surface-2 font-semibold">
                    <td colSpan={4} className="px-4 py-3 text-sm">Totals</td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(totalCredit)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-blue-600 dark:text-blue-400">
                      {formatCurrency(totalDebit)}
                    </td>
                    <td className={cn(
                      'px-4 py-3 text-right tabular-nums text-base',
                      balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                    )}>
                      {balance < 0 ? '-' : ''}{formatCurrency(Math.abs(balance))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}
    </div>
  );
}
