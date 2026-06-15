import { Link } from 'react-router-dom';
import { Phone, ArrowLeft, Receipt, AlertTriangle } from 'lucide-react';
import { useEntityDetail } from '@/hooks/useEntityDetail';
import { assignedDealersService } from '@/services/assigned-dealers.service';
import { queryKeys } from '@/services/api/queryKeys';
import { ZoneBadge } from '@/components/data-display/ZoneBadge';
import { KPICard } from '@/components/data-display/KPICard';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatRelative } from '@/utils/format';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function DealerDrilldown({ id }) {
  const { data, isLoading, isError, refetch } = useEntityDetail(
    queryKeys.assignedDealers.detail,
    assignedDealersService.getDetail,
    id
  );

  if (isLoading) return <LoadingState message="Loading dealer…" />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  const chartData = (data.monthlySales || []).map((d) => ({ name: d.month, value: d.sales }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/employee/dealers"><ArrowLeft className="h-4 w-4" /> Back</Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold truncate">{data.name}</h2>
            <ZoneBadge zone={data.zone} size="md" />
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">{data.city}, {data.state}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard label="Achievement" value={`${data.achievementPct}%`} trend={data.trend} trendLabel="vs last month" accent />
        <KPICard label="Monthly Sales" value={formatCurrency(data.achieved)} />
        <KPICard label="Bills" value={String(data.bills)} icon={Receipt} />
        <KPICard label="Outstanding" value={formatCurrency(data.outstanding)} icon={AlertTriangle} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {chartData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Sales Trend</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-3)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Area type="monotone" dataKey="value" stroke="var(--color-brand-500)" fill="url(#salesGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">Primary Contact</p>
              <p className="font-medium">{data.contact}</p>
            </div>
            <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
              <Phone className="h-4 w-4" /> {data.phone}
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">Last Visit</p>
              <p>{formatRelative(data.lastVisit)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">Monthly Target</p>
              <p className="font-medium tabular-nums">{formatCurrency(data.target)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
