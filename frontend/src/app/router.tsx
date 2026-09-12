import { createBrowserRouter } from 'react-router';

import { LoginPage } from '@/features/auth/pages/login-page';
import { CompanyDetailPage } from '@/features/platform-tenants/pages/company-detail-page';

import { HomeRoute, PlatformOnly, SessionLayout } from './layout/session-layout';
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
      { path: '*', Component: NotFoundPage },
    ],
  },
]);
