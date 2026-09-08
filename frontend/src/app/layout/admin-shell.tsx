import { useState } from 'react';
import {
  Bell,
  Building2,
  ChevronsUpDown,
  ClipboardCheck,
  LayoutGrid,
  Menu,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router';

import mushroomAvatar from '@/assets/mushroom-avatar.svg';
import { Input } from '@/components/ui/input';
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
 * Admin chrome matching the Stitch Cloudesh Admin kit: white rail, MENU kicker,
 * rounded nav, frozen clock, search, notifications.
 */
export function AdminShell() {
  const [navOpen, setNavOpen] = useState(false);
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
      {navOpen ? (
        <button
          type="button"
          className="bg-foreground/20 fixed inset-0 z-30 lg:hidden"
          aria-label="Close menu"
          onClick={() => {
            setNavOpen(false);
          }}
        />
      ) : null}

      <aside
        className={cn(
          'bg-card w-60 shrink-0 flex-col border-r',
          navOpen ? 'fixed inset-y-0 left-0 z-40 flex lg:static lg:z-auto' : 'hidden lg:flex',
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <div className="bg-primary text-primary-foreground text-label-md grid size-8 place-items-center rounded-sm font-bold tracking-tight">
            C
          </div>
          <div className="min-w-0 flex-1 leading-none">
            <p className="text-title-md text-foreground">Cloudesh Admin</p>
            <p className="text-label-xs text-muted-foreground mt-0.5">{demoSession.tenantName}</p>
          </div>
          <button
            type="button"
            className="text-outline hover:bg-muted rounded-lg p-1 lg:hidden"
            aria-label="Close menu"
            onClick={() => {
              setNavOpen(false);
            }}
          >
            <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <p className="text-label-xs text-outline px-4 pt-4 pb-1 font-semibold tracking-wider uppercase">
          Menu
        </p>
        <nav aria-label="Admin" className="flex flex-1 flex-col gap-1 px-1">
          {navigation.map((item) => (
            <AdminNavLink key={item.to} item={item} onNavigate={() => setNavOpen(false)} />
          ))}
        </nav>

        <div className="border-t p-2">
          <div className="bg-muted/80 flex items-center gap-3 rounded-xl border p-2">
            <img
              src={mushroomAvatar}
              alt=""
              className="bg-muted size-9 rounded-2xl border object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-body-sm truncate font-semibold">{demoSession.employee.fullName}</p>
              <p className="text-label-xs text-muted-foreground">Admin · {demoSession.location}</p>
            </div>
            <ChevronsUpDown
              className="text-outline size-[18px] shrink-0"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-card/90 sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b px-4 backdrop-blur-md md:gap-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl p-2 lg:hidden"
              aria-label="Open menu"
              onClick={() => {
                setNavOpen(true);
              }}
            >
              <Menu className="size-5" strokeWidth={1.5} aria-hidden="true" />
            </button>
            <p className="text-body-sm text-muted-foreground hidden min-w-0 truncate sm:block">
              <span className="text-foreground font-medium">{demoSession.adminClockLabel}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <label className="relative hidden lg:block">
              <span className="sr-only">Quick search or jump</span>
              <Search
                className="text-outline pointer-events-none absolute top-1/2 left-2.5 size-[18px] -translate-y-1/2"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <Input
                className="placeholder:text-outline focus-visible:border-primary bg-muted text-body-sm h-9 w-[min(16rem,36vw)] rounded-xl border pr-12 pl-8 shadow-none focus-visible:ring-0"
                placeholder="Quick search or jump..."
              />
              <kbd className="bg-surface-high text-muted-foreground text-micro pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border px-1.5 py-0.5 leading-none">
                ⌘K
              </kbd>
            </label>
            <span className="bg-border hidden h-5 w-px lg:block" aria-hidden="true" />
            <button
              type="button"
              className="text-muted-foreground hover:bg-muted hover:text-foreground relative rounded-xl p-2"
              aria-label="Notifications, 3 unread"
            >
              <Bell className="size-5" strokeWidth={1.5} aria-hidden="true" />
              <span className="bg-primary text-primary-foreground text-micro absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full font-bold">
                3
              </span>
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:bg-muted hover:text-foreground hidden rounded-xl p-2 sm:inline-flex"
              aria-label="Settings"
            >
              <SlidersHorizontal className="size-5" strokeWidth={1.5} aria-hidden="true" />
            </button>
            <div
              className="bg-primary-deep text-primary-foreground text-label-md grid size-8 place-items-center rounded-2xl leading-none font-bold"
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

function AdminNavLink({ item, onNavigate }: { item: NavigationItem; onNavigate: () => void }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === '/admin'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group text-body-md flex items-center justify-between rounded-xl px-2 py-2 transition-colors',
          isActive
            ? 'bg-muted text-foreground border-border border font-semibold shadow-sm'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className="flex items-center gap-3">
            <Icon
              className={cn(
                'size-5',
                isActive ? 'text-foreground' : 'text-outline group-hover:text-foreground',
              )}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            {item.label}
          </span>
          {item.badge ? (
            <span
              aria-hidden="true"
              className={cn(
                'text-label-xs grid min-w-[18px] place-items-center rounded-full px-2 py-0.5 font-medium',
                item.alert
                  ? 'bg-destructive text-primary-foreground'
                  : 'bg-surface-high text-muted-foreground',
              )}
            >
              {item.badge}
            </span>
          ) : null}
        </>
      )}
    </NavLink>
  );
}
