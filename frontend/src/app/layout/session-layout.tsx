import { Navigate, Outlet } from 'react-router';

import { useCurrentUser } from '@/features/auth/api/auth-queries';
import { EmployeeHomePage } from '@/features/employees/pages/employee-home-page';
import { CompaniesPage } from '@/features/platform-tenants/pages/companies-page';
import { Skeleton } from '@/components/ui/skeleton';

import { EmployeeShell, PlatformShell, TenantShell } from './mode-shell';

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

  if (data.role === 'Employee') {
    return <EmployeeShell session={data} />;
  }

  return <TenantShell session={data} />;
}

export function HomeRoute() {
  const { data } = useCurrentUser();

  if (data?.role === 'TenantAdmin') {
    return <Navigate to="/admin" replace />;
  }

  if (data?.role === 'Employee') {
    return <EmployeeHomePage companyName={data.tenantName ?? undefined} />;
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

export function TenantAdminOnly() {
  const { data } = useCurrentUser();

  if (data && data.role !== 'TenantAdmin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export function EmployeeOnly() {
  const { data } = useCurrentUser();

  if (data && data.role !== 'Employee') {
    return <Navigate to={data.role === 'TenantAdmin' ? '/admin' : '/'} replace />;
  }

  return <Outlet />;
}
