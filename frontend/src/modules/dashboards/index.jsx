import { useState } from 'react';
import { PanelDashboard } from '@/components/data-display/PanelDashboard';
import { DateRangeFilter } from '@/components/data-display/DateRangeFilter';
import { LowStockWidget, PendingGRNWidget } from '@/components/data-display/DashboardWidgets';
import { TopProductsWidget } from '@/components/data-display/TopProductsWidget';
import { DealerCardGrid } from '@/components/data-display/DealerCardGrid';
import { usePanelDashboard } from '@/hooks/usePanelDashboard';
import { LoadingState } from '@/components/feedback/LoadingState';
import { formatCurrency } from '@/utils/format';
import {
  Package, Users, Headphones, Receipt, FileText, CheckSquare, ClipboardList,
  Wrench, ShoppingCart, Shield, Truck, AlertTriangle, Target, Clock,
} from 'lucide-react';
import { KPI_SVG_ICONS } from '@/components/illustrations/dashboard';

export function AdminDashboard() {
  const [dateRange, setDateRange] = useState(null);
  const filters = dateRange ? { from: dateRange.from, to: dateRange.to } : {};
  const { kpis: k, activities, alerts, charts, isLoading } = usePanelDashboard('admin', filters);

  if (isLoading) return <LoadingState message="Loading dashboard…" />;

  return (
    <div className="space-y-3">
      <div className="flex justify-end -mt-1">
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>
      <PanelDashboard
        kpiVariant="glass"
        quickActions={[
          { label: 'Website Orders', href: '/admin/store-orders', icon: ShoppingCart },
          { label: 'GRN Monitoring', href: '/admin/grn', icon: Package },
          { label: 'Dispatch', href: '/admin/dispatch', icon: Truck },
          { label: 'Onboard Dealer', href: '/admin/dealers/onboarding', icon: Users },
        ]}
        kpis={[
          { label: 'Store Sales (Month)', value: formatCurrency(k.storeRevenue || 0), svgIcon: KPI_SVG_ICONS.revenue, accent: 'brand' },
          { label: 'Website Orders', value: String(k.storeOrders ?? 0), svgIcon: KPI_SVG_ICONS.dealers, accent: 'orange' },
          { label: 'Orders Today', value: String(k.storeTodayOrders ?? 0), svgIcon: KPI_SVG_ICONS.grn, accent: 'green' },
          { label: 'Pending COD', value: String(k.storePendingCod ?? 0), svgIcon: KPI_SVG_ICONS.tickets, accent: 'purple' },
        ]}
        chartTitle="Website Sales (₹) — Last 30 Days"
        chartData={charts.store?.length ? charts.store : charts.primary}
        chartType="area"
        activities={activities}
        alerts={alerts}
        secondaryChart={charts.secondary?.length ? { title: 'Expense Breakdown (₹)', data: charts.secondary } : undefined}
      />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <LowStockWidget />
        <TopProductsWidget adminView />
      </div>
    </div>
  );
}

export function DealerDashboard() {
  const { kpis: k, activities, alerts, charts } = usePanelDashboard('dealer');
  return (
    <div className="space-y-6">
      <PanelDashboard
        quickActions={[
          { label: 'Quick Sale', href: '/dealer/sales/quick', icon: ShoppingCart, variant: 'default' },
          { label: 'Full Invoice', href: '/dealer/billing/new', icon: Receipt },
          { label: 'Customers', href: '/dealer/customers', icon: Users },
          { label: 'Stock', href: '/dealer/inventory', icon: Package },
        ]}
        kpis={[
          { label: "Today's Sales", value: formatCurrency(k.sales || 0), icon: Receipt, accent: true },
          { label: 'Bills This Month', value: String(k.bills ?? 0), icon: FileText },
          { label: 'Outstanding', value: formatCurrency(k.outstanding || 0), icon: AlertTriangle },
          { label: 'Incoming Dispatches', value: String(k.dispatches ?? 0), icon: Truck },
        ]}
        chartTitle="Weekly Sales (₹)"
        chartData={charts.primary}
        activities={activities}
        alerts={alerts}
      />
      <TopProductsWidget />
    </div>
  );
}

