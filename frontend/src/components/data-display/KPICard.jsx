import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';
import { TrendingUp, TrendingDown } from 'lucide-react';

const ACCENT_STYLES = {
  brand: 'bg-brand-500/10 text-brand-600 ring-brand-500/20',
  blue: 'bg-sky-500/10 text-sky-600 ring-sky-500/20',
  green: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
  purple: 'bg-violet-500/10 text-violet-600 ring-violet-500/20',
  orange: 'bg-orange-500/10 text-orange-600 ring-orange-500/20',
};

function KpiBody({ label, value, trend, trendLabel, Icon, SvgIcon, accent, iconStyle }) {
  const isPositive = trend >= 0;

  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
          {label}
        </span>
        <motion.p
          className="erp-kpi-value mt-0.5"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {value}
        </motion.p>
        {trend !== undefined && (
          <div className={cn('mt-1 flex items-center gap-0.5 text-[10px]', isPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]')}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span className="tabular-nums font-semibold">{Math.abs(trend)}%</span>
            {trendLabel && <span className="text-[var(--color-text-tertiary)] font-normal">{trendLabel}</span>}
          </div>
        )}
      </div>
      {(SvgIcon || Icon) && (
        <motion.span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-md ring-1',
            iconStyle
          )}
          whileHover={{ scale: 1.08, rotate: 2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
        >
          {SvgIcon ? <SvgIcon className="h-5 w-5" /> : Icon && <Icon className="h-4 w-4" />}
        </motion.span>
      )}
    </div>
  );
}

export function KPICard({
  label,
  value,
  trend,
  trendLabel,
  icon: Icon,
  svgIcon: SvgIcon,
  isLoading,
  onClick,
  accent = 'brand',
  variant = 'default',
  delay = 0,
}) {
  const iconStyle = ACCENT_STYLES[accent] || ACCENT_STYLES.brand;

  if (isLoading) {
    return (
      <Card variant="base" className="overflow-hidden">
        <CardContent className="p-3 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-24" />
        </CardContent>
      </Card>
    );
  }

  const body = (
    <KpiBody
      label={label}
      value={value}
      trend={trend}
      trendLabel={trendLabel}
      Icon={Icon}
      SvgIcon={SvgIcon}
      accent={accent}
      iconStyle={iconStyle}
    />
  );

  if (variant === 'glass') {
    return (
      <GlassCard
        hover={!!onClick}
        delay={delay}
        className={cn(onClick && 'cursor-pointer')}
        onClick={onClick}
      >
        <GlassCardContent className="py-3">{body}</GlassCardContent>
      </GlassCard>
    );
  }

  return (
    <Card
      variant="base"
      className={cn('overflow-hidden interactive-smooth group', onClick && 'cursor-pointer hover:shadow-md')}
      onClick={onClick}
    >
      <CardContent className="p-3">{body}</CardContent>
    </Card>
  );
}
