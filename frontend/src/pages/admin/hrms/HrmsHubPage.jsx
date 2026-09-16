import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CalendarCheck,
  CalendarDays,
  CreditCard,
  Building2,
  Clock,
  ArrowUpRight,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  FileText,
  UserCheck,
  UserX,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { hrmsService } from '@/services/hrms.service';
import { toast } from '@/utils/toast';

export default function HrmsHubPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await hrmsService.getDashboardStats();
      setStats(data);
    } catch {
      toast.error('Failed to load HRMS dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <PageShell
      title="HRMS & Workforce Command Centre"
      subtitle="Enterprise Human Resource Management — employee master, attendance tracking, leave workflows, and automated payroll"
      actions={
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/admin/hrms/attendance')}
          >
            <Clock className="h-4 w-4 mr-1.5" /> Mark Attendance
          </Button>
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
            onClick={() => navigate('/admin/hrms/employees')}
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Staff Member
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => navigate('/admin/hrms/employees')}
            className="p-4 rounded-xl border border-surface-3 bg-surface-1 hover:border-amber-500/40 cursor-pointer transition-all shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-surface-500">Total Workforce</span>
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Users className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-bold text-surface-900">
              {loading ? '—' : stats?.totalEmployees ?? 0}
            </div>
            <div className="mt-1 text-xs text-surface-500 flex items-center gap-1.5">
              <span className="text-green-400 font-semibold">{stats?.activeEmployees ?? 0} Active</span>
              <span>•</span>
              <span>{stats?.probationEmployees ?? 0} Probation</span>
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/hrms/attendance')}
            className="p-4 rounded-xl border border-surface-3 bg-surface-1 hover:border-amber-500/40 cursor-pointer transition-all shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-surface-500">Today's Attendance</span>
              <span className="p-2 rounded-lg bg-green-500/10 text-green-400">
                <UserCheck className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-bold text-surface-900">
              {loading ? '—' : `${stats?.today?.attendancePercentage ?? 0}%`}
            </div>
            <div className="mt-1 text-xs text-surface-500 flex items-center gap-1.5">
              <span className="text-green-400 font-semibold">{stats?.today?.present ?? 0} Present</span>
              <span>•</span>
              <span className="text-red-400 font-semibold">{stats?.today?.absent ?? 0} Absent</span>
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/hrms/leaves')}
            className="p-4 rounded-xl border border-surface-3 bg-surface-1 hover:border-amber-500/40 cursor-pointer transition-all shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-surface-500">Pending Leaves</span>
              <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <CalendarDays className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-bold text-surface-900">
              {loading ? '—' : stats?.pendingLeaves ?? 0}
            </div>
            <div className="mt-1 text-xs text-surface-500">
              {stats?.pendingLeaves > 0 ? (
                <span className="text-amber-400 font-medium">Requires management review</span>
              ) : (
                <span className="text-green-400 font-medium">All applications cleared</span>
              )}
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/hrms/payroll')}
            className="p-4 rounded-xl border border-surface-3 bg-surface-1 hover:border-amber-500/40 cursor-pointer transition-all shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-surface-500">Month Payroll Cost</span>
              <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <CreditCard className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-bold text-surface-900 font-mono">
              {loading ? '—' : `₹${(stats?.payroll?.totalCost ?? 0).toLocaleString()}`}
            </div>
            <div className="mt-1 text-xs text-surface-500 flex items-center gap-1.5">
              <span>{stats?.payroll?.generatedCount ?? 0} Processed</span>
              <span>•</span>
              <span className="text-green-400">{stats?.payroll?.paidCount ?? 0} Paid</span>
            </div>
          </div>
        </div>

        {/* Middle Row: Today's Attendance Progress & Quick Hub Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Today's Attendance Detail */}
          <div className="lg:col-span-2 p-5 rounded-xl border border-surface-3 bg-surface-1 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-surface-900 flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-amber-400" /> Today's Workforce Status
                </h3>
                <p className="text-xs text-surface-500 mt-0.5">
                  Date: {stats?.today?.date || new Date().toISOString().split('T')[0]}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => navigate('/admin/hrms/attendance')}
              >
                View Full Register →
              </Button>
            </div>

            {/* Attendance breakdown pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                <span className="block text-2xl font-bold text-green-400">
                  {stats?.today?.present ?? 0}
                </span>
                <span className="text-[11px] font-semibold text-green-300 uppercase tracking-wider">
                  Present
                </span>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                <span className="block text-2xl font-bold text-red-400">
                  {stats?.today?.absent ?? 0}
                </span>
                <span className="text-[11px] font-semibold text-red-300 uppercase tracking-wider">
                  Absent
                </span>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="block text-2xl font-bold text-amber-400">
                  {stats?.today?.halfDay ?? 0}
                </span>
                <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">
                  Half-Day
                </span>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                <span className="block text-2xl font-bold text-blue-400">
                  {stats?.today?.onLeave ?? 0}
                </span>
                <span className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider">
                  On Leave
                </span>
              </div>
            </div>

            {/* Visual Attendance Progress Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-surface-500">
                <span>Present Ratio ({stats?.today?.present ?? 0} of {stats?.activeEmployees ?? 0} Staff)</span>
                <span className="font-bold text-surface-900">{stats?.today?.attendancePercentage ?? 0}%</span>
              </div>
              <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden flex">
                <div
                  className="bg-green-500 transition-all duration-500"
                  style={{ width: `${stats?.today?.attendancePercentage ?? 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Module Navigation Cards */}
          <div className="p-5 rounded-xl border border-surface-3 bg-surface-1 space-y-3">
            <h3 className="font-bold text-sm text-surface-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-400" /> HRMS Navigation
            </h3>
            <div className="space-y-2">
              <div
                onClick={() => navigate('/admin/hrms/employees')}
                className="p-2.5 rounded-lg border border-surface-3 hover:border-amber-500/40 hover:bg-surface-2/40 cursor-pointer flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block font-semibold text-xs text-surface-900">Staff Directory</span>
                    <span className="block text-[10.5px] text-surface-500">Profiles, job roles, salary & bank</span>
                  </div>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-surface-400" />
              </div>

              <div
                onClick={() => navigate('/admin/hrms/attendance')}
                className="p-2.5 rounded-lg border border-surface-3 hover:border-amber-500/40 hover:bg-surface-2/40 cursor-pointer flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-green-500/10 text-green-400">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block font-semibold text-xs text-surface-900">Attendance Tracker</span>
                    <span className="block text-[10.5px] text-surface-500">Daily check-ins & monthly sheet</span>
                  </div>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-surface-400" />
              </div>

              <div
                onClick={() => navigate('/admin/hrms/leaves')}
                className="p-2.5 rounded-lg border border-surface-3 hover:border-amber-500/40 hover:bg-surface-2/40 cursor-pointer flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block font-semibold text-xs text-surface-900">Leave Management</span>
                    <span className="block text-[10.5px] text-surface-500">Applications, balances, approvals</span>
                  </div>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-surface-400" />
              </div>

              <div
                onClick={() => navigate('/admin/hrms/payroll')}
                className="p-2.5 rounded-lg border border-surface-3 hover:border-amber-500/40 hover:bg-surface-2/40 cursor-pointer flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block font-semibold text-xs text-surface-900">Payroll Engine</span>
                    <span className="block text-[10.5px] text-surface-500">Payslips & Company Ledger sync</span>
                  </div>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-surface-400" />
              </div>

              <div
                onClick={() => navigate('/admin/hrms/departments')}
                className="p-2.5 rounded-lg border border-surface-3 hover:border-amber-500/40 hover:bg-surface-2/40 cursor-pointer flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-zinc-500/10 text-zinc-300">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block font-semibold text-xs text-surface-900">Departments</span>
                    <span className="block text-[10.5px] text-surface-500">Org structure & designations</span>
                  </div>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-surface-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Department Headcounts */}
        <div className="p-5 rounded-xl border border-surface-3 bg-surface-1 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-surface-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-400" /> Department Distribution
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => navigate('/admin/hrms/departments')}
            >
              Manage Departments →
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {(stats?.departments || []).map((d) => (
              <div
                key={d.name}
                className="p-3 rounded-lg bg-surface-2/40 border border-surface-3 text-center"
              >
                <span className="block text-xl font-bold text-surface-900">{d.count}</span>
                <span className="text-[11px] text-surface-500 truncate block mt-0.5" title={d.name}>
                  {d.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
