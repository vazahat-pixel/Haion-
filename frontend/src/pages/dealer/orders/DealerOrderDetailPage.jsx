import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { dealerOrdersService } from '@/services/dealer-orders.service';
import { queryKeys } from '@/services/api/queryKeys';
import { formatCurrency } from '@/utils/format';

function Badge({ status }) {
  const map = {
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    APPROVED: 'bg-blue-100 text-blue-700 border-blue-200',
    REJECTED: 'bg-red-100 text-red-700 border-red-200',
    FULFILLED: 'bg-green-100 text-green-700 border-green-200',
  };
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${map[status] || 'bg-surface-2'}`}>
      {status}
    </span>
  );
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function DealerOrderDetailPage() {
  const { id } = useParams();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.dealerOrders.detail(id),
    queryFn: () => dealerOrdersService.getDetail(id),
    enabled: !!id,
  });

  if (isLoading) return <LoadingState message="Loading order details…" />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  return (
    <PageShell
      title={`Purchase Order ${data.orderNo}`}
      subtitle="View details, prices, and status of your purchase request"
      back={{ label: 'Purchase Orders', href: '/dealer/orders' }}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-base font-semibold">Ordered Items</CardTitle>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Placed on {fmtDate(data.orderDate)}</p>
              </div>
              <Badge status={data.status} />
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-surface-2 text-left text-xs uppercase text-[var(--color-text-secondary)]">
                      <th className="px-4 py-2.5">Item / SKU</th>
                      <th className="px-4 py-2.5">HSN</th>
                      <th className="px-4 py-2.5 text-right">Qty</th>
                      <th className="px-4 py-2.5 text-right">Price</th>
                      <th className="px-4 py-2.5 text-right">Disc %</th>
                      <th className="px-4 py-2.5 text-right">GST %</th>
                      <th className="px-4 py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.lineItems || []).map((item, index) => (
                      <tr key={index} className="border-b border-surface-3">
                        <td className="px-4 py-3">
                          <p className="font-medium text-[var(--color-text-primary)]">{item.name}</p>
                          <p className="text-xs text-[var(--color-text-secondary)] font-mono">{item.sku}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{item.hsn || '—'}</td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">{item.quantity}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{item.discount ? `${item.discount}%` : '—'}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{item.gstRate}%</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatCurrency(item.lineTotal || (item.quantity * item.unitPrice))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {data.notes && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Your Order Notes</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{data.notes}</p></CardContent>
            </Card>
          )}

          {data.adminNotes && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Admin Processing Feedback</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{data.adminNotes}</p></CardContent>
            </Card>
          )}

          {data.termsAndConditions && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Terms &amp; Conditions</CardTitle></CardHeader>
              <CardContent><p className="text-xs text-[var(--color-text-secondary)] whitespace-pre-wrap">{data.termsAndConditions}</p></CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Info Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">PO Details</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="border-b pb-3">
                <span className="block text-xs text-[var(--color-text-secondary)]">Bill To Recipient</span>
                <span className="font-semibold text-[var(--color-text-primary)]">Aradhya Brothers</span>
              </div>
              <div className="border-b pb-3">
                <span className="block text-xs text-[var(--color-text-secondary)]">PO Number</span>
                <span className="font-mono font-semibold text-[var(--color-text-primary)]">{data.orderNo}</span>
              </div>
              <div className="border-b pb-3">
                <span className="block text-xs text-[var(--color-text-secondary)]">Expiry Date</span>
                <span className="font-semibold text-[var(--color-text-primary)]">{fmtDate(data.expiryDate)}</span>
              </div>
              <div className="border-b pb-3">
                <span className="block text-xs text-[var(--color-text-secondary)]">Status</span>
                <Badge status={data.status} />
              </div>
              {data.reviewedAt && (
                <div>
                  <span className="block text-xs text-[var(--color-text-secondary)]">Reviewed On</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">{fmtDate(data.reviewedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing Totals Sidebar */}
          <Card>
            <CardHeader><CardTitle className="text-base">PO Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">Subtotal</span><span className="tabular-nums font-medium">{formatCurrency(data.subtotal)}</span></div>
              {data.orderDiscount > 0 && <div className="flex justify-between text-red-600"><span className="text-[var(--color-text-secondary)]">Discount</span><span className="tabular-nums font-medium">- {formatCurrency(data.orderDiscount)}</span></div>}
              <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">Taxable Amount</span><span className="tabular-nums font-medium">{formatCurrency(data.taxableAmount)}</span></div>
              <div className="flex justify-between"><span className="text-[var(--color-text-secondary)]">Tax</span><span className="tabular-nums font-medium">{formatCurrency(data.tax)}</span></div>
              <div className="flex justify-between border-t border-surface-3 pt-2 text-base font-bold text-brand-600">
                <span>Total PO Amount</span><span className="tabular-nums">{formatCurrency(data.total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Bank details */}
          {data.bankDetails?.accountNumber && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Bank Account details</CardTitle></CardHeader>
              <CardContent className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                <p>Holder: <strong>{data.bankDetails.holderName}</strong></p>
                <p>A/c Number: <strong>{data.bankDetails.accountNumber}</strong></p>
                <p>IFSC: <strong>{data.bankDetails.ifsc}</strong></p>
                <p>Bank: <strong>{data.bankDetails.bankName}</strong></p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  );
}
