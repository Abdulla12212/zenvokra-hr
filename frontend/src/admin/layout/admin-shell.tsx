import { LayoutDashboard, ListChecks, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';

import { cn } from '@/lib/utils';

import { AdminStateProvider } from '../admin-state-provider';
import { useAdminState } from '../use-admin-state';

import { AdminSidebar } from './admin-sidebar';
import { AdminTopBar } from './admin-top-bar';

/**
 * Admin chrome: full-width top bar plus a compact sidebar.
 *
 * Pages under this shell use in-memory seed data until the Employees and Approvals
 * APIs exist. Creating an employee or deciding an approval only updates that local
 * state — it is not persisted.
 */
export function AdminShell() {
  return (
    <AdminStateProvider>
      <div className="flex h-full flex-col">
        <AdminTopBar />
        <MobileNav />
        <div className="flex min-h-0 flex-1">
          <AdminSidebar />
          <main className="min-w-0 flex-1 overflow-auto px-6 py-5">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminStateProvider>
  );
}

function MobileNav() {
  const { approvals } = useAdminState();

  return (
    <nav className="bg-card flex gap-1 overflow-x-auto border-b px-2 py-1.5 md:hidden">
      <MobileLink to="/" end label="Dashboard" icon={LayoutDashboard} />
      <MobileLink to="/employees" label="Employees" icon={Users} />
      <MobileLink to="/approvals" label="Approvals" icon={ListChecks} badge={approvals.length} />
    </nav>
  );
}

function MobileLink({
  to,
  end,
  label,
  icon: Icon,
  badge,
}: {
  to: string;
  end?: boolean;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs',
          isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground',
        )
      }
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
      {badge && badge > 0 ? (
        <span className="bg-primary/10 text-primary rounded-full px-1.5 text-[10px]">{badge}</span>
      ) : null}
    </NavLink>
  );
}
