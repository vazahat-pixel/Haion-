import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserMinus } from 'lucide-react';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { TeamMemberDrawer, useTeamMemberActions } from '@/modules/team/TeamMemberDrawer';
import { dealerTeamService } from '@/services/dealer-team.service';
import { Button } from '@/components/ui/button';
import { KPICard } from '@/components/data-display/KPICard';
import { DetailView } from '@/components/data-display/DetailView';
import { LoadingState } from '@/components/feedback/LoadingState';
import { formatCurrency } from '@/utils/format';
import { Target, Receipt, TrendingUp } from 'lucide-react';
import { toast } from '@/utils/toast';

export default function TeamMemberDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const actions = useTeamMemberActions();

  const { data, isLoading } = useQuery({
    queryKey: ['dealer', 'team', 'detail', id],
    queryFn: () => dealerTeamService.getDetail(id),
  });

  const { data: perf } = useQuery({
    queryKey: ['dealer', 'team', 'performance'],
    queryFn: () => dealerTeamService.getPerformance(),
  });

  const memberPerf = perf?.members?.find((m) => m.id === id);

  const deactivate = useMutation({
    mutationFn: () => dealerTeamService.deactivate(id),
    onSuccess: () => {
      toast.success('Member deactivated');
      qc.invalidateQueries({ queryKey: ['dealer', 'team'] });
    },
  });

  if (isLoading) return <LoadingState message="Loading member…" />;
  if (!data) return null;

  return (
    <>
      <DetailPageShell
        back={{ label: 'Team', href: '/dealer/team' }}
        title={data.name}
        subtitle={`${data.role} · ${data.status}`}
        actions={
          data.status === 'ACTIVE' ? (
            <>
              <Button size="sm" variant="outline" onClick={() => actions.openEdit(data)}>Edit</Button>
              <Button size="sm" variant="outline" onClick={() => deactivate.mutate()} disabled={deactivate.isPending}>
                <UserMinus className="h-4 w-4" /> Deactivate
              </Button>
            </>
          ) : null
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KPICard label="Target" value={formatCurrency(memberPerf?.target ?? data.target)} icon={Target} />
            <KPICard label="Achieved" value={formatCurrency(memberPerf?.achieved ?? data.achieved)} icon={Receipt} accent />
            <KPICard label="Achievement" value={`${memberPerf?.achievementPct ?? 0}%`} icon={TrendingUp} />
          </div>
          <DetailView
            fields={[
              { key: 'name', label: 'Name' },
              { key: 'role', label: 'Role' },
              { key: 'email', label: 'Email' },
              { key: 'status', label: 'Status', format: 'badge' },
              { key: 'target', label: 'Monthly Target', format: 'currency' },
            ]}
            data={data}
          />
        </div>
      </DetailPageShell>
      <TeamMemberDrawer open={actions.drawerOpen} onOpenChange={actions.setDrawerOpen} member={actions.editMember} />
    </>
  );
}