export function EmployeeDashboard() {
  const { kpis: k, activities, alerts, charts } = usePanelDashboard('employee');
  return (
    <div className="space-y-6">
      <PanelDashboard
        quickActions={[
          { label: 'Assigned Dealers', href: '/employee/dealers', icon: Users },
          { label: 'Analytics', href: '/employee/dealer-analytics', icon: Target },
          { label: 'Performance', href: '/employee/performance', icon: CheckSquare },
          { label: 'My Tasks', href: '/employee/tasks', icon: ClipboardList },
        ]}
        kpis={[
          { label: 'Assigned Dealers', value: String(k.dealers ?? 0), icon: Users, accent: true },
          { label: 'Green Zone', value: String(k.greenZone ?? 0), icon: Target },
          { label: 'Red Zone', value: String(k.redZone ?? 0), icon: AlertTriangle },
          { label: 'Pending Tasks', value: String(k.tasks ?? 0), icon: CheckSquare },
        ]}
      chartTitle="Tasks Completed (This Week)"
      chartData={charts.primary}
      activities={activities}
      alerts={alerts}
    />
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold">Assigned Dealers</h3>
          <a href="/employee/dealers" className="text-xs text-brand-600 hover:underline">View all</a>
        </div>
        <DealerCardGrid limit={4} />
      </div>
    </div>
  );
}

export function ServiceDashboard() {
  const { kpis: k, activities, alerts, charts } = usePanelDashboard('service');
  return (
    <PanelDashboard
      quickActions={[
        { label: 'Open Tickets', href: '/service/tickets', icon: Headphones },
        { label: 'New Ticket', href: '/service/tickets/new', icon: Headphones },
        { label: 'Spare Requests', href: '/service/spare-parts', icon: Wrench },
        { label: 'Returns', href: '/service/defective-returns', icon: Package },
      ]}
      kpis={[
        { label: 'Open Tickets', value: String(k.openComplaints ?? 0), icon: Headphones, accent: true },
        { label: 'SLA Breaches', value: String(k.slaBreaches ?? 0), icon: Clock },
        { label: 'Pending Parts', value: String(k.pendingParts ?? 0), icon: Wrench },
        { label: 'Defective Returns', value: String(k.returns ?? 0), icon: Package },
      ]}
      chartTitle="Tickets Resolved (This Week)"
      chartData={charts.primary}
      activities={activities}
      alerts={alerts}
    />
  );
}

export function CustomerDashboard() {
  const { kpis: k, activities, alerts, charts } = usePanelDashboard('customer');
  return (
    <PanelDashboard
      quickActions={[
        { label: 'Warranty Lookup', href: '/customer/warranty/lookup', icon: Shield },
        { label: 'Raise Complaint', href: '/customer/service-requests/new', icon: Headphones },
        { label: 'My Orders', href: '/customer/orders', icon: ShoppingCart },
      ]}
      kpis={[
        { label: 'Active Warranties', value: String(k.warranties ?? 0), icon: Shield, accent: true },
        { label: 'Open Requests', value: String(k.serviceRequests ?? 0), icon: Wrench },
        { label: 'Active Orders', value: String(k.orders ?? 0), icon: ShoppingCart },
        { label: 'Total Spent', value: formatCurrency(k.spent || 0), icon: Receipt },
      ]}
      chartTitle="Purchase History (₹)"
      chartData={charts.primary}
      chartType="area"
      activities={activities}
      alerts={alerts}
    />
  );
}

export function TeamDashboard() {
  const { kpis: k, activities, alerts, charts } = usePanelDashboard('manager');
  return (
    <div className="space-y-6">
      <PanelDashboard
        quickActions={[
          { label: 'Team Performance', href: '/employee/performance', icon: Target },
          { label: 'Dealer Analytics', href: '/employee/dealer-analytics', icon: CheckSquare },
          { label: 'Assigned Dealers', href: '/employee/dealers', icon: Users },
        ]}
        kpis={[
          { label: 'Team Members', value: String(k.team ?? 0), icon: Users, accent: true },
          { label: 'Network Dealers', value: String(k.dealers ?? 0), icon: Target },
          { label: 'Green Zone', value: String(k.greenZone ?? 0), icon: CheckSquare },
          { label: 'Red Zone', value: String(k.redZone ?? 0), icon: AlertTriangle },
        ]}
        chartTitle="Team Activity (This Week)"
        chartData={charts.primary}
        activities={activities}
        alerts={alerts}
      />
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">Team Dealer Performance</h3>
          <a href="/employee/dealers" className="text-xs text-brand-600 hover:underline">View all</a>
        </div>
        <DealerCardGrid limit={8} team />
      </div>
    </div>
  );
}
