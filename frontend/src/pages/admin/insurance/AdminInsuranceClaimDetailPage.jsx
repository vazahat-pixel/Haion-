import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, IndianRupee } from 'lucide-react';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { Timeline } from '@/components/data-display/Timeline';
import { insuranceService } from '@/services/insurance.service';
import { queryKeys } from '@/services/api/queryKeys';
import { formatCurrency } from '@/utils/format';
import { toast } from '@/utils/toast';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminInsuranceClaimDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [reviewNotes, setReviewNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.insuranceClaims.detail(id),
    queryFn: () => insuranceService.getClaim(id),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: queryKeys.insuranceClaims.all });
    qc.invalidateQueries({ queryKey: queryKeys.insuranceWallets.all });
  };

  const review = useMutation({
    mutationFn: (action) => insuranceService.reviewClaim(id, { action, notes: reviewNotes }),
    onSuccess: (_, action) => {
      toast.success(action === 'APPROVE' ? 'Claim approved' : 'Claim rejected');
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Review failed'),
  });

  const pay = useMutation({
    mutationFn: () => insuranceService.payClaim(id),
    onSuccess: () => {
      toast.success('Virtual payment sent to dealer');
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Payment failed'),
  });

  if (isLoading) return <div className="p-8 text-center text-sm text-[var(--color-text-tertiary)]">Loading…</div>;
  if (!data) return null;

  const canReview = ['SUBMITTED', 'UNDER_REVIEW'].includes(data.status);
  const canPay = data.status === 'APPROVED';

  const timelineEvents = (data.timeline || []).map((e) => ({ ...e, timestamp: e.at }));

  return (
    <DetailPageShell
      back={{ label: 'Insurance', href: '/admin/insurance' }}
      title={data.claimNo}
      subtitle={`${data.dealerName} · ${data.customerName}`}
      actions={
        <div className="flex flex-wrap gap-2">
          {canPay && (
            <Button size="sm" disabled={pay.isPending} onClick={() => pay.mutate()}>
              <IndianRupee className="h-3.5 w-3.5" /> Send Virtual Payment
            </Button>
          )}
        </div>
      }
    >
      <div className="grid gap-6 max-w-3xl">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Claim Summary</CardTitle>
            <StatusBadge status={data.status} />
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-[var(--color-text-secondary)]">Claim No</dt>
                <dd className="font-mono font-semibold">{data.claimNo}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-text-secondary)]">Dealer</dt>
                <dd className="font-medium">{data.dealerName}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-text-secondary)]">Customer</dt>
                <dd className="font-medium">{data.customerName}</dd>
              </div>
              {data.customerPhone && (
                <div>
                  <dt className="text-xs text-[var(--color-text-secondary)]">Customer Phone</dt>
                  <dd>{data.customerPhone}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-[var(--color-text-secondary)]">Product</dt>
                <dd>{data.product}</dd>
              </div>
              {data.serialNo && (
                <div>
                  <dt className="text-xs text-[var(--color-text-secondary)]">Serial No</dt>
                  <dd className="font-mono text-xs">{data.serialNo}</dd>
                </div>
              )}
              {data.policyNo && (
                <div>
                  <dt className="text-xs text-[var(--color-text-secondary)]">Policy No</dt>
                  <dd className="font-mono text-xs">{data.policyNo}</dd>
                </div>
              )}
              {data.incidentDate && (
                <div>
                  <dt className="text-xs text-[var(--color-text-secondary)]">Incident Date</dt>
                  <dd>{fmtDate(data.incidentDate)}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-[var(--color-text-secondary)]">Claim Amount</dt>
                <dd className="text-base font-bold text-blue-600 dark:text-blue-400">{formatCurrency(data.claimAmount)}</dd>
              </div>
              {data.status === 'PAID' && (
                <div>
                  <dt className="text-xs text-[var(--color-text-secondary)]">Paid On</dt>
                  <dd>{fmtDate(data.paidAt)}</dd>
                </div>
              )}
            </dl>
            {data.description && (
              <div className="mt-4 rounded-lg bg-surface-2 px-3 py-2 text-sm text-[var(--color-text-secondary)]">
                {data.description}
              </div>
            )}
          </CardContent>
        </Card>

        {canReview && (
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold">Review Claim</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Review notes (optional)"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" disabled={review.isPending} onClick={() => review.mutate('APPROVE')}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button size="sm" variant="destructive" disabled={review.isPending} onClick={() => review.mutate('REJECT')}>
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {timelineEvents.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold">Activity Timeline</CardTitle></CardHeader>
            <CardContent><Timeline events={timelineEvents} /></CardContent>
          </Card>
        )}
      </div>
    </DetailPageShell>
  );
}
