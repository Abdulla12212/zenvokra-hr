import {
  Building2,
  CalendarDays,
  Inbox,
  LayoutDashboard,
  LogOut,
  Settings2,
  Users,
} from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router';

import type { Session } from '@/features/auth/api/auth-api';
import { useLogout } from '@/features/auth/api/auth-queries';
import { useInbox } from '@/features/inbox/api/inbox-queries';
import { Button } from '@/components/ui/button';
import { homeHref, parseHomeSearch } from '@/lib/home-search';
import { cn } from '@/lib/utils';

interface NavigationItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}

export function PlatformShell({ session }: { session: Session }) {
  return (
    <ModeShell
      session={session}
      badge="Platform"
      navigation={[{ to: '/', label: 'Companies', icon: Building2 }]}
    />
  );
}

export function TenantShell({ session }: { session: Session }) {
  return (
    <ModeShell
      session={session}
      badge="Tenant admin"
      contextLabel={session.tenantName ?? undefined}
      navigation={[
        { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/admin/employees', label: 'Employees', icon: Users },
        { to: '/admin/approvals', label: 'Approvals', icon: Inbox },
        { to: '/admin/organization', label: 'Organization', icon: Settings2 },
      ]}
    />
  );
}

export function EmployeeShell({ session }: { session: Session }) {
  const inbox = useInbox();
  const unread = inbox.isSuccess ? inbox.data.filter((item) => item.unread).length : 0;
  const requestHref = homeHref({ ...parseHomeSearch(new URLSearchParams()), sheet: 'request' });

  return (
    <ModeShell
      session={session}
      badge="Employee"
      contextLabel={session.tenantName ?? undefined}
      profileTo="/profile"
      headerAction={{ to: requestHref, label: 'Request time off' }}
      navigation={[
        { to: '/', label: 'Home', icon: LayoutDashboard },
        { to: '/time-off', label: 'Time off', icon: CalendarDays },
        { to: '/inbox', label: 'Inbox', icon: Inbox, badge: unread },
      ]}
    />
  );
}

function ModeShell({
  session,
  badge,
  contextLabel,
  navigation,
  profileTo,
  headerAction,
}: {
  session: Session;
  badge: string;
  contextLabel?: string;
  navigation: NavigationItem[];
  profileTo?: string;
  headerAction?: { to: string; label: string };
}) {
  const logout = useLogout();

  return (
    <div className="bg-background flex min-h-full">
      <aside className="bg-card hidden w-60 shrink-0 flex-col border-r md:flex">
        <div className="flex h-14 items-center gap-2 border-b px-5">
          <div className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-md text-xs font-bold">
            C
          </div>
          <span className="font-semibold tracking-tight">Cloudesh HR</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navigation.map((item) => (
            <NavigationLink key={item.to} item={item} />
          ))}
        </nav>
        {profileTo ? (
          <div className="border-t p-3">
            <NavLink
              to={profileTo}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )
              }
            >
              Profile
            </NavLink>
          </div>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/80 sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b px-6 backdrop-blur">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-sm font-medium md:hidden">Cloudesh HR</span>
            {contextLabel ? (
              <span className="text-muted-foreground hidden truncate text-sm sm:inline">
                {contextLabel}
              </span>
            ) : null}
          </div>
          <div className="ml-auto flex items-center gap-3">
            {headerAction ? (
              <Button variant="outline" size="sm" asChild>
                <Link to={headerAction.to}>{headerAction.label}</Link>
              </Button>
            ) : null}
            <span className="text-muted-foreground rounded-full border px-2.5 py-0.5 text-xs">
              {badge}
            </span>
            <span className="text-muted-foreground hidden truncate text-sm sm:inline">
              {session.email}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void logout.mutateAsync()}
              disabled={logout.isPending}
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </header>

        <main className="flex-1 px-6 py-8">
          <div className="mx-auto w-full max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function NavigationLink({ item }: { item: NavigationItem }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === '/' || item.to === '/admin'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
          isActive
            ? 'bg-accent text-accent-foreground font-medium'
            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
        )
      }
    >
      <Icon className="size-4" aria-hidden="true" />
      <span className="flex-1">{item.label}</span>
      {item.badge && item.badge > 0 ? (
        <span className="bg-primary text-primary-foreground min-w-[18px] rounded-full px-1.5 text-center text-[11px] leading-[18px] font-semibold">
          {item.badge}
        </span>
      ) : null}
    </NavLink>
  );
}
