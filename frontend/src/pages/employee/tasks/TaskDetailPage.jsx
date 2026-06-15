import { PageShell } from '@/components/layout/PageShell';
import { useParams } from 'react-router-dom';
import { TaskDetail } from '@/modules/tasks';

export default function TaskDetailPage() {
  const { id } = useParams();
  return (
    <PageShell title="Task Details" subtitle="Task information">
      <TaskDetail id={id} />
    </PageShell>
  );
}
