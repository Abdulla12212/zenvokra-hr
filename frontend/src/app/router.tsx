import { createBrowserRouter } from 'react-router';

import { DepartmentsPage } from '@/features/departments/pages/departments-page';

import { AppShell } from './layout/app-shell';
import { DashboardPage } from './pages/dashboard-page';
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
    path: '/',
    Component: AppShell,
    ErrorBoundary: RouteErrorPage,
    children: [
      { index: true, Component: DashboardPage },
      // One route per feature; the page itself lives with its feature.
      { path: 'departments', Component: DepartmentsPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
]);
