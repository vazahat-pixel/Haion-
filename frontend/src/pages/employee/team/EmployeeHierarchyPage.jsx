import { useQuery } from '@tanstack/react-query';
import { PageShell } from '@/components/layout/PageShell';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ZoneBadge } from '@/components/data-display/ZoneBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { employeesService } from '@/services/employees.service';
import { queryKeys } from '@/services/api/queryKeys';

function HierarchyNode({ node, depth = 0 }) {
  if (!node) return null;
  return (
    <div className={depth > 0 ? 'ml-6 border-l border-surface-3 pl-4' : ''}>
      <div className="mb-2 flex items-center gap-2 rounded-lg border border-surface-3 bg-surface-1 px-3 py-2">
        <span className="font-medium text-sm">{node.name}</span>
        <span className="text-xs text-[var(--color-text-tertiary)]">{node.role}</span>
        {node.zone && <ZoneBadge zone={node.zone} size="sm" />}
      </div>
      {(node.reports || []).map((child) => (
        <HierarchyNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function EmployeeHierarchyPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.employees.hierarchy(),
    queryFn: () => employeesService.getHierarchy(),
  });

  if (isLoading) return <PageShell title="Team Hierarchy"><LoadingState /></PageShell>;
  if (isError) return <PageShell title="Team Hierarchy"><ErrorState onRetry={refetch} /></PageShell>;

  return (
    <PageShell title="Team Hierarchy" subtitle="Manager reporting structure and drill-down">
      <Card>
        <CardHeader><CardTitle className="text-base">Organization Tree</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {(data?.tree || data || []).map((root) => (
            <HierarchyNode key={root.id} node={root} />
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}
