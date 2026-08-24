/**
 * CompanyLedgerReconciliation.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Who owes us and who we owe, aged by how far past due each document is.
 * Receivables come from unpaid sales invoices, payables from unpaid purchase
 * bills, and the last panel shows manual company-ledger entries that were
 * posted through to a party ledger.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, Scale, Link2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { companyLedgerService } from '@/services/companyLedger.service';
import { formatCurrency } from '@/utils/format';

const BUCKETS = [
  { key: 'current', label: 'Not due' },
  { key: 'd1_30', label: '1–30 d' },
  { key: 'd31_60', label: '31–60 d' },
  { key: 'd61_90', label: '61–90 d' },
  { key: 'd90plus', label: '90+ d' },
];

function overdueTone(days) {
  if (days > 90) return 'danger';
  if (days > 30) return 'warning';
  if (days > 0) return 'info';
  return 'neutral';
}

function AgingTable({ rows, emptyLabel, amountLabel }) {
  if (!rows.length) {
    return (
      <div className="px-4 py-10 text-center text-sm text-[var(--color-text-secondary)]">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-surface-2 text-left text-xs uppercase text-[var(--color-text-secondary)]">
            <th className="px-4 py-2.5">Party</th>
            <th className="px-4 py-2.5 text-center">Docs</th>
            <th className="px-4 py-2.5 text-center">Oldest</th>
            {BUCKETS.map((b) => (
              <th key={b.key} className="px-3 py-2.5 text-right">{b.label}</th>
            ))}
            <th className="px-4 py-2.5 text-right">{amountLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-surface-3 hover:bg-surface-1 transition-colors">
              <td className="px-4 py-2.5 font-medium">{row.name}</td>
              <td className="px-4 py-2.5 text-center text-xs text-[var(--color-text-secondary)]">{row.docCount}</td>
              <td className="px-4 py-2.5 text-center">
                <Badge variant={overdueTone(row.oldestDays)}>
                  {row.oldestDays > 0 ? `${row.oldestDays}d late` : 'On time'}
                </Badge>
              </td>
              {BUCKETS.map((b) => (
                <td
                  key={b.key}
                  className={`px-3 py-2.5 text-right tabular-nums text-xs ${
                    b.key === 'd90plus' && row.buckets[b.key] > 0 ? 'font-semibold text-red-600' : ''
                  }`}
                >
                  {row.buckets[b.key] > 0 ? formatCurrency(row.buckets[b.key]) : '—'}
                </td>
              ))}
              <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                {formatCurrency(row.outstanding)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CompanyLedgerReconciliation() {
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['company-ledger-reconciliation', asOf],
    queryFn: () => companyLedgerService.getReconciliation({ asOf }),
  });

  const totals = data?.totals;
  const receivables = data?.receivables ?? [];
  const payables = data?.payables ?? [];
  const manual = data?.manualAdjustments ?? [];

  return (
    <div className="space-y-5">
      {/* As-of control */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-4">
          <div>
            <Label className="text-xs">Aged as of</Label>
            <Input
              type="date"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
              className="h-8 w-36 text-sm"
            />
          </div>
          <Button variant="outline" size="sm" className="h-8" onClick={() => refetch()} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <p className="ml-auto text-xs text-[var(--color-text-secondary)]">
            Ageing uses each document&apos;s due date, or its date plus the payment terms when no due date is set.
          </p>
        </CardContent>
      </Card>

      {/* Position summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2.5">
                <ArrowDownLeft className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-green-700">Receivable (they owe us)</p>
                <p className="text-xl font-bold text-green-800 tabular-nums">
                  {formatCurrency(totals?.totalReceivable ?? 0)}
                </p>
                <p className="text-[11px] text-green-700/80">
                  {formatCurrency(totals?.overdueReceivable ?? 0)} overdue
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-orange-100 p-2.5">
                <ArrowUpRight className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-orange-700">Payable (we owe them)</p>
                <p className="text-xl font-bold text-orange-800 tabular-nums">
                  {formatCurrency(totals?.totalPayable ?? 0)}
                </p>
                <p className="text-[11px] text-orange-700/80">
                  {formatCurrency(totals?.overduePayable ?? 0)} overdue
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2.5">
                <Scale className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-blue-700">Net position</p>
                <p className={`text-xl font-bold tabular-nums ${(totals?.netPosition ?? 0) >= 0 ? 'text-blue-800' : 'text-red-700'}`}>
                  {formatCurrency(totals?.netPosition ?? 0)}
                </p>
                <p className="text-[11px] text-blue-700/80">Receivable minus payable</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-[var(--color-text-secondary)]">
            Loading reconciliation…
          </CardContent>
        </Card>
      )}

      {!isLoading && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Receivables ageing — unpaid sales invoices by dealer</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <AgingTable
                rows={receivables}
                amountLabel="Outstanding"
                emptyLabel="No outstanding sales invoices. Every dealer is fully settled."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Payables ageing — unpaid purchase bills by supplier</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <AgingTable
                rows={payables}
                amountLabel="Outstanding"
                emptyLabel="No outstanding purchase bills. Every supplier is fully settled."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Link2 className="h-4 w-4 text-brand-600" />
                Manual entries posted to party ledgers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {manual.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-[var(--color-text-secondary)]">
                  No manual journal entries have been linked to a party yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-surface-2 text-left text-xs uppercase text-[var(--color-text-secondary)]">
                        <th className="px-4 py-2.5">Party</th>
                        <th className="px-4 py-2.5 text-center">Entries</th>
                        <th className="px-4 py-2.5 text-right text-green-700">Credit (In)</th>
                        <th className="px-4 py-2.5 text-right text-red-700">Debit (Out)</th>
                        <th className="px-4 py-2.5 text-right">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {manual.map((row) => (
                        <tr key={row.partyId} className="border-b border-surface-3 hover:bg-surface-1 transition-colors">
                          <td className="px-4 py-2.5 font-medium">{row.partyName}</td>
                          <td className="px-4 py-2.5 text-center text-xs text-[var(--color-text-secondary)]">{row.entryCount}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-green-600">
                            {row.credit > 0 ? formatCurrency(row.credit) : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-red-600">
                            {row.debit > 0 ? formatCurrency(row.debit) : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                            {formatCurrency(row.net)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default CompanyLedgerReconciliation;
