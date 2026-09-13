import { Link } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useDashboard } from '../api/dashboard-queries';

export function AdminDashboardPage() {
  const { data, isPending, isError, error } = useDashboard();

  if (isPending) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading dashboard</span>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {error.message}
      </p>
    );
  }

  const presence =
    data.headcount === 0 ? 0 : Math.round((data.present / data.headcount) * 100);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Presence, exceptions, and requests that need a decision today.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/employees">Add employee</Link>
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="On duty presence"
          value={`${String(data.present)} / ${String(data.headcount)}`}
          hint={`${String(data.remote)} remote`}
          badge={`${String(presence)}%`}
        />
        <StatCard
          label="Pending approvals"
          value={String(data.pendingApprovals)}
          hint={`${String(data.pendingPunches)} punches · ${String(data.pendingLeaves)} leaves`}
          badge={data.pendingApprovals > 0 ? 'Action needed' : 'Clear'}
          tone={data.pendingApprovals > 0 ? 'late' : 'present'}
        />
        <StatCard
          label="Late today"
          value={String(data.lateToday)}
          hint={data.averageLatenessLabel}
          badge={data.lateToday > 0 ? 'Attention' : 'On time'}
          tone={data.lateToday > 0 ? 'late' : 'present'}
        />
        <StatCard
          label="On leave / off"
          value={String(data.onLeave)}
          hint={`${String(data.annualOnLeave)} annual · ${String(data.sickOnLeave)} sick`}
          badge="Scheduled"
          tone="pending"
        />
      </div>

      <section className="bg-card space-y-3 rounded-xl border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Pending approvals</h2>
            <p className="text-muted-foreground text-sm">
              {data.pendingApprovals} request{data.pendingApprovals === 1 ? '' : 's'} needing
              review.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/approvals">View all</Link>
          </Button>
        </div>
      </section>

      <section className="bg-card rounded-xl border">
        <div className="p-4">
          <h2 className="font-semibold">Live punch activity</h2>
          <p className="text-muted-foreground text-sm">Today’s stamps for this company.</p>
        </div>
        {data.activity.length === 0 ? (
          <p className="text-muted-foreground px-4 pb-4 text-sm">No punches recorded today.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.activity.map((row) => (
                <TableRow key={row.employeeId}>
                  <TableCell>
                    <Link
                      to={`/admin/employees/${row.employeeId}`}
                      className="font-medium hover:underline"
                    >
                      {row.fullName}
                    </Link>
                    <p className="text-muted-foreground text-xs">
                      {row.employeeNumber} · {row.title}
                    </p>
                  </TableCell>
                  <TableCell>
                    {row.timeLabel} · {row.detail}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.direction === 'In' ? 'present' : 'off'}>
                      {row.direction}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  badge,
  tone = 'present',
}: {
  label: string;
  value: string;
  hint: string;
  badge: string;
  tone?: 'present' | 'late' | 'pending';
}) {
  return (
    <div className="bg-card space-y-2 rounded-xl border p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
        <Badge variant={tone}>{badge}</Badge>
      </div>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-muted-foreground text-xs">{hint}</p>
    </div>
  );
}
