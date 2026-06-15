import { useQuery } from '@tanstack/react-query';
import { DealerCard } from '@/components/data-display/DealerCard';
import { ZoneBadge } from '@/components/data-display/ZoneBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { employeePerformanceService } from '@/services/employee-performance.service';
import { queryKeys } from '@/services/api/queryKeys';
import { formatCurrency } from '@/utils/format';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

const ZONE_COLORS = {
  GREEN: 'var(--color-success)',
  YELLOW: 'var(--color-warning)',
  RED: 'var(--color-danger)',
};

export function DealerAnalyticsPanel() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.employeePerformance.analytics(),
    queryFn: () => employeePerformanceService.getAnalytics(),
  });

  if (isLoading) return <LoadingState message="Loading analytics…" />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {data.zoneSummary.map((z) => (
          <Card key={z.zone}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <ZoneBadge zone={z.zone} size="md" />
                <span className="text-2xl font-semibold tabular-nums">{z.count}</span>
              </div>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)] tabular-nums">
                {formatCurrency(z.revenue)} revenue
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Sales by Region</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.regionSales} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-3)" vertical={false} />
                  <XAxis dataKey="region" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="sales" fill="var(--color-brand-500)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Zone Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.zoneSummary} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-3)" vertical={false} />
                  <XAxis dataKey="zone" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {data.zoneSummary.map((entry) => (
                      <Cell key={entry.zone} fill={ZONE_COLORS[entry.zone]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="mb-4 text-base font-semibold">Top Performing Dealers</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.topDealers.map((dealer) => (
            <DealerCard key={dealer.id} dealer={dealer} />
          ))}
        </div>
      </div>
    </div>
  );
}
