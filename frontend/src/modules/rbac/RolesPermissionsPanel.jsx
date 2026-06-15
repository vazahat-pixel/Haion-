import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Save } from 'lucide-react';
import { rbacService } from '@/services/rbac.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { LoadingState } from '@/components/feedback/LoadingState';
import { toast } from '@/utils/toast';

export function RolesPermissionsPanel() {
  const qc = useQueryClient();
  const [selectedCode, setSelectedCode] = useState('');
  const [draft, setDraft] = useState([]);

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['rbac', 'roles'],
    queryFn: rbacService.getRoles,
  });

  const { data: catalog, isLoading: catalogLoading } = useQuery({
    queryKey: ['rbac', 'permissions'],
    queryFn: rbacService.getPermissions,
  });

  const role = roles?.find((r) => r.code === selectedCode);
  const grouped = (catalog || []).reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  const selectRole = (code) => {
    setSelectedCode(code);
    const r = roles?.find((x) => x.code === code);
    setDraft(r?.permissions || []);
  };

  const toggle = (key) => {
    setDraft((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const save = useMutation({
    mutationFn: () => rbacService.updateRolePermissions(selectedCode, draft),
    onSuccess: () => {
      toast.success('Permissions saved — users must re-login to refresh');
      qc.invalidateQueries({ queryKey: ['rbac'] });
    },
    onError: () => toast.error('Failed to save permissions'),
  });

  if (rolesLoading || catalogLoading) return <LoadingState message="Loading roles…" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" /> Role & Permission Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm">
            <label className="mb-1 block text-sm font-medium">Select Role</label>
            <Select value={selectedCode} onChange={(e) => selectRole(e.target.value)}>
              <option value="">Choose role…</option>
              {(roles || []).map((r) => (
                <option key={r.code} value={r.code}>{r.name} ({r.permissionCount} permissions)</option>
              ))}
            </Select>
          </div>
          {role && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Editing <strong>{role.name}</strong> — {draft.length} permissions selected
              </p>
              <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
                <Save className="h-3.5 w-3.5" /> {save.isPending ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedCode && (
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(grouped).map(([module, perms]) => (
            <Card key={module}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{module}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {perms.map((p) => (
                  <label key={p.key} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.includes(p.key)}
                      onChange={() => toggle(p.key)}
                      className="rounded"
                    />
                    <span>{p.label}</span>
                    <span className="ml-auto text-[10px] text-[var(--color-text-tertiary)]">{p.key}</span>
                  </label>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
