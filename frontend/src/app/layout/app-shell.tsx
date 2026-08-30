import { Bell, Calendar, Sun } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router';

import mushroomAvatar from '@/assets/mushroom-avatar.svg';
import { Button } from '@/components/ui/button';
import { demoSession } from '@/lib/demo-session';
import { cn } from '@/lib/utils';

interface NavigationItem {
  to: string;
  label: string;
  icon: typeof Calendar;
  badge?: number;
}

const navigation: NavigationItem[] = [
  { to: '/', label: 'Home', icon: Calendar },
  { to: '/time-off', label: 'Time off', icon: Sun },
  {
    to: '/inbox',
    label: 'Inbox',
    icon: Bell,
    badge: demoSession.inboxUnreadCount,
  },
];

/**
 * Employee chrome: w-60 sidebar, h-14 header, main p-6.
 *
 * Nav is Home / Time off / Inbox only. The signed-in person is the one row in
 * `demoSession` — do not add People or a switcher here.
 */
export function AppShell() {
  const unread = demoSession.inboxUnreadCount;
  const inboxLabel = unread > 0 ? `Inbox, ${String(unread)} unread` : 'Inbox';

  return (
    <div className="bg-background flex min-h-full">
      <aside className="bg-card flex w-60 shrink-0 flex-col border-r">
        <div className="flex h-14 items-center gap-2 border-b px-5">
          <div className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-md text-xs font-bold tracking-tight">
            C
          </div>
          <span className="text-sm font-semibold tracking-tight">Cloudesh</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navigation.map((item) => (
            <NavigationLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="flex items-center gap-2.5 border-t px-4 py-3">
          <img src={mushroomAvatar} alt="" className="bg-muted size-8 rounded-full object-cover" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">{demoSession.employee.fullName}</p>
            <p className="text-muted-foreground text-xs">{demoSession.employee.employeeNumber}</p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/80 sticky top-0 z-10 flex h-14 items-center justify-between border-b px-6">
          <p className="text-muted-foreground text-[13px] font-medium">
            {demoSession.clockLabel} · {demoSession.location}
          </p>
          <div className="flex items-center gap-2">
            <Button type="button">Request time off</Button>
            <Button variant="outline" size="icon" className="relative" asChild>
              <Link to="/inbox" aria-label={inboxLabel}>
                <Bell aria-hidden="true" />
                {unread > 0 ? (
                  <span
                    aria-hidden="true"
                    className="bg-primary ring-background absolute top-1.5 right-1.5 size-1.5 rounded-full ring-2"
                  />
                ) : null}
              </Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
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
      end={item.to === '/'}
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
          className="bg-primary text-primary-foreground ml-auto grid min-w-[18px] place-items-center rounded-full px-1.5 text-[11px] font-semibold"
        >
          {item.badge}
        </span>
      ) : null}
    </NavLink>
  );
}
