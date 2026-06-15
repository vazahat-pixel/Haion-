import { PageShell } from '@/components/layout/PageShell';
import { TaskTable } from '@/modules/tasks';

export default function TaskListPage() {
  return (
    <PageShell title="Tasks" subtitle="Assigned work items">
      <TaskTable />
    </PageShell>
  );
}
