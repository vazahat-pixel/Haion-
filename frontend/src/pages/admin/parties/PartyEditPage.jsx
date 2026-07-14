import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageShell } from '@/components/layout/PageShell';
import { PartyForm } from '@/modules/parties/PartyForm';
import { partiesService } from '@/services/parties.service';
import { queryKeys } from '@/services/api/queryKeys';
import { LoadingState } from '@/components/feedback/LoadingState';

export default function PartyEditPage() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.parties.detail(id),
    queryFn: () => partiesService.getDetail(id),
  });

  if (isLoading) return <LoadingState message="Loading party…" />;

  return (
    <PageShell title="Edit Party" subtitle={data?.name || 'Update party details'} back={{ label: 'Parties', href: '/admin/parties' }}>
      <PartyForm party={data} />
    </PageShell>
  );
}
