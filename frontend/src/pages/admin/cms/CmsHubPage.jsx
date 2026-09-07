import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Globe, RefreshCw, ExternalLink, ChevronRight, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { CMS_PAGE_GROUPS } from '@/components/admin/cms/cmsNavigation.config';
import { cmsAdminService } from '@/services/cms.service';
import { toast } from '@/utils/toast';
import { notifyCmsUpdated } from '@/utils/cmsSync';

export default function CmsHubPage() {
  const qc = useQueryClient();

  // Check if website data has been loaded into DB
  const { data: homeSections = [] } = useQuery({
    queryKey: ['cms', 'admin', 'sections', 'home'],
    queryFn: () => cmsAdminService.getSections('home'),
    staleTime: 30_000,
  });

  const isDbEmpty = homeSections.length === 0;

  const syncMutation = useMutation({
    mutationFn: () => cmsAdminService.syncFromSeed(true),
    onSuccess: (data) => {
      toast.success(`✅ ${data?.sectionsTotal ?? ''} sections & ${data?.collectionsTotal ?? ''} collections loaded! Your website is now fully manageable from admin.`);
      qc.invalidateQueries({ queryKey: ['cms'] });
      notifyCmsUpdated();
    },
    onError: () => toast.error('Sync failed — is the backend running on port 3000?'),
  });

  // Landing page URL — works for dev (5173) and prod
  const landingUrl = (() => {
    try {
      const u = new URL(window.location.href);
      // In dev admin runs on 5174 (or same port), landing on 5173
      if (u.hostname === 'localhost') {
        return `http://localhost:5173`;
      }
      return window.location.origin;
    } catch {
      return window.location.origin;
    }
  })();

  return (
    <PageShell
      title="Website CMS"
      subtitle="Admin se apni poori website control karo — bina kisi code ke"
      actions={
        <div className="flex gap-2">
          <Button
            variant={isDbEmpty ? 'default' : 'outline'}
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className={isDbEmpty ? 'animate-pulse' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? 'Loading…' : 'Load All Website Data'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open(landingUrl, '_blank')}>
            <ExternalLink className="h-4 w-4 mr-1.5" /> Preview Landing Page
          </Button>
        </div>
      }
    >
      {/* Step 1 — Setup Banner */}
      {isDbEmpty ? (
        <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/5 p-5 flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-red-700 dark:text-red-400 mb-1">
              ⚡ Pehla Step — Website Data Load Karo
            </h3>
            <p className="text-sm text-red-700/80 dark:text-red-300/80 mb-3">
              Database abhi empty hai. <strong>"Load All Website Data"</strong> button dabao — ek click me sare sections, collections aur content load ho jaenge. Phir koi bhi cheez admin se change kar sakte ho.
            </p>
            <Button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              {syncMutation.isPending ? 'Loading Website Data…' : '🚀 Load All Website Data Now'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <div>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              {homeSections.length} sections loaded
            </span>
            <span className="text-sm text-emerald-700/70 dark:text-emerald-300/70 ml-2">
              — Changes save instantly. Landing page updates within seconds automatically.
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full">
            <Zap className="h-3 w-3" />
            Real-time sync ON
          </div>
        </div>
      )}

      {/* How to use — quick guide */}
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {[
          { step: '1', title: 'Load Website Data', desc: 'Click "Load All Website Data" to import all sections into admin (one-time setup).' },
          { step: '2', title: 'Edit Any Section', desc: 'Go to Home Page / Store / About, click Edit on any section, change text or images.' },
          { step: '3', title: 'Save & Done', desc: 'Click Save — landing page auto-updates within seconds. No refresh needed!' },
        ].map((s) => (
          <div key={s.step} className="flex items-start gap-3 rounded-xl border border-surface-3 bg-surface-1 p-4">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-600 font-bold text-sm">
              {s.step}
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm">{s.title}</p>
              <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Page groups */}
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
            Changes save instantly to the database.{' '}
            <button
              type="button"
              onClick={() => window.open(landingUrl, '_blank')}
              className="text-brand-600 hover:underline font-medium"
            >
              Open landing page
            </button>{' '}
            to see live updates (auto-refreshes via real-time sync).
          </p>
        </section>
      </div>
    </PageShell>
  );
}
