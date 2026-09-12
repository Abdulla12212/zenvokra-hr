import { Navigate, Outlet } from 'react-router';

import { useCurrentUser } from '@/features/auth/api/auth-queries';
import { CompaniesPage } from '@/features/platform-tenants/pages/companies-page';
import { TenantHomePage } from '@/features/tenant-workspace/pages/tenant-home-page';
import { Skeleton } from '@/components/ui/skeleton';

import { PlatformShell, TenantShell } from './mode-shell';

export function SessionLayout() {
  const { data, isPending, isError, error } = useCurrentUser();

  if (isPending) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <Skeleton className="h-40 w-full max-w-md" />
      </div>
    );
  }

  if (isError) {
    return (
      <p role="alert" className="text-destructive p-6 text-sm">
        {error.message}
      </p>
    );
  }

  if (!data) {
    return <Navigate to="/login" replace />;
  }

  if (data.role === 'PlatformAdmin') {
    return <PlatformShell session={data} />;
  }

  return <TenantShell session={data} />;
}

export function HomeRoute() {
  const { data } = useCurrentUser();

  if (data?.role === 'TenantAdmin') {
    return <TenantHomePage companyName={data.tenantName ?? 'your company'} />;
  }

  return <CompaniesPage />;
}

export function PlatformOnly() {
  const { data } = useCurrentUser();

  if (data && data.role !== 'PlatformAdmin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
