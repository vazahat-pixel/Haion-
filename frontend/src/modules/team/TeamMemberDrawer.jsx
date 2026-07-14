import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { DrawerForm } from '@/components/data-entry/DrawerForm';
import { dealerTeamService } from '@/services/dealer-team.service';
import { toast } from '@/utils/toast';

const schema = z.object({
  name: z.string().min(2),
  role: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  target: z.coerce.number().min(0),
});

export function TeamMemberDrawer({ open, onOpenChange, member }) {
  const qc = useQueryClient();
  const isEdit = Boolean(member?.id);

  const save = useMutation({
    mutationFn: (data) => (isEdit ? dealerTeamService.update(member.id, data) : dealerTeamService.create(data)),
    onSuccess: () => {
      toast.success(isEdit ? 'Member updated' : 'Member added');
      qc.invalidateQueries({ queryKey: ['dealer', 'team'] });
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to save member'),
  });

  return (
    <DrawerForm
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Team Member' : 'Add Team Member'}
      description="Set role and monthly sales target"
      schema={schema}
      defaultValues={{
        name: member?.name || '',
        role: member?.role || 'Sales Executive',
        email: member?.email || '',
        target: member?.target || 500000,
      }}
      fields={[
        { name: 'name', label: 'Full Name' },
        { name: 'role', label: 'Role' },
        { name: 'email', label: 'Email' },
        { name: 'target', label: 'Monthly Target (₹)', type: 'number' },
      ]}
      onSubmit={(data) => save.mutateAsync(data)}
      submitLabel={isEdit ? 'Save Changes' : 'Add Member'}
    />
  );
}

export function useTeamMemberActions() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  return {
    drawerOpen,
    setDrawerOpen,
    editMember,
    openCreate: () => { setEditMember(null); setDrawerOpen(true); },
    openEdit: (m) => { setEditMember(m); setDrawerOpen(true); },
  };
}
