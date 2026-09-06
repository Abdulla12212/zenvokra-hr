import { createBrowserRouter } from 'react-router';

import { DepartmentsPage } from '@/features/departments/pages/departments-page';

import { AdminShell } from './layout/admin-shell';
import { AppShell } from './layout/app-shell';
import { AdminApprovalsPage } from './pages/admin-approvals-page';
import { AdminDashboardPage } from './pages/admin-dashboard-page';
import { AdminEmployeePage } from './pages/admin-employee-page';
import { AdminEmployeesPage } from './pages/admin-employees-page';
import { AdminOrganizationPage } from './pages/admin-organization-page';
import { ContinuePage } from './pages/continue-page';
import { HelpPage } from './pages/help-page';
import { HomePage } from './pages/home-page';
import { InboxPage } from './pages/inbox-page';
import { NotFoundPage } from './pages/not-found-page';
import { ProfilePage } from './pages/profile-page';
import { RequestDetailPage } from './pages/request-detail-page';
import { RouteErrorPage } from './pages/route-error-page';
import { TimeOffPage } from './pages/time-off-page';
import { SessionGate } from './session-gate';

/**
 * Route table for the whole app.
 *
 * Data-mode React Router (`createBrowserRouter`) rather than framework mode: this is a
 * static SPA served next to a separate API, so there is no server to render on.
 *
 * Loaders are deliberately unused. TanStack Query owns server state.
 *
 * Employee nav is Home / Time off / Inbox. Admin nav is Dashboard / Employees /
 * Approvals / Organization. Continue is a session stub, not authentication.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    Component: SessionGate,
    ErrorBoundary: RouteErrorPage,
    children: [
      { path: 'continue', Component: ContinuePage },
      {
        path: 'admin',
        Component: AdminShell,
        children: [
          { index: true, Component: AdminDashboardPage },
          { path: 'employees', Component: AdminEmployeesPage },
          { path: 'employees/:employeeId', Component: AdminEmployeePage },
          { path: 'approvals', Component: AdminApprovalsPage },
          { path: 'organization', Component: AdminOrganizationPage },
          { path: '*', Component: NotFoundPage },
        ],
      },
      {
        Component: AppShell,
        children: [
          { index: true, Component: HomePage },
          { path: 'time-off', Component: TimeOffPage },
          { path: 'time-off/:requestId', Component: RequestDetailPage },
          { path: 'inbox', Component: InboxPage },
          { path: 'profile', Component: ProfilePage },
          { path: 'help', Component: HelpPage },
          // WALKING SKELETON: not in the employee nav.
          { path: 'departments', Component: DepartmentsPage },
          { path: '*', Component: NotFoundPage },
        ],
      },
    ],
  },
]);
