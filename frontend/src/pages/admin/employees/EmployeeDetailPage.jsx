import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { DetailPageShell } from '@/components/layout/DetailPageShell';
import { EmployeeDetail, EmployeeEditDrawer } from '@/modules/employees';
import { employeesService } from '@/services/employees.service';
import { queryKeys } from '@/services/api/queryKeys';
import { Button } from '@/components/ui/button';

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const [editOpen, setEditOpen] = useState(false);

  const { data } = useQuery({
    queryKey: queryKeys.employees.detail(id),
    queryFn: () => employeesService.getDetail(id),
  });

  return (
    <DetailPageShell
      back={{ label: 'Employees', href: '/admin/employees' }}
      title={data?.name || 'Employee Details'}
      subtitle={data ? `${data.empId} · ${data.department} · ${data.role?.replace(/_/g, ' ')}` : 'Employee profile'}
      actions={data ? (
        <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4" /> Edit Role
        </Button>
      ) : null}
    >
      <EmployeeDetail id={id} />
      <EmployeeEditDrawer employee={data} open={editOpen} onOpenChange={setEditOpen} />
    </DetailPageShell>
  );
}
