import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { Timeline } from '@/components/data-display/Timeline';
import { insuranceService } from '@/services/insurance.service';
import { queryKeys } from '@/services/api/queryKeys';
import { formatCurrency } from '@/utils/format';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DealerInsuranceClaimDetailPage() {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.insuranceClaims.detail(id),
    queryFn: () => insuranceService.getClaim(id),
  });

  if (isLoading) return <div className="p-8 text-center text-sm text-[var(--color-text-tertiary)]">Loading…</div>;
  if (!data) return null;

  const timelineEvents = (data.timeline || []).map((e) => ({ ...e, timestamp: e.at }));

  return (
    <DetailPageShell
      back={{ label: 'Insurance', href: '/dealer/insurance' }}
      title={data.claimNo}
      subtitle={data.customerName}
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
            {data.reviewNotes && (
              <div className="mt-3 rounded-lg border border-surface-3 px-3 py-2 text-sm">
                <span className="font-medium">Admin notes: </span>{data.reviewNotes}
              </div>
            )}
          </CardContent>
        </Card>

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
