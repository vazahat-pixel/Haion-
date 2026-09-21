import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  MapPin,
  Store,
  Wrench,
  Users,
  Shield,
  Layers,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { employeesService } from '@/services/employees.service';
import {
  VERTICALS,
  VERTICAL_LABELS,
  HIERARCHY_LEVEL_LABELS,
  ROLE_LABELS,
} from '@/constants/roles';

const LEVEL_COLORS = {
  CEO: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  NSM: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  STATE_HEAD: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  ASM: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  STORE_MANAGER: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
};

function HierarchyNode({ node, depth = 0 }) {
  const [collapsed, setCollapsed] = useState(false);
  if (!node) return null;

  const children = node.children || node.reports || node.team || [];
  const hasChildren = children.length > 0;
  const levelKey = node.hierarchyLevel || node.role;
  const levelBadgeStyle = LEVEL_COLORS[levelKey] || 'bg-surface-2 text-[var(--color-text-secondary)] border-surface-3';

  return (
    <div className={depth > 0 ? 'ml-5 sm:ml-8 border-l-2 border-surface-3/70 pl-3 sm:pl-4 mt-2.5' : 'mt-3'}>
      <div className="group flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-surface-3 bg-surface-1 p-3 shadow-xs hover:border-amber-500/40 transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-surface-3 bg-surface-2 text-surface-400 hover:text-white"
            >
              {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          ) : (
            <div className="h-6 w-6 flex items-center justify-center text-surface-500 text-xs">•</div>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-sm text-[var(--color-text-primary)] truncate">
                {node.name}
              </span>
              {node.empId && (
                <span className="text-[11px] font-mono text-[var(--color-text-tertiary)]">
                  ({node.empId})
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
              {node.designation && (
                <span className="text-surface-300 font-medium">{node.designation}</span>
              )}
              {node.department && (
                <span className="text-surface-500">• {node.department}</span>
              )}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {levelKey && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${levelBadgeStyle}`}>
              <Shield className="h-3 w-3" />
              {HIERARCHY_LEVEL_LABELS[levelKey] || ROLE_LABELS[levelKey] || levelKey}
            </span>
          )}

          {node.vertical && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-surface-3 bg-surface-2/60 text-[11px] text-surface-300">
              <Layers className="h-3 w-3 text-amber-400" />
              {VERTICAL_LABELS[node.vertical] || node.vertical}
              {node.subVertical ? ` (${node.subVertical})` : ''}
            </span>
          )}

          {(node.territory?.state || node.territory?.district) && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-surface-3 bg-surface-2/60 text-[11px] text-surface-300">
              <MapPin className="h-3 w-3 text-blue-400" />
              {[node.territory.district, node.territory.state].filter(Boolean).join(', ')}
            </span>
          )}

          {node.dealer && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-300">
              <Store className="h-3 w-3" />
              {node.dealer.name || 'Store'}
            </span>
          )}

          {node.serviceCenter && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-purple-500/30 bg-purple-500/10 text-[11px] text-purple-300">
              <Wrench className="h-3 w-3" />
              {node.serviceCenter.name || 'Service Center'}
            </span>
          )}

          {hasChildren && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-surface-2 text-[10.5px] font-mono text-[var(--color-text-secondary)]">
              <Users className="h-3 w-3" />
              {children.length}
            </span>
          )}
        </div>
      </div>

      {!collapsed && hasChildren && (
        <div className="space-y-1">
          {children.map((child) => (
            <HierarchyNode key={child.id || child.empId} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function EmployeeHierarchyPage() {
  const [selectedVertical, setSelectedVertical] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['employees', 'hierarchy', selectedVertical],
    queryFn: () => employeesService.getHierarchy(selectedVertical ? { vertical: selectedVertical } : {}),
  });

  if (isLoading) return <PageShell title="Organization Hierarchy"><LoadingState /></PageShell>;
  if (isError) return <PageShell title="Organization Hierarchy"><ErrorState onRetry={refetch} /></PageShell>;

  const nodes = data?.tree || data?.data || data || [];

  return (
    <PageShell
      title="Organization Hierarchy"
      subtitle="Complete organizational tree across CEO verticals, national managers, state heads, ASMs, and store managers"
    >
      <div className="space-y-4">
        {/* Vertical Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-surface-3 pb-3">
          <Button
            size="sm"
            variant={selectedVertical === '' ? 'default' : 'outline'}
            onClick={() => setSelectedVertical('')}
            className={selectedVertical === '' ? 'bg-amber-500 text-zinc-950 font-semibold' : ''}
          >
            All Verticals
          </Button>
          {Object.keys(VERTICALS).map((vKey) => (
            <Button
              key={vKey}
              size="sm"
              variant={selectedVertical === vKey ? 'default' : 'outline'}
              onClick={() => setSelectedVertical(vKey)}
              className={selectedVertical === vKey ? 'bg-amber-500 text-zinc-950 font-semibold' : ''}
            >
              {VERTICAL_LABELS[vKey]}
            </Button>
          ))}
        </div>

        {/* Tree Container */}
        <Card className="border-surface-3 bg-surface-1/70 backdrop-blur-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-400" />
              Haion Corporate Organizational Tree
              <span className="text-xs font-normal text-surface-400 font-mono">
                ({nodes.length} top-level nodes)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            {nodes.length === 0 ? (
              <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">
                No staff found for the selected vertical.
              </div>
            ) : (
              nodes.map((root) => (
                <HierarchyNode key={root.id || root.empId} node={root} depth={0} />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
