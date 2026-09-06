import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';

import { PageTitle } from '@/components/page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApprovals, useDecideApproval } from '@/features/approvals/api/approvals-queries';
import { dashboardKeys, useDashboard } from '@/features/dashboard/api/dashboard-queries';
import { initials } from '@/lib/initials';
import { cn } from '@/lib/utils';

export function AdminDashboardPage() {
  const dashboard = useDashboard();
  const approvals = useApprovals();
  const decide = useDecideApproval();
  const queryClient = useQueryClient();

  if (dashboard.isPending) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (dashboard.isError) {
    return (
      <p role="alert" className="text-destructive p-6 text-sm">
        {dashboard.error.message}
      </p>
    );
  }

  const data = dashboard.data;
  const presencePct =
    data.headcount === 0 ? 0 : Math.round((data.present / data.headcount) * 1000) / 10;
  const firstPending = approvals.data?.pending[0];
  const hqPresent = Math.max(0, data.present - data.remote);

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground mb-1 text-xs">Home / Dashboard</p>
          <PageTitle>Dashboard</PageTitle>
          <p className="text-muted-foreground text-sm">
            Presence, exceptions, and requests that need a decision today.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/employees">+ Add employee</Link>
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="On duty presence"
          value={`${String(data.present)} / ${String(data.headcount)}`}
          hint={`${String(hqPresent)} Dhaka HQ · ${String(data.remote)} Remote`}
          badge={`${String(presencePct)}%`}
          tone="ok"
        />
        <StatCard
          label="Pending approvals"
          value={String(data.pendingApprovals)}
          hint={`${String(data.pendingPunches)} Punches · ${String(data.pendingLeaves)} Leaves`}
          badge={data.pendingApprovals > 0 ? 'Action needed' : 'Clear'}
          tone={data.pendingApprovals > 0 ? 'alert' : 'ok'}
        />
        <StatCard
          label="Late today"
          value={String(data.lateToday)}
          hint={`>15m grace · avg ${data.averageLatenessLabel}`}
          badge={data.lateToday > 0 ? 'Attention' : 'On time'}
          tone={data.lateToday > 0 ? 'warn' : 'ok'}
        />
        <StatCard
          label="On leave / off"
          value={String(data.onLeave)}
          hint={`${String(data.annualOnLeave)} Annual · ${String(data.sickOnLeave)} Medical`}
          badge="Scheduled"
          tone="info"
        />
      </div>

      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <strong>Pending approvals</strong>
              {data.pendingApprovals > 0 ? (
                <Badge variant="rejected">{data.pendingApprovals} due</Badge>
              ) : null}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {data.pendingApprovals} requests requiring review · {data.pendingPunches} late punches
              · {data.pendingLeaves} leaves
            </p>
          </div>
          <Button variant="link" className="h-auto p-0" asChild>
            <Link to="/admin/approvals">View all {data.pendingApprovals} →</Link>
          </Button>
        </div>
        {firstPending ? (
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="bg-muted grid size-8 place-items-center rounded-full text-xs font-semibold">
              {initials(firstPending.employeeName)}
            </div>
            <div className="mr-auto">
              <p className="text-sm font-medium">{firstPending.employeeName}</p>
              <p className="text-muted-foreground text-xs">{firstPending.summary}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={decide.isPending}
              onClick={() => {
                void decide
                  .mutateAsync({
                    approvalId: firstPending.id,
                    kind: firstPending.kind,
                    decision: 'reject',
                    note: '',
                  })
                  .then(async () => {
                    await queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
                  });
              }}
            >
              Decline
            </Button>
            <Button
              size="sm"
              disabled={decide.isPending}
              onClick={() => {
                void decide
                  .mutateAsync({
                    approvalId: firstPending.id,
                    kind: firstPending.kind,
                    decision: 'approve',
                    note: '',
                  })
                  .then(async () => {
                    await queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
                  });
              }}
            >
              Grant
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Nothing waiting on a decision.</p>
        )}
      </div>

      <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <strong>Live punch activity</strong>
            <p className="text-muted-foreground text-xs">Today’s stamps for Acme Consulting</p>
          </div>
        </div>
        {data.activity.length === 0 ? (
          <p className="text-muted-foreground px-4 pb-4 text-sm">No stamps recorded today.</p>
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
                    <div className="flex items-center gap-2">
                      <div className="bg-muted grid size-8 place-items-center rounded-full text-xs font-semibold">
                        {initials(row.fullName)}
                      </div>
                      <div>
                        <p className="font-medium">{row.fullName}</p>
                        <p className="text-muted-foreground text-xs">
                          {row.employeeNumber} · {row.title}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.timeLabel} ·{' '}
                    <span
                      className={cn(
                        row.detail.includes('late') && 'text-destructive',
                        row.detail === 'On-time' &&
                          'text-[color-mix(in_oklch,var(--success)_70%,var(--foreground))]',
                      )}
                    >
                      {row.detail}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.direction === 'In' ? 'present' : 'off'}>{row.direction}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  badge,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  badge: string;
  tone: 'ok' | 'alert' | 'warn' | 'info';
}) {
  const variant =
    tone === 'ok' ? 'present' : tone === 'alert' ? 'rejected' : tone === 'warn' ? 'late' : 'pending';

  return (
    <div className="bg-card rounded-xl border p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
        <Badge variant={variant}>{badge}</Badge>
      </div>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
    </div>
  );
}
