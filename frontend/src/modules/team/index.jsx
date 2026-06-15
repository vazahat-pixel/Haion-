import { useQuery } from '@tanstack/react-query';
import { dealerTeamService } from '@/services/dealer-team.service';
import { usePanelDashboard } from '@/hooks/usePanelDashboard';
import { createListTable } from '../shared/createListTable';
import { teamColumns } from './columns.config';
import { PanelDashboard } from '@/components/data-display/PanelDashboard';
import { formatCurrency } from '@/utils/format';
import { Users, Target, TrendingUp } from 'lucide-react';

export const TeamTable = createListTable({
  service: dealerTeamService,
  queryKey: (f) => ['dealer', 'team', 'list', f],
  columns: teamColumns,
});

export function TeamPerformanceDashboard() {
  const { kpis } = usePanelDashboard('dealer');
  const { data: teamRes } = useQuery({
    queryKey: ['dealer', 'team', 'performance'],
    queryFn: () => dealerTeamService.getList({ perPage: 100 }),
  });
  const team = teamRes?.data ?? [];
  const totalTarget = team.reduce((s, m) => s + (m.target || 0), 0);
  const totalAchieved = team.reduce((s, m) => s + (m.achieved || 0), 0);

  return (
    <PanelDashboard
      kpis={[
        { label: 'Team Size', value: String(team.length || kpis.team || 0), icon: Users },
        { label: 'Sales Target', value: formatCurrency(totalTarget || 950000), icon: Target },
        { label: 'Achieved', value: formatCurrency(totalAchieved || kpis.sales || 0), trend: totalTarget ? Math.round((totalAchieved / totalTarget) * 100) : 95, trendLabel: 'of target', icon: TrendingUp },
        { label: 'Outstanding', value: formatCurrency(kpis.outstanding || 0), icon: Users },
      ]}
      chartTitle="Monthly Performance"
      chartData={[
        { name: 'Jan', value: Math.round((totalAchieved || 720000) * 0.8) },
        { name: 'Feb', value: Math.round((totalAchieved || 810000) * 0.9) },
        { name: 'Mar', value: totalAchieved || 903000 },
      ]}
    />
  );
}
