import { createBrowserRouter } from 'react-router';

import { DepartmentsPage } from '@/features/departments/pages/departments-page';

import { AppShell } from './layout/app-shell';
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
 * static SPA served next to a separate API, so there is no server to render on. Server
 * rendering, if it is ever wanted, is a migration to framework mode — see
 * docs/ARCHITECTURE.md.
 *
 * Loaders are deliberately unused. TanStack Query owns server state, and splitting that
 * responsibility across two caches is how data gets stale in one place and fresh in
 * another.
 *
 * Employee nav is Home / Time off / Inbox. Departments stays routed so the walking
 * skeleton can still be opened by URL; it is not in the sidebar. Continue is a session
 * stub, not authentication.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    Component: SessionGate,
    ErrorBoundary: RouteErrorPage,
    children: [
      { path: 'continue', Component: ContinuePage },
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
