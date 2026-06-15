import { PageShell } from './PageShell';
import { Breadcrumbs } from './Breadcrumbs';

/**
 * Standard detail-page layout with breadcrumb trail and optional header actions.
 * @param {{ label: string, href: string }} back - Parent list link
 */
export function DetailPageShell({ back, title, subtitle, actions, children }) {
  const crumbs = back
    ? [{ label: back.label, href: back.href }, { label: title }]
    : [{ label: title }];

  return (
    <PageShell
      breadcrumbs={<Breadcrumbs items={crumbs} />}
      title={title}
      subtitle={subtitle}
      actions={actions}
    >
      {children}
    </PageShell>
  );
}
