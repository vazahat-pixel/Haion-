import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Edit2, Eye, EyeOff, Layers } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cmsAdminService } from '@/services/cms.service';
import { toast } from '@/utils/toast';
import { notifyCmsUpdated } from '@/utils/cmsSync';
import { CmsSectionEditorDrawer } from '@/components/admin/cms/CmsSectionEditorDrawer';
import { SECTION_META, getSectionPreview } from '@/components/admin/cms/cmsNavigation.config';
import { ROUTES } from '@/constants/routes';

const PAGE_BREADCRUMBS = {
  home: { label: 'CMS', href: '/admin/cms' },
  store: { label: 'CMS', href: '/admin/cms' },
  about: { label: 'CMS', href: '/admin/cms' },
  appliances: { label: 'CMS', href: '/admin/cms' },
  inverter: { label: 'CMS', href: '/admin/cms' },
};

export default function CmsPageManagerPage({ page = 'home', title = 'Home Page' }) {
  const qc = useQueryClient();
  const [editingSection, setEditingSection] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['cms', 'admin', 'sections', page],
    queryFn: () => cmsAdminService.getSections(page),
  });

  const toggleMutation = useMutation({
    mutationFn: (sectionKey) => cmsAdminService.toggleSection(page, sectionKey),
    onSuccess: () => {
      toast.success('Visibility updated');
      qc.invalidateQueries({ queryKey: ['cms'] });
      notifyCmsUpdated();
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (items) => cmsAdminService.reorderSections(items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms'] });
      notifyCmsUpdated();
    },
  });

  const saveSectionMutation = useMutation({
    mutationFn: ({ sectionKey, content }) =>
      cmsAdminService.upsertSection(page, sectionKey, { content }),
    onSuccess: () => {
      toast.success('Section saved');
      qc.invalidateQueries({ queryKey: ['cms'] });
      notifyCmsUpdated();
      setEditorOpen(false);
      setEditingSection(null);
    },
  });

  const move = (index, direction) => {
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const target = index + direction;
    if (target < 0 || target >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[target];
    reorderMutation.mutate([
      { page, sectionKey: a.sectionKey, order: b.order },
      { page, sectionKey: b.sectionKey, order: a.order },
    ]);
  };

  const sorted = [...sections].sort((a, b) => a.order - b.order);

  return (
    <PageShell
      title={`${title} — Sections`}
      subtitle={`${sorted.length} editable sections · Toggle visibility, reorder, and edit content`}
      back={PAGE_BREADCRUMBS[page]}
    >
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-surface-2 animate-pulse" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-3 p-12 text-center">
          <p className="text-text-secondary mb-4">No sections found for this page.</p>
          <Link to="/admin/cms" className="inline-flex items-center justify-center rounded-md border border-surface-3 px-4 py-2 text-sm hover:bg-surface-2">
            Go to CMS Hub → Load All Website Data
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((section, idx) => {
            const meta = SECTION_META[section.sectionKey] ?? {};
            const Icon = meta.icon;
            const preview = getSectionPreview(section.content);
            const isVisible = section.isVisible !== false;

            return (
              <div
                key={section.sectionKey}
                className={`rounded-xl border transition-all ${
                  isVisible
                    ? 'border-surface-3 bg-surface-0'
                    : 'border-surface-3/50 bg-surface-1 opacity-60'
                }`}
              >
                <div className="flex flex-wrap items-start gap-4 p-4">
                  <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
                      {Icon ? <Icon className="h-5 w-5" /> : <span className="text-sm font-bold">{idx + 1}</span>}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-text-primary">
                          {section.sectionLabel || section.sectionKey}
                        </p>
                        {!isVisible && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <EyeOff className="h-3 w-3" /> Hidden
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary mt-0.5 line-clamp-1">{preview}</p>
                      {meta.hint && (
                        <p className="text-xs text-text-tertiary mt-1">{meta.hint}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    {meta.collection && (
                      <Button variant="ghost" size="sm" asChild className="text-xs hidden sm:flex">
                        <Link to={ROUTES.ADMIN_CMS_COLLECTION.replace(':collection', meta.collection)}>
                          <Layers className="h-3.5 w-3.5 mr-1" /> Items
                        </Link>
                      </Button>
                    )}
                    <div className="flex items-center gap-1 border-r border-surface-3 pr-2 mr-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(idx, -1)} disabled={idx === 0}>
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(idx, 1)} disabled={idx === sorted.length - 1}>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isVisible}
                        onCheckedChange={() => toggleMutation.mutate(section.sectionKey)}
                      />
                      <Eye className="h-3.5 w-3.5 text-text-tertiary" />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingSection(section);
                        setEditorOpen(true);
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CmsSectionEditorDrawer
        open={editorOpen}
        onOpenChange={setEditorOpen}
        section={editingSection}
        saving={saveSectionMutation.isPending}
        onSave={(content) =>
          saveSectionMutation.mutate({ sectionKey: editingSection.sectionKey, content })
        }
      />
    </PageShell>
  );
}
