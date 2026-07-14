import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Headphones, FileText, Package, ShoppingBag,
  Wrench, Receipt, Ticket, ArrowUpRight, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatRelative } from '@/utils/format';
import { ROUTES } from '@/constants/routes';
import { useCustomerPortalConfig } from '@/hooks/useCustomerPortalConfig';
import { customerStagger } from '@/animations/customer.motion';
import { CustomerMetricCard } from '@/components/customer/CustomerMetricCard';
import { CustomerFeedCard, CustomerSectionHeader, CustomerEmptyState } from '@/components/customer/CustomerFeedCard';
import { CustomerAnnouncements } from '@/components/layout/CustomerAppShell';

const QUICK_ACTION_DEFAULTS = {
  auth: [
    { label: 'Products', href: '/customer/products', icon: Package },
    { label: 'Warranty', href: '/customer/warranty', icon: Shield },
    { label: 'Service', href: '/customer/service-requests/new', icon: Wrench },
    { label: 'Lookup', href: '/customer/warranty/lookup', icon: FileText },
  ],
  guest: [
    { label: 'Products', href: ROUTES.CUSTOMER_ACCESS_PRODUCTS, icon: Package },
    { label: 'Warranty', href: ROUTES.PUBLIC_WARRANTY_CHECK, icon: Shield },
    { label: 'Support', href: ROUTES.PUBLIC_COMPLAINT, icon: Headphones },
  ],
};

