import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { ROUTES } from '@/constants/routes';
import { CMS_COLLECTION_GROUPS } from '@/components/admin/cms/cmsNavigation.config';

export default function CmsCollectionsHubPage() {
  return (
    <PageShell
      title="Content Collections"
      subtitle="Manage repeatable items — products, FAQs, hero slides, testimonials & more"
      back={{ label: 'CMS', href: '/admin/cms' }}
    >
      <div className="space-y-10">
        {CMS_COLLECTION_GROUPS.map((group) => (
          <section key={group.title}>
            <div className="mb-4">
              <h2 className="text-base font-bold text-text-primary">{group.title}</h2>
              <p className="text-sm text-text-secondary">{group.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.collections.map((c) => {
                const Icon = c.icon;
                return (
                  <Link
                    key={c.key}
                    to={ROUTES.ADMIN_CMS_COLLECTION.replace(':collection', c.key)}
                    className="group flex items-start gap-3 rounded-xl border border-surface-3 bg-surface-0 p-4 transition hover:border-brand-500/50 hover:shadow-sm"
                  >
                    <div className="rounded-lg bg-surface-2 p-2 text-brand-600 shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-medium text-sm text-text-primary group-hover:text-brand-600">
                          {c.label}
                        </h3>
                        <ChevronRight className="h-3.5 w-3.5 text-text-tertiary group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </div>
                      <p className="text-xs text-text-secondary mt-1 leading-snug">{c.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
