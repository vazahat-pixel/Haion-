import { useQuery } from '@tanstack/react-query';
import { Target, CheckSquare, MapPin, Users, ClipboardList, Award } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants/roles';
import { KPICard } from '@/components/data-display/KPICard';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { employeePerformanceService } from '@/services/employee-performance.service';
import { queryKeys } from '@/services/api/queryKeys';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function PerformancePanel() {
  const { user } = useAuth();
  const isManager = user?.role === ROLES.MANAGER;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.employeePerformance.get(user?.role),
    queryFn: () => employeePerformanceService.get(user?.role),
  });

  if (isLoading) return <LoadingState message="Loading performance…" />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  const chartData = (data.weeklyScores || []).map((d) => ({ name: d.day, value: d.score }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-lg border border-surface-3 bg-surface-1 p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50">
          <Award className="h-7 w-7 text-brand-600" />
        </div>
        <div>
          <p className="text-sm text-[var(--color-text-secondary)]">Performance Score</p>
          <p className="text-3xl font-bold tabular-nums text-brand-700">{data.score}<span className="text-lg text-[var(--color-text-tertiary)]">/100</span></p>
          {data.rank && <p className="text-xs text-[var(--color-text-tertiary)]">Rank #{data.rank} in team of {data.teamSize}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isManager ? (
          <>
            <KPICard label="Team Achievement" value={`${data.teamAchievement}%`} icon={Target} accent />
            <KPICard label="Green Zone Dealers" value={String(data.greenZone)} icon={Users} />
            <KPICard label="Red Zone Dealers" value={String(data.redZone)} icon={Target} />
            <KPICard label="Pending Approvals" value={String(data.pendingApprovals)} icon={ClipboardList} />
          </>
        ) : (
          <>
            <KPICard label="Tasks Completed" value={String(data.tasksCompleted)} icon={CheckSquare} accent />
            <KPICard label="Pending Tasks" value={String(data.tasksPending)} icon={CheckSquare} />
            <KPICard label="Dealer Visits" value={String(data.visitsThisMonth)} icon={MapPin} />
            <KPICard label="Avg Achievement" value={`${data.avgAchievement}%`} icon={Target} />
          </>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Weekly Performance Trend</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-3)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="var(--color-brand-500)" strokeWidth={2} dot={{ fill: 'var(--color-brand-500)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
