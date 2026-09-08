import { useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Bell, CalendarOff, Clock, Filter, History, LogIn, LogOut, Users } from 'lucide-react';
import { Link } from 'react-router';

import { AdminAddEmployeeButton } from '@/app/layout/admin-add-employee-button';
import { AdminBreadcrumb } from '@/app/layout/admin-breadcrumb';
import { AdminInitials } from '@/app/layout/admin-initials';
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
import type { ApprovalItem } from '@/features/approvals/api/approvals-api';
import { useApprovals, useDecideApproval } from '@/features/approvals/api/approvals-queries';
import { dashboardKeys, useDashboard } from '@/features/dashboard/api/dashboard-queries';
import { demoSession } from '@/lib/demo-session';
import { cn } from '@/lib/utils';

export function AdminDashboardPage() {
  const dashboard = useDashboard();
  const approvals = useApprovals();
  const [exceptionsOnly, setExceptionsOnly] = useState(false);

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
  const hqPresent = Math.max(0, data.present - data.remote);
  const pending = approvals.data?.pending ?? [];
  const exceptionCount = data.activity.filter((row) =>
    row.detail.toLowerCase().includes('late'),
  ).length;
  const rows = exceptionsOnly
    ? data.activity.filter((row) => row.detail.toLowerCase().includes('late'))
    : data.activity;

  return (
    <div className="flex flex-col gap-6 px-4 py-4 pb-12 md:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <AdminBreadcrumb items={[{ label: 'Dashboard', heading: true }]} badge="Overview" />
        <AdminAddEmployeeButton compact />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="On duty presence"
          value={
            <>
              {data.present}{' '}
              <span className="text-headline-sm text-outline font-normal">/ {data.headcount}</span>
            </>
          }
          hint={`${String(hqPresent)} Dhaka HQ · ${String(data.remote)} Remote`}
          badge={`${String(presencePct)}% Optimal`}
          tone="ok"
          icon={Users}
        />
        <StatCard
          label="Pending approvals"
          value={
            <span className={data.pendingApprovals > 0 ? 'text-destructive' : undefined}>
              {data.pendingApprovals}
              <span className="text-title-md font-medium"> Requests</span>
            </span>
          }
          hint={`${String(data.pendingPunches)} Punches · ${String(data.pendingLeaves)} Leaves`}
          badge={data.pendingApprovals > 0 ? 'Action Needed' : 'Clear'}
          tone={data.pendingApprovals > 0 ? 'alert' : 'ok'}
          icon={Bell}
        />
        <StatCard
          label="Late today"
          value={
            <>
              <span className={data.lateToday > 0 ? 'text-warning' : undefined}>
                {data.lateToday}
              </span>
              <span className="text-muted-foreground text-body-sm ml-2 font-normal">
                &gt;15m grace
              </span>
            </>
          }
          hint={`Avg tardiness: ${data.averageLatenessLabel}`}
          badge={data.lateToday > 0 ? 'Attention' : 'On time'}
          tone={data.lateToday > 0 ? 'warn' : 'ok'}
          icon={Clock}
        />
        <StatCard
          label="On leave / off"
          value={
            <>
              {data.onLeave} <span className="text-title-md text-outline font-normal">Staff</span>
            </>
          }
          hint={`${String(data.annualOnLeave)} Annual · ${String(data.sickOnLeave)} Medical`}
          badge="Scheduled"
          tone="info"
          icon={CalendarOff}
        />
      </div>

      <PendingApprovalsStrip
        pending={pending}
        total={data.pendingApprovals}
        punches={data.pendingPunches}
        leaves={data.pendingLeaves}
      />

      <div className="bg-card flex flex-col overflow-hidden rounded-xl border shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <History
              className="text-primary-deep size-[22px]"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <div>
              <h2 className="text-title-md font-semibold">Live punch activity</h2>
              <p className="text-body-sm text-outline">
                Real-time terminal telemetry and biometric events flagged for today
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-muted text-label-xs flex items-center rounded-lg border p-0.5">
              <button
                type="button"
                className={cn(
                  'rounded-md px-2.5 py-1',
                  !exceptionsOnly
                    ? 'bg-card text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground',
                )}
                onClick={() => setExceptionsOnly(false)}
              >
                All Activity
              </button>
              <button
                type="button"
                className={cn(
                  'rounded-md px-2.5 py-1',
                  exceptionsOnly
                    ? 'bg-card text-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground',
                )}
                onClick={() => setExceptionsOnly(true)}
              >
                Exceptions Only ({exceptionCount})
              </button>
            </div>
            <button
              type="button"
              className="text-muted-foreground hover:bg-muted rounded-lg border p-1.5"
              aria-label="Filter list"
            >
              <Filter className="text-outline size-4" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        </div>
        {rows.length === 0 ? (
          <p className="text-muted-foreground px-4 py-6 text-sm">No stamps recorded today.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="px-4">Employee</TableHead>
                <TableHead className="px-4">Time</TableHead>
                <TableHead className="px-4 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.employeeId}>
                  <TableCell className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <AdminInitials name={row.fullName} />
                      <div className="min-w-0">
                        <p className="text-body-md truncate font-semibold">{row.fullName}</p>
                        <p className="text-label-xs text-outline">
                          {row.employeeNumber} · {row.title}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <p className="text-body-md font-medium">{row.timeLabel}</p>
                    <p
                      className={cn(
                        'text-label-xs',
                        row.detail.toLowerCase().includes('late') && 'text-warning',
                        row.detail === 'On-time' && 'text-success',
                        !row.detail.toLowerCase().includes('late') &&
                          row.detail !== 'On-time' &&
                          'text-outline',
                      )}
                    >
                      {row.detail}
                    </p>
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-right">
                    <Badge variant={row.direction === 'In' ? 'present' : 'off'} className="gap-1">
                      {row.direction === 'In' ? (
                        <LogIn className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                      ) : (
                        <LogOut className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                      )}
                      {row.direction}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="bg-muted/50 text-outline text-body-sm flex items-center justify-between border-t p-3">
          <span>
            Showing {rows.length} of {data.headcount} punch records for {demoSession.clockLabel}
          </span>
          <Link to="/admin/employees" className="text-primary font-semibold">
            View Full Audit Punch Log →
          </Link>
        </div>
      </div>
    </div>
  );
}

function PendingApprovalsStrip({
  pending,
  total,
  punches,
  leaves,
}: {
  pending: ApprovalItem[];
  total: number;
  punches: number;
  leaves: number;
}) {
  const decide = useDecideApproval();
  const queryClient = useQueryClient();

  return (
    <div className="border-warning/40 from-warning/5 bg-card flex flex-col justify-between gap-3 rounded-xl border bg-gradient-to-r p-3 shadow-sm lg:flex-row lg:items-center">
      <div className="flex min-w-max items-center gap-3">
        <div className="bg-warning/20 text-warning grid size-8 place-items-center rounded-lg">
          <Bell className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <strong className="text-title-md">Pending approvals</strong>
            {total > 0 ? (
              <Badge
                variant="rejected"
                className="bg-destructive text-primary-foreground border-transparent font-bold"
              >
                {total} Due
              </Badge>
            ) : null}
          </div>
          <p className="text-body-sm text-outline">
            {total} requests requiring administrative review · {punches} Late Punches · {leaves}{' '}
            Leaves
          </p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-start gap-2.5 overflow-x-auto lg:justify-end">
        {pending.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing waiting on a decision.</p>
        ) : (
          pending.map((item) => (
            <PendingChip
              key={item.id}
              item={item}
              busy={decide.isPending}
              onDecide={(decision) => {
                void decide
                  .mutateAsync({
                    approvalId: item.id,
                    kind: item.kind,
                    decision,
                    note: '',
                  })
                  .then(async () => {
                    await queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
                  });
              }}
            />
          ))
        )}
        <Button variant="link" className="text-label-xs h-auto shrink-0 p-0 font-semibold" asChild>
          <Link to="/admin/approvals">View All {total} →</Link>
        </Button>
      </div>
    </div>
  );
}

function PendingChip({
  item,
  busy,
  onDecide,
}: {
  item: ApprovalItem;
  busy: boolean;
  onDecide: (decision: 'approve' | 'reject') => void;
}) {
  const isLeave = item.kind === 'leave';

  return (
    <div className="bg-muted/70 flex shrink-0 items-center gap-2 rounded-lg border px-2.5 py-1.5">
      <AdminInitials name={item.employeeName} size="sm" />
      <div className="min-w-0 pr-1">
        <p className="text-label-xs max-w-[120px] truncate font-semibold">{item.employeeName}</p>
        <p className={cn('text-micro font-medium', isLeave ? 'text-primary' : 'text-warning')}>
          {item.summary}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={busy}
          className="bg-primary text-primary-foreground hover:bg-primary/90 text-label-xs rounded-sm px-2 py-0.5 font-semibold"
          onClick={() => onDecide('approve')}
        >
          {isLeave ? 'Grant' : 'Approve'}
        </button>
        <button
          type="button"
          disabled={busy}
          className="bg-card text-destructive hover:bg-destructive/10 text-label-xs rounded-sm border px-2 py-0.5 font-semibold"
          onClick={() => onDecide('reject')}
        >
          {isLeave ? 'Decline' : 'Reject'}
        </button>
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
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  hint: string;
  badge: string;
  tone: 'ok' | 'alert' | 'warn' | 'info';
  icon: typeof Users;
}) {
  const variant =
    tone === 'ok'
      ? 'present'
      : tone === 'alert'
        ? 'rejected'
        : tone === 'warn'
          ? 'late'
          : 'pending';
  const iconClass =
    tone === 'ok'
      ? 'text-success'
      : tone === 'alert'
        ? 'text-destructive'
        : tone === 'warn'
          ? 'text-warning'
          : 'text-primary-deep';

  return (
    <div className="bg-card flex flex-col justify-between rounded-xl border p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-label-xs text-outline font-semibold tracking-wider uppercase">
            {label}
          </p>
          <p className="text-display-lg mt-1 font-bold">{value}</p>
        </div>
        <Badge variant={variant}>{badge}</Badge>
      </div>
      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <span className="text-body-sm text-muted-foreground">{hint}</span>
        <Icon className={cn('size-[18px]', iconClass)} strokeWidth={1.5} aria-hidden="true" />
      </div>
    </div>
  );
}
