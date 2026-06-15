import { motion } from 'framer-motion';
import { KPICard } from './KPICard';
import { ActivityFeed } from './ActivityFeed';
import { QuickActions } from './QuickActions';
import { AlertWidget } from './AlertWidget';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';
import { cardGrid } from '@/animations/motion.config';

const tooltipStyle = {
  background: 'rgba(255, 252, 250, 0.92)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(196, 113, 79, 0.2)',
  borderRadius: 'var(--radius-md)',
  fontSize: 11,
  boxShadow: 'var(--shadow-md)',
};

export function PanelDashboard({
  kpis,
  chartTitle,
  chartData,
  chartDataKey = 'value',
  chartLabelKey = 'name',
  chartType = 'bar',
  activities,
  alerts,
  quickActions,
  secondaryChart,
  kpiVariant = 'glass',
}) {
  return (
    <div className="space-y-3">
      {quickActions?.length > 0 && <QuickActions actions={quickActions} />}

      <motion.div
        className="grid grid-cols-2 gap-2 lg:grid-cols-4"
        variants={cardGrid.container}
        initial="initial"
        animate="animate"
      >
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} variants={cardGrid.item}>
            <KPICard {...kpi} variant={kpiVariant} delay={i * 0.06} />
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <GlassCard className="xl:col-span-2" hover={false} delay={0.15}>
          <GlassCardHeader>
            <GlassCardTitle>{chartTitle}</GlassCardTitle>
            <span className="text-[10px] text-[var(--color-text-tertiary)]">Live from analytics API</span>
          </GlassCardHeader>
          <GlassCardContent className="pt-0">
            {chartData?.length > 0 ? (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'area' ? (
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-3)" vertical={false} opacity={0.6} />
                      <XAxis dataKey={chartLabelKey} tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} width={42} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area
                        type="monotone"
                        dataKey={chartDataKey}
                        stroke="var(--color-brand-500)"
                        fill="url(#chartGradient)"
                        strokeWidth={2}
                        animationDuration={900}
                        animationEasing="ease-out"
                        dot={{ r: 3, fill: 'var(--color-brand-500)', strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: 'var(--color-brand-600)', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  ) : (
                    <BarChart data={chartData} barSize={22}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-3)" vertical={false} />
                      <XAxis dataKey={chartLabelKey} tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} width={42} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey={chartDataKey} fill="var(--color-brand-500)" radius={[4, 4, 0, 0]} animationDuration={700} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="flex h-44 items-center justify-center text-[11px] text-[var(--color-text-tertiary)]">
                No chart data for this period yet.
              </p>
            )}
          </GlassCardContent>
        </GlassCard>

        <div className="space-y-3">
          {alerts?.length > 0 && (
            <GlassCard hover={false} delay={0.2}>
              <GlassCardHeader>
                <GlassCardTitle>Alerts</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="pt-0">
                <AlertWidget alerts={alerts} compact />
              </GlassCardContent>
            </GlassCard>
          )}

          {activities?.length > 0 && (
            <GlassCard hover={false} delay={0.25}>
              <GlassCardHeader>
                <GlassCardTitle>Recent Activity</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="pt-0">
                <ActivityFeed items={activities} compact maxItems={5} />
              </GlassCardContent>
            </GlassCard>
          )}
        </div>
      </div>

      {secondaryChart?.data?.length > 0 && (
        <GlassCard hover={false} delay={0.3}>
          <GlassCardHeader>
            <GlassCardTitle>{secondaryChart.title}</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="pt-0">
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={secondaryChart.data} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-3)" vertical={false} />
                  <XAxis dataKey={secondaryChart.labelKey || 'name'} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey={secondaryChart.dataKey || 'value'} fill="var(--color-accent)" radius={[3, 3, 0, 0]} animationDuration={700} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  );
}
