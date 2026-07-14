import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { cardHover } from '@/animations/customer.motion';
import { cn } from '@/utils/cn';

export function CustomerFeedCard({ title, subtitle, meta, status, href, icon: Icon, accent }) {
  const inner = (
    <motion.div
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      className={cn(
        'customer-feed-card group flex items-center gap-2.5 p-2.5',
        accent && 'customer-feed-card--accent'
      )}
    >
      {Icon && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--customer-primary-soft)] text-[var(--customer-primary)]">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[13px] font-semibold text-[var(--customer-text)]">{title}</p>
          {status && <StatusBadge status={status} size="sm" />}
        </div>
        {subtitle && (
          <p className="mt-0.5 truncate text-[11px] text-[var(--customer-text-secondary)]">{subtitle}</p>
        )}
        {meta && (
          <p className="mt-0.5 text-[10px] text-[var(--customer-text-muted)]">{meta}</p>
        )}
      </div>
      {href && (
        <ChevronRight className="h-4 w-4 shrink-0 text-[var(--customer-text-muted)]" />
      )}
    </motion.div>
  );

  return href ? <Link to={href} className="block">{inner}</Link> : inner;
}

export function CustomerSectionHeader({ title, count, href, linkLabel = 'View all' }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <h3 className="customer-section-label">
        {title}{count != null ? ` · ${count}` : ''}
      </h3>
      {href && (
        <Link
          to={href}
          className="customer-section-link flex items-center gap-0.5 transition-opacity hover:opacity-70"
        >
          {linkLabel} <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

export function CustomerEmptyState({ text }) {
  return (
    <div className="customer-empty-state rounded-2xl px-4 py-8 text-center">
      <p className="text-xs text-[var(--customer-text-muted)]">{text}</p>
    </div>
  );
}