export function CustomerHub({ hub, authenticated = false }) {
  const portal = useCustomerPortalConfig();
  const config = hub.portal || portal;
  const { profile, stats, products, warranties, bills, orders, serviceRequests, complaints } = hub;

  const quickActions = config.quickLinks?.length
    ? config.quickLinks.map((l) => ({ label: l.label, href: l.href, icon: Zap }))
    : QUICK_ACTION_DEFAULTS[authenticated ? 'auth' : 'guest'];

  const activityItems = [
    ...(orders || []).slice(0, 2).map((o) => ({
      key: `order-${o.id}`,
      title: o.orderNo,
      subtitle: `${o.items ?? 0} items · ${formatCurrency(o.total)}`,
      meta: formatRelative(o.placedAt || o.createdAt),
      status: o.status,
      href: authenticated ? `/customer/orders/${o.id}` : undefined,
      icon: ShoppingBag,
    })),
    ...(serviceRequests || []).slice(0, 2).map((s) => ({
      key: `sr-${s.id}`,
      title: s.requestNo || s.product,
      subtitle: s.issue?.slice(0, 48) || s.product,
      meta: formatRelative(s.createdAt),
      status: s.status,
      href: authenticated ? `/customer/service-requests/${s.id}` : undefined,
      icon: Wrench,
    })),
    ...(products || warranties || []).slice(0, 2).map((p) => ({
      key: `p-${p.id || p.serialNo}`,
      title: p.name || p.product,
      subtitle: `S/N ${p.serialNo}`,
      meta: p.warrantyEnd ? `Until ${formatDate(p.warrantyEnd)}` : undefined,
      status: p.warrantyStatus || p.status,
      href: authenticated
        ? `/customer/products/${p.warrantyId || p.id}`
        : `${ROUTES.PUBLIC_WARRANTY_CHECK}?bill=${encodeURIComponent(p.billNo)}`,
      icon: Package,
    })),
  ].slice(0, 5);

  return (
    <motion.div
      variants={customerStagger.container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-12 gap-2 pb-1"
    >
      {/* Compact toolbar */}
      {authenticated && (
        <motion.div variants={customerStagger.item} className="col-span-12 flex justify-end">
          <Button size="sm" variant="outline" className="customer-cta h-8 gap-1 rounded-full px-3 text-xs" asChild>
            <Link to="/customer/service-requests/new">
              New service <ArrowUpRight className="h-3 w-3" />
            </Link>
          </Button>
        </motion.div>
      )}

      {/* Announcements */}
      <motion.div variants={customerStagger.item} className="col-span-12">
        <CustomerAnnouncements />
      </motion.div>

      {/* Metrics */}
      <motion.div variants={customerStagger.item} className="col-span-12 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <CustomerMetricCard label="Warranties" value={stats?.activeWarranties ?? 0} icon={Shield} accent index={0} />
        <CustomerMetricCard label="Open service" value={stats?.openService ?? 0} icon={Wrench} index={1} />
        <CustomerMetricCard label="Active orders" value={stats?.activeOrders ?? 0} icon={ShoppingBag} index={2} />
        <CustomerMetricCard label="Total spent" value={formatCurrency(stats?.totalSpent ?? 0)} icon={Receipt} accent index={3} />
      </motion.div>

      {/* Quick actions — readable chips */}
      <motion.div variants={customerStagger.item} className="col-span-12">
        <CustomerSectionHeader title="Quick actions" />
        <div className="flex flex-wrap gap-1.5">
          {quickActions.map(({ label, href, icon: Icon }) => (
            <Link key={label} to={href} className="customer-quick-chip">
              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              {label}
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Main feed + sidebar */}
      <motion.div variants={customerStagger.item} className="col-span-12 space-y-2 lg:col-span-8">
        <CustomerSectionHeader
          title="Recent activity"
          count={activityItems.length}
          href={authenticated ? '/customer/orders' : undefined}
        />
        {activityItems.length > 0 ? (
          <div className="space-y-2">
            {activityItems.map((item) => (
              <CustomerFeedCard key={item.key} {...item} />
            ))}
          </div>
        ) : (
          <CustomerEmptyState text="No recent activity. Your orders and service updates will appear here." />
        )}

        {(complaints?.length > 0) && (
          <div className="pt-2">
            <CustomerSectionHeader title="Support tickets" count={complaints.length} />
            <div className="space-y-2">
              {complaints.slice(0, 2).map((c) => (
                <CustomerFeedCard
                  key={c.id}
                  title={c.ticketNo}
                  subtitle={c.product}
                  meta={formatRelative(c.createdAt)}
                  status={c.status}
                  icon={Ticket}
                />
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <motion.aside variants={customerStagger.item} className="col-span-12 space-y-2 lg:col-span-4">
        <div>
          <CustomerSectionHeader
            title="Warranties"
            count={warranties?.length}
            href={authenticated ? '/customer/warranty' : undefined}
          />
          {warranties?.length > 0 ? (
            <div className="space-y-2">
              {warranties.slice(0, 3).map((w) => (
                <CustomerFeedCard
                  key={w.id}
                  title={w.product}
                  subtitle={w.serialNo}
                  meta={`Until ${formatDate(w.endDate)}`}
                  status={w.status}
                  href={authenticated ? `/customer/warranty/${w.id}` : `${ROUTES.PUBLIC_WARRANTY_CHECK}?bill=${encodeURIComponent(w.billNo)}`}
                  icon={Shield}
                  accent
                />
              ))}
            </div>
          ) : (
            <CustomerEmptyState text="No warranties yet." />
          )}
        </div>

        <div>
          <CustomerSectionHeader title="Invoices" count={bills?.length} />
          {bills?.length > 0 ? (
            <div className="space-y-2">
              {bills.slice(0, 3).map((b) => (
                <CustomerFeedCard
                  key={b.id}
                  title={b.billNo}
                  subtitle={formatCurrency(b.total)}
                  meta={formatDate(b.createdAt)}
                  status={b.status}
                  href={authenticated ? `/customer/warranty/lookup?bill=${encodeURIComponent(b.billNo)}` : `${ROUTES.PUBLIC_WARRANTY_CHECK}?bill=${encodeURIComponent(b.billNo)}`}
                  icon={Receipt}
                />
              ))}
            </div>
          ) : (
            <CustomerEmptyState text="No invoices on record." />
          )}
        </div>
      </motion.aside>

      {!authenticated && (
        <motion.div variants={customerStagger.item} className="col-span-12">
          <div className="customer-glass-cta flex flex-col gap-2 rounded-2xl p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--customer-text)]">Unlock full access</p>
              <p className="mt-0.5 text-xs text-[var(--customer-text-secondary)]">Track orders, raise service requests, and get live updates.</p>
            </div>
            <Button size="sm" className="rounded-xl" asChild>
              <Link to="/auth/login">Sign in</Link>
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
