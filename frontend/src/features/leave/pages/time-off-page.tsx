import { Link } from 'react-router';

import { PageTitle } from '@/components/page-title';
import { ProgressBar } from '@/components/progress-bar';
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
import { useHolidays } from '@/features/holidays/api/holidays-queries';
import { homeHref, parseIsoDate } from '@/lib/home-search';

import type { LeaveRequest } from '../api/leave-api';
import { useLeaveBalances, useLeaveRequests } from '../api/leave-queries';

export function TimeOffPage() {
  const balances = useLeaveBalances();
  const requests = useLeaveRequests();
  const holidays = useHolidays();

  if (balances.isPending || requests.isPending) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading time off</span>
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (balances.isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {balances.error.message}
      </p>
    );
  }

  if (requests.isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {requests.error.message}
      </p>
    );
  }

  const todayIso = holidays.data?.todayIso;
  const upcoming = (holidays.data?.holidays ?? [])
    .filter((day) => todayIso !== undefined && day.date >= todayIso)
    .sort((left, right) => left.date.localeCompare(right.date))[0];
  const upcomingDate = upcoming ? parseIsoDate(upcoming.date) : null;

  return (
    <div className="space-y-5">
      <PageTitle>Time off</PageTitle>

      {balances.data.length === 0 ? (
        <p className="text-muted-foreground text-sm">No leave balances yet.</p>
      ) : (
        <div className="bg-card flex overflow-hidden rounded-xl border">
          {balances.data.map((balance) => (
            <div key={balance.type} className="flex-1 border-r px-4 py-3.5 last:border-r-0">
              <p className="text-muted-foreground text-xs">{balance.type}</p>
              <p className="text-xl font-semibold tracking-tight">{balance.remaining}</p>
              <p className="text-muted-foreground text-xs">of {balance.total} · left</p>
              <ProgressBar
                className="mt-2"
                value={balance.total === 0 ? 0 : (balance.remaining / balance.total) * 100}
              />
            </div>
          ))}
        </div>
      )}

      {requests.data.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">No time-off requests yet.</p>
      ) : (
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-muted-foreground text-xs">Dates</TableHead>
                <TableHead className="text-muted-foreground text-xs">Type</TableHead>
                <TableHead className="text-muted-foreground text-xs">Days</TableHead>
                <TableHead className="text-muted-foreground text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.data.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <Link to={`/time-off/${request.id}`} className="hover:underline">
                      {request.datesLabel}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{request.type}</TableCell>
                  <TableCell>{request.days}</TableCell>
                  <TableCell>
                    <StatusBadge request={request} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {upcoming && upcomingDate ? (
        <div className="bg-card rounded-xl border shadow-sm">
          <div className="flex items-center gap-3 px-4 py-3">
            <Badge>Closed</Badge>
            <div className="flex-1">
              <p className="font-medium">Next closed day · {upcoming.date}</p>
              <p className="text-muted-foreground text-xs">{upcoming.detail}</p>
            </div>
            <Button variant="link" className="h-auto p-0 text-sm" asChild>
              <Link to={homeHref({ ...upcomingDate, sheet: null })}>Show on calendar</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatusBadge({ request }: { request: LeaveRequest }) {
  if (request.status === 'approved') {
    return <Badge variant="present">{request.statusLabel}</Badge>;
  }

  if (request.status === 'rejected' || request.status === 'cancelled') {
    return <Badge variant="rejected">{request.statusLabel}</Badge>;
  }

  return <Badge variant="late">{request.statusLabel}</Badge>;
}
