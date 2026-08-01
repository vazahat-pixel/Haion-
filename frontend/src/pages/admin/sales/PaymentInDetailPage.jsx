import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { XCircle } from 'lucide-react';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { paymentsService } from '@/services/payments.service';
import { queryKeys } from '@/services/api/queryKeys';
import { formatCurrency } from '@/utils/format';
import { toast } from '@/utils/toast';
import { cn } from '@/utils/cn';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PaymentInDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.payments.detail(id),
    queryFn: () => paymentsService.getDetail(id),
  });

  const cancelMutation = useMutation({
    mutationFn: () => paymentsService.cancel(id),
    onSuccess: () => {
      toast.success('Payment cancelled and settlements reversed');
      qc.invalidateQueries({ queryKey: queryKeys.payments.all });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Cancel failed'),
  });

  if (isLoading) return <div className="p-8 text-center text-sm text-[var(--color-text-tertiary)]">Loading…</div>;
  if (!data) return null;

  const isActive = data.status === 'ACTIVE';

  return (
    <DetailPageShell
      back={{ label: 'Payment In', href: '/admin/sales/payment-in' }}
      title={data.paymentNo}
      subtitle={`${data.partyName} · ${fmtDate(data.paymentDate)}`}
      actions={isActive ? (
        <Button
          size="sm"
          variant="destructive"
          disabled={cancelMutation.isPending}
          onClick={() => {
            if (confirm('Cancel this payment? Invoice settlements will be reversed.')) {
              cancelMutation.mutate();
            }
          }}
        >
          <XCircle className="h-4 w-4" /> Cancel Payment
        </Button>
      ) : null}
    >
      <div className="grid gap-6 max-w-3xl">
        {/* Summary */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Payment Summary</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-[var(--color-text-secondary)]">Payment No</dt>
                <dd className="font-mono font-semibold">{data.paymentNo}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-text-secondary)]">Party</dt>
                <dd className="font-medium">{data.partyName}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-text-secondary)]">Date</dt>
                <dd>{fmtDate(data.paymentDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-text-secondary)]">Payment Mode</dt>
                <dd>{(data.paymentMode || '').replace('_', ' ')}</dd>
              </div>
              {data.referenceNo && (
                <div>
                  <dt className="text-xs text-[var(--color-text-secondary)]">Reference No</dt>
                  <dd className="font-mono text-xs">{data.referenceNo}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-[var(--color-text-secondary)]">Status</dt>
                <dd>
                  <span className={cn(
                    'rounded-md px-1.5 py-0.5 text-xs font-semibold',
                    isActive ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-red-500/15 text-red-700 dark:text-red-400'
                  )}>
                    {data.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-text-secondary)]">Amount Received</dt>
                <dd className="text-base font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(data.amount)}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-text-secondary)]">Discount</dt>
                <dd>{data.discount > 0 ? formatCurrency(data.discount) : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-text-secondary)]">Net Amount</dt>
                <dd className="text-base font-bold">{formatCurrency(data.netAmount)}</dd>
              </div>
            </dl>
            {data.notes && (
              <div className="mt-4 rounded-lg bg-surface-2 px-3 py-2 text-sm text-[var(--color-text-secondary)]">
                {data.notes}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Settlements */}
        {(data.settledInvoices?.length > 0) && (
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold">Settled Invoices</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-surface-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-surface-2 text-left text-xs uppercase text-[var(--color-text-secondary)]">
                      <th className="px-3 py-2">Invoice #</th>
                      <th className="px-3 py-2 text-right">Invoice Amt</th>
                      <th className="px-3 py-2 text-right">TDS</th>
                      <th className="px-3 py-2 text-right">Discount</th>
                      <th className="px-3 py-2 text-right">Amount Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.settledInvoices.map((item, idx) => (
                      <tr key={idx} className="border-b border-surface-3">
                        <td className="px-3 py-2 font-mono text-xs">{item.invoiceNo}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(item.invoiceAmount)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{item.tds > 0 ? formatCurrency(item.tds) : '—'}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{item.discount > 0 ? formatCurrency(item.discount) : '—'}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(item.amountReceived)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DetailPageShell>
  );
}
