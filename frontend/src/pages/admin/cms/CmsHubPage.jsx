import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Globe, RefreshCw, ExternalLink, ChevronRight } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { CMS_PAGE_GROUPS } from '@/components/admin/cms/cmsNavigation.config';
import { cmsAdminService } from '@/services/cms.service';
import { toast } from '@/utils/toast';
import { notifyCmsUpdated } from '@/utils/cmsSync';

export default function CmsHubPage() {
  const qc = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: () => cmsAdminService.syncFromSeed(true),
    onSuccess: (data) => {
      toast.success(`Synced ${data?.sectionsTotal ?? ''} sections & ${data?.collectionsTotal ?? ''} collections`);
      qc.invalidateQueries({ queryKey: ['cms'] });
      notifyCmsUpdated();
    },
    onError: () => toast.error('Sync failed — is the backend running?'),
  });

  return (
    <PageShell
      title="Website CMS"
      subtitle="Manage every piece of content on your website — no code required"
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? 'Syncing…' : 'Load All Website Data'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open('/landing', '_blank')}>
            <ExternalLink className="h-4 w-4 mr-1.5" /> Preview Site
          </Button>
        </div>
      }
    >
      <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
        <strong>First time?</strong> Click <em>Load All Website Data</em> to import every section and collection from your website into the CMS. Then edit any section below.
      </div>

      <div className="space-y-10">
        {CMS_PAGE_GROUPS.map((group) => (
          <section key={group.id}>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-text-primary">{group.title}</h2>
              <p className="text-sm text-text-secondary mt-0.5">{group.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="group flex items-start gap-4 rounded-xl border border-surface-3 bg-surface-0 p-5 transition hover:border-brand-500/50 hover:shadow-md hover:shadow-brand-500/5"
                  >
                    <div className={`rounded-xl p-2.5 shrink-0 ${item.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-text-primary group-hover:text-brand-600 transition-colors">
                          {item.label}
                        </h3>
                        <ChevronRight className="h-4 w-4 text-text-tertiary group-hover:text-brand-500 shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <p className="mt-1 text-sm text-text-secondary leading-snug">{item.description}</p>
                      {item.sectionCount && (
                        <span className="inline-block mt-2 text-xs font-medium text-brand-600 bg-brand-500/10 px-2 py-0.5 rounded-full">
                          {item.sectionCount} sections
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        <section className="rounded-xl border border-dashed border-surface-3 p-6 text-center">
          <Globe className="h-8 w-8 mx-auto text-text-tertiary mb-2" />
          <p className="text-sm text-text-secondary">
            Changes save instantly to the database. Open the landing page to see updates live.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
