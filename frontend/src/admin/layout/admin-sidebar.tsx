import { LayoutDashboard, ListChecks, Users } from 'lucide-react';
import { NavLink } from 'react-router';

import { cn } from '@/lib/utils';

import { useAdminState } from '../use-admin-state';

const navigation = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/employees', label: 'Employees', icon: Users, end: true },
  { to: '/approvals', label: 'Approvals', icon: ListChecks, end: true },
] as const;

export function AdminSidebar() {
  const { approvals } = useAdminState();

  return (
    <aside className="bg-card hidden w-52 shrink-0 flex-col border-r md:flex">
      <nav className="flex flex-1 flex-col gap-0.5 p-2.5 pt-3">
        {navigation.map((item) => {
          const Icon = item.icon;
          const showBadge = item.to === '/approvals' && approvals.length > 0;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex h-8 items-center gap-2 rounded-md px-2.5 text-[13px] transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )
              }
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
              {showBadge ? (
                <span className="bg-primary/10 text-primary ml-auto grid min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-medium">
                  {approvals.length}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
