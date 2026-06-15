import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ModuleTable } from '@/components/data-display/ModuleTable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { auditService } from '@/services/audit.service';
import { queryKeys } from '@/services/api/queryKeys';
import { auditColumns } from './columns.config';

export function AuditLogPanel() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const filters = {
    perPage: 50,
    ...(from ? { from: new Date(from).toISOString() } : {}),
    ...(to ? { to: new Date(`${to}T23:59:59`).toISOString() } : {}),
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.audit.list(filters),
    queryFn: () => auditService.getList(filters),
  });

  const rows = data?.data ?? [];
  const expanded = rows.find((r) => r.id === expandedId);

  const columns = [
    ...auditColumns,
    {
      key: 'expand',
      label: '',
      width: 80,
      sortable: false,
      render: (_, row) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
        >
          {expandedId === row.id ? 'Hide' : 'Payload'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 rounded-lg border border-surface-3 bg-surface-1 p-4">
        <div>
          <Label htmlFor="audit-from">From</Label>
          <Input id="audit-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        </div>
        <div>
          <Label htmlFor="audit-to">To</Label>
          <Input id="audit-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        </div>
      </div>

      <ModuleTable
        columns={columns}
        data={{ data: rows }}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        searchKeys={['action', 'user', 'module', 'ip']}
        filterKey="module"
        filterOptions={[
          { value: 'Auth', label: 'Auth' },
          { value: 'GRN', label: 'GRN' },
          { value: 'Billing', label: 'Billing' },
          { value: 'Products', label: 'Products' },
        ]}
        emptyTitle="No audit logs"
        emptyDescription="System activity will be recorded here."
        searchPlaceholder="Search audit logs…"
      />

      {expanded?.metadata && (
        <div className="rounded-lg border border-surface-3 p-4">
          <p className="mb-2 text-sm font-medium">
            {expanded.action} · {expanded.user} · {expanded.module}
          </p>
          <pre className="overflow-x-auto rounded bg-surface-2 p-3 text-xs">
            {JSON.stringify(expanded.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
