import { useQuery } from '@tanstack/react-query';
import { dealerTeamService } from '@/services/dealer-team.service';
import { usePanelDashboard } from '@/hooks/usePanelDashboard';
import { createListTable } from '../shared/createListTable';
import { teamColumns } from './columns.config';
import { PanelDashboard } from '@/components/data-display/PanelDashboard';
import { formatCurrency } from '@/utils/format';
import { Users, Target, TrendingUp, Trophy } from 'lucide-react';

export const TeamTable = createListTable({
  service: dealerTeamService,
  queryKey: (f) => ['dealer', 'team', 'list', f],
  columns: teamColumns,
  basePath: '/dealer/team',
  searchKeys: ['name', 'role', 'email'],
});

export function TeamPerformanceDashboard() {
  const { kpis } = usePanelDashboard('dealer');
  const { data: perf } = useQuery({
    queryKey: ['dealer', 'team', 'performance'],
    queryFn: () => dealerTeamService.getPerformance(),
  });
  const { data: leaderboard = [] } = useQuery({
    queryKey: ['dealer', 'team', 'leaderboard'],
    queryFn: () => dealerTeamService.getLeaderboard(),
  });

  const totalTarget = perf?.totalTarget ?? 0;
  const totalAchieved = perf?.totalAchieved ?? 0;

  return (
    <div className="space-y-6">
      <PanelDashboard
        kpis={[
          { label: 'Team Size', value: String(perf?.members?.length ?? kpis.team ?? 0), icon: Users },
          { label: 'Sales Target', value: formatCurrency(totalTarget), icon: Target },
          { label: 'Achieved', value: formatCurrency(totalAchieved), trend: totalTarget ? Math.round((totalAchieved / totalTarget) * 100) : 0, trendLabel: 'of target', icon: TrendingUp },
          { label: 'Top Performer', value: leaderboard[0]?.name || '—', icon: Trophy },
        ]}
        chartTitle="Monthly Team Revenue"
        chartData={perf?.monthlyTrend || []}
      />
      {leaderboard.length > 0 && (
        <div className="rounded-lg border border-surface-3 bg-surface-1 p-4">
          <h3 className="mb-3 text-sm font-semibold">Leaderboard</h3>
          <ol className="space-y-2">
            {leaderboard.map((m, i) => (
              <li key={m.id} className="flex items-center justify-between text-sm">
                <span>#{i + 1} {m.name}</span>
                <span className="tabular-nums text-[var(--color-text-secondary)]">{formatCurrency(m.revenue)} · {m.achievementPct}%</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
