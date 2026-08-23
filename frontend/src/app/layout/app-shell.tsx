import { Building2, LayoutDashboard, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';

import { cn } from '@/lib/utils';

interface NavigationItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Features that exist as navigation but not yet as pages. */
  disabled?: boolean;
}

const navigation: NavigationItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/departments', label: 'Departments', icon: Building2 },
  { to: '/people', label: 'People', icon: Users, disabled: true },
];

/**
 * Application chrome: sidebar navigation plus the routed page.
 *
 * Rendered as the root route's component, so every page inherits it and no page has
 * to think about layout.
 */
export function AppShell() {
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

        <p className="text-muted-foreground border-t px-5 py-4 text-xs">
          Boilerplate &mdash; no features yet
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/80 sticky top-0 z-10 flex h-14 items-center justify-between border-b px-6 backdrop-blur">
          <span className="text-sm font-medium md:hidden">Cloudesh HR</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-muted-foreground rounded-full border px-2.5 py-0.5 text-xs">
              Demo tenant
            </span>
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

  if (item.disabled) {
    return (
      <span
        aria-disabled="true"
        className="text-muted-foreground/60 flex cursor-not-allowed items-center gap-2.5 rounded-md px-3 py-2 text-sm"
      >
        <Icon className="size-4" aria-hidden="true" />
        {item.label}
        <span className="ml-auto text-[10px] uppercase">soon</span>
      </span>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
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
      {item.label}
    </NavLink>
  );
}
