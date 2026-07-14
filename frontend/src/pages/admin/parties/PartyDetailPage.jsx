import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Power } from 'lucide-react';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { PartyDetail } from '@/modules/parties';
import { partiesService } from '@/services/parties.service';
import { queryKeys } from '@/services/api/queryKeys';
import { Button } from '@/components/ui/button';
import { toast } from '@/utils/toast';

export default function PartyDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: queryKeys.parties.detail(id),
    queryFn: () => partiesService.getDetail(id),
  });

  const toggleStatus = useMutation({
    mutationFn: () => partiesService.updateStatus(id, data?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'),
    onSuccess: () => {
      toast.success(data?.status === 'ACTIVE' ? 'Party deactivated' : 'Party activated');
      qc.invalidateQueries({ queryKey: queryKeys.parties.all });
    },
    onError: () => toast.error('Failed to update status'),
  });

  const isActive = data?.status === 'ACTIVE';

  return (
    <DetailPageShell
      back={{ label: 'Parties', href: '/admin/parties' }}
      title={data?.name || 'Party Details'}
      subtitle={data?.code ? `${data.code} · ${data.type}` : 'Party information'}
      actions={data ? (
        <>
          <Button size="sm" variant="outline" asChild>
            <Link to={`/admin/parties/${id}/edit`}>
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          </Button>
          <Button
            size="sm"
            variant={isActive ? 'outline' : 'default'}
            onClick={() => toggleStatus.mutate()}
            disabled={toggleStatus.isPending}
          >
            <Power className="h-4 w-4" /> {isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </>
      ) : null}
    >
      <PartyDetail id={id} />
    </DetailPageShell>
  );
}
