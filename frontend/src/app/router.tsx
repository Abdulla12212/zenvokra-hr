import { createBrowserRouter } from 'react-router';

import { AdminApprovalsPage } from '@/features/approvals/pages/admin-approvals-page';
import { LoginPage } from '@/features/auth/pages/login-page';
import { AdminDashboardPage } from '@/features/dashboard/pages/admin-dashboard-page';
import { AdminEmployeeDetailPage } from '@/features/employees/pages/admin-employee-detail-page';
import { AdminEmployeesPage } from '@/features/employees/pages/admin-employees-page';
import { EmployeeProfilePage } from '@/features/employees/pages/employee-profile-page';
import { InboxPage } from '@/features/inbox/pages/inbox-page';
import { RequestDetailPage } from '@/features/leave/pages/request-detail-page';
import { TimeOffPage } from '@/features/leave/pages/time-off-page';
import { AdminOrganizationPage } from '@/features/organization/pages/admin-organization-page';
import { CompanyDetailPage } from '@/features/platform-tenants/pages/company-detail-page';

import {
  EmployeeOnly,
  HomeRoute,
  PlatformOnly,
  SessionLayout,
  TenantAdminOnly,
} from './layout/session-layout';
import { NotFoundPage } from './pages/not-found-page';
import { RouteErrorPage } from './pages/route-error-page';

/**
 * Route table for the whole app.
 *
 * Data-mode React Router (`createBrowserRouter`) rather than framework mode: this is a
 * static SPA served next to a separate API, so there is no server to render on. Server
 * rendering, if it is ever wanted, is a migration to framework mode — see
 * docs/ARCHITECTURE.md.
 *
 * Loaders are deliberately unused. TanStack Query owns server state, and splitting that
 * responsibility across two caches is how data gets stale in one place and fresh in
 * another.
 */
export const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginPage,
    ErrorBoundary: RouteErrorPage,
  },
  {
    path: '/',
    Component: SessionLayout,
    ErrorBoundary: RouteErrorPage,
    children: [
      { index: true, Component: HomeRoute },
      {
        Component: PlatformOnly,
        children: [{ path: 'tenants/:tenantId', Component: CompanyDetailPage }],
      },
      {
        Component: TenantAdminOnly,
        children: [
          { path: 'admin', Component: AdminDashboardPage },
          { path: 'admin/employees', Component: AdminEmployeesPage },
          { path: 'admin/employees/:employeeId', Component: AdminEmployeeDetailPage },
          { path: 'admin/approvals', Component: AdminApprovalsPage },
          { path: 'admin/organization', Component: AdminOrganizationPage },
        ],
      },
      {
        Component: EmployeeOnly,
        children: [
          { path: 'time-off', Component: TimeOffPage },
          { path: 'time-off/:requestId', Component: RequestDetailPage },
          { path: 'inbox', Component: InboxPage },
          { path: 'profile', Component: EmployeeProfilePage },
        ],
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
]);
