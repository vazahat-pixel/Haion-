import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PanelGuard } from '@/components/auth/PanelGuard';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { ROLES } from '@/constants/roles';
import { PERMISSIONS } from '@/constants/permissions';
import { EmployeePanelSkeleton } from './EmployeePanelSkeleton';

const EmployeeDashboardPage = lazy(() => import('@/pages/employee/EmployeeDashboardPage'));
const AssignedDealersPage = lazy(() => import('@/pages/employee/dealers/AssignedDealersPage'));
const AssignedDealerDetailPage = lazy(() => import('@/pages/employee/dealers/AssignedDealerDetailPage'));
const DealerAnalyticsPage = lazy(() => import('@/pages/employee/analytics/DealerAnalyticsPage'));
const PerformancePage = lazy(() => import('@/pages/employee/performance/PerformancePage'));
const TaskListPage = lazy(() => import('@/pages/employee/tasks/TaskListPage'));
const TaskDetailPage = lazy(() => import('@/pages/employee/tasks/TaskDetailPage'));
const ReportListPage = lazy(() => import('@/pages/employee/reports/ReportListPage'));
const ReportDetailPage = lazy(() => import('@/pages/employee/reports/ReportDetailPage'));
const TeamDashboardPage = lazy(() => import('@/pages/employee/team/TeamDashboardPage'));
const ApprovalListPage = lazy(() => import('@/pages/employee/approvals/ApprovalListPage'));
const ApprovalDetailPage = lazy(() => import('@/pages/employee/approvals/ApprovalDetailPage'));

const PANEL_ROLES = [ROLES.EMPLOYEE, ROLES.MANAGER];

export default function EmployeeRoutes() {
  return (
    <AuthGuard>
      <PanelGuard allowedRoles={PANEL_ROLES}>
        <Suspense fallback={<EmployeePanelSkeleton />}>
          <Routes>
            <Route element={<EmployeeLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<EmployeeDashboardPage />} />
              <Route path="dealers" element={<PermissionGuard require={PERMISSIONS.EMPLOYEE_DEALERS_READ} redirectTo="/unauthorized"><AssignedDealersPage /></PermissionGuard>} />
              <Route path="dealers/:id" element={<PermissionGuard require={PERMISSIONS.EMPLOYEE_DEALERS_READ} redirectTo="/unauthorized"><AssignedDealerDetailPage /></PermissionGuard>} />
              <Route path="dealer-analytics" element={<PermissionGuard require={PERMISSIONS.EMPLOYEE_ANALYTICS_READ} redirectTo="/unauthorized"><DealerAnalyticsPage /></PermissionGuard>} />
              <Route path="performance" element={<PermissionGuard require={PERMISSIONS.EMPLOYEE_PERFORMANCE_READ} redirectTo="/unauthorized"><PerformancePage /></PermissionGuard>} />
              <Route path="tasks" element={<TaskListPage />} />
              <Route path="tasks/:id" element={<TaskDetailPage />} />
              <Route path="reports" element={<ReportListPage />} />
              <Route path="reports/:id" element={<ReportDetailPage />} />
              <Route path="team" element={<PermissionGuard require={PERMISSIONS.TEAM_READ} redirectTo="/unauthorized"><TeamDashboardPage /></PermissionGuard>} />
              <Route path="approvals" element={<PermissionGuard require={PERMISSIONS.APPROVALS_READ} redirectTo="/unauthorized"><ApprovalListPage /></PermissionGuard>} />
              <Route path="approvals/:id" element={<PermissionGuard require={PERMISSIONS.APPROVALS_READ} redirectTo="/unauthorized"><ApprovalDetailPage /></PermissionGuard>} />
            </Route>
          </Routes>
        </Suspense>
      </PanelGuard>
    </AuthGuard>
  );
}
