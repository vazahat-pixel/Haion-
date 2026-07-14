import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Send, CheckCircle, FileText, Shield } from 'lucide-react';
import { useEntityDetail } from '@/hooks/useEntityDetail';
import { billingService } from '@/services/billing.service';
import { warrantyService } from '@/services/warranty.service';
import { queryKeys } from '@/services/api/queryKeys';
import { DetailView } from '@/components/data-display/DetailView';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/format';
import { toast } from '@/utils/toast';

export function BillingDetailPanel({ id }) {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useEntityDetail(queryKeys.billing.detail, billingService.getDetail, id);

  const { data: warrantyInfo } = useQuery({
    queryKey: ['warranty', 'bill', data?.billNo],
    queryFn: () => warrantyService.lookup({ billNo: data.billNo }),
    enabled: !!data?.billNo && ['SENT', 'PAID'].includes(data?.status),
  });

  const sendBill = useMutation({
    mutationFn: () => billingService.send(id),
    onSuccess: () => {
      toast.success('Bill sent — warranty certificates generated');
      qc.invalidateQueries({ queryKey: queryKeys.billing.all });
      refetch();
    },
  });

  const markPaid = useMutation({
    mutationFn: () => billingService.markPaid(id),
    onSuccess: () => { toast.success('Bill marked as paid'); qc.invalidateQueries({ queryKey: queryKeys.billing.all }); refetch(); },
  });

  if (isLoading || isError || !data) {
    return <DetailView fields={[]} data={data} isLoading={isLoading} isError={isError} onRetry={refetch} />;
  }

  const lineItems = data.lineItems || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{data.billNo}</h2>
          <StatusBadge status={data.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          {data.status === 'DRAFT' && (
            <Button size="sm" onClick={() => sendBill.mutate()} disabled={sendBill.isPending}>
              <Send className="h-3.5 w-3.5" /> Send Bill
            </Button>
          )}
          {data.status === 'SENT' && (
            <Button size="sm" onClick={() => markPaid.mutate()} disabled={markPaid.isPending}>
              <CheckCircle className="h-3.5 w-3.5" /> Mark Paid
            </Button>
          )}
          {data.status === 'PAID' && (
            <Button size="sm" variant="outline" asChild>
              <Link to={`/dealer/invoices`}><FileText className="h-3.5 w-3.5" /> View Invoices</Link>
            </Button>
          )}
        </div>
      </div>

      <DetailView
        fields={[
          { key: 'customer', label: 'Customer' },
          { key: 'customerGstin', label: 'Customer GSTIN' },
          { key: 'dueDate', label: 'Due Date', format: 'date' },
          { key: 'createdAt', label: 'Created', format: 'datetime' },
        ]}
        data={data}
      />

      {['SENT', 'PAID'].includes(data.status) && warrantyInfo?.found && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Warranty</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>Warranty certificates were auto-generated for this bill.</p>
            {warrantyInfo.warranty?.id && (
              <Button size="sm" variant="outline" asChild>
                <Link to={`/dealer/warranty/${warrantyInfo.warranty.id}`}>View Certificate</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {lineItems.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Line Items</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-[var(--color-text-secondary)]">
                  <th className="pb-2">Product</th>
                  <th className="pb-2">HSN</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Rate</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, i) => (
                  <tr key={i} className="border-b border-surface-3">
                    <td className="py-2">{item.product}</td>
                    <td className="py-2">{item.hsn}</td>
                    <td className="py-2 text-right tabular-nums">{item.quantity}</td>
                    <td className="py-2 text-right tabular-nums">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2 text-right tabular-nums">{formatCurrency(item.amount || item.quantity * item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{formatCurrency(data.amount)}</dd></div>
              {data.igst > 0 ? (
                <div className="flex justify-between"><dt>IGST</dt><dd className="tabular-nums">{formatCurrency(data.igst)}</dd></div>
              ) : (
                <>
                  <div className="flex justify-between"><dt>CGST</dt><dd className="tabular-nums">{formatCurrency(data.cgst)}</dd></div>
                  <div className="flex justify-between"><dt>SGST</dt><dd className="tabular-nums">{formatCurrency(data.sgst)}</dd></div>
                </>
              )}
              <div className="flex justify-between border-t pt-2 font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatCurrency(data.total)}</dd></div>
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
