import { Bell, Building2, ClipboardCheck, LayoutGrid, Search, SlidersHorizontal, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';

import mushroomAvatar from '@/assets/mushroom-avatar.svg';
import { Button } from '@/components/ui/button';
import { useApprovals } from '@/features/approvals/api/approvals-queries';
import { useEmployees } from '@/features/employees/api/employees-queries';
import { demoSession } from '@/lib/demo-session';
import { initials } from '@/lib/initials';
import { cn } from '@/lib/utils';

interface NavigationItem {
  to: string;
  label: string;
  icon: typeof LayoutGrid;
  badge?: number;
  alert?: boolean;
}

/**
 * Admin chrome: Dashboard / Employees / Approvals / Organization.
 * Do not mix this nav with the employee shell.
 */
export function AdminShell() {
  const employees = useEmployees({ pageSize: 100 });
  const approvals = useApprovals();
  const headcount = employees.data?.totalCount ?? 0;
  const pending = approvals.data?.pending.length ?? 0;

  const navigation: NavigationItem[] = [
    { to: '/admin', label: 'Dashboard', icon: LayoutGrid },
    { to: '/admin/employees', label: 'Employees', icon: Users, badge: headcount || undefined },
    {
      to: '/admin/approvals',
      label: 'Approvals',
      icon: ClipboardCheck,
      badge: pending || undefined,
      alert: pending > 0,
    },
    { to: '/admin/organization', label: 'Organization', icon: Building2 },
  ];

  return (
    <div className="bg-background flex min-h-full">
      <aside className="bg-card flex w-60 shrink-0 flex-col border-r">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <div className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-md text-xs font-bold tracking-tight">
            C
          </div>
          <div className="min-w-0">
            <p className="text-sm leading-tight font-semibold tracking-tight">Cloudesh Admin</p>
            <p className="text-muted-foreground truncate text-[11px]">{demoSession.tenantName}</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navigation.map((item) => (
            <AdminNavLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="flex items-center gap-2.5 border-t px-4 py-3">
          <img src={mushroomAvatar} alt="" className="bg-muted size-8 rounded-full object-cover" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">{demoSession.employee.fullName}</p>
            <p className="text-muted-foreground text-[11px]">Admin · {demoSession.location}</p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/80 sticky top-0 z-10 flex h-14 items-center gap-4 border-b px-6">
          <p className="text-muted-foreground shrink-0 text-[13px] font-medium">
            {demoSession.adminClockLabel}
          </p>
          <div className="text-muted-foreground mx-auto flex h-9 max-w-md flex-1 items-center gap-2 rounded-md border px-3 text-sm">
            <Search className="size-4" aria-hidden="true" />
            <span>Quick search or jump…</span>
            <span className="border-border ml-auto rounded border px-1.5 text-[10px]">⌘K</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" type="button" aria-label="Notifications">
              <Bell aria-hidden="true" />
            </Button>
            <Button variant="outline" size="icon" type="button" aria-label="Settings">
              <SlidersHorizontal aria-hidden="true" />
            </Button>
            <div
              className="bg-muted grid size-8 place-items-center rounded-full text-xs font-semibold"
              aria-hidden="true"
            >
              {initials(demoSession.employee.fullName)}
            </div>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AdminNavLink({ item }: { item: NavigationItem }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === '/admin'}
      className={({ isActive }) =>
        cn(
          'flex h-9 items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
        )
      }
    >
      <Icon className="size-4" aria-hidden="true" />
      {item.label}
      {item.badge ? (
        <span
          aria-hidden="true"
          className={cn(
            'ml-auto grid min-w-[18px] place-items-center rounded-full px-1.5 text-[11px] font-semibold',
            item.alert
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-primary text-primary-foreground',
          )}
        >
          {item.badge}
        </span>
      ) : null}
    </NavLink>
  );
}
