import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { TeamTable } from '@/modules/team';
import { TeamMemberDrawer, useTeamMemberActions } from '@/modules/team/TeamMemberDrawer';

export default function TeamListPage() {
  const actions = useTeamMemberActions();
  return (
    <>
      <PageShell
        title="Sales Team"
        subtitle="Manage members, targets, and performance"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild><Link to="/dealer/team/performance">Performance</Link></Button>
            <Button size="sm" onClick={actions.openCreate}><Plus className="h-4 w-4" /> Add Member</Button>
          </div>
        }
      >
        <TeamTable />
      </PageShell>
      <TeamMemberDrawer open={actions.drawerOpen} onOpenChange={actions.setDrawerOpen} member={actions.editMember} />
    </>
  );
}
