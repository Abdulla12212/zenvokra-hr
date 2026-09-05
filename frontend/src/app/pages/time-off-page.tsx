import { Link } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/page-title';
import { ProgressBar } from '@/components/progress-bar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLeaveBalances, useLeaveRequests } from '@/features/leave/api/leave-queries';
import type { LeaveRequest } from '@/lib/employee-app-store';
import { homeHref } from '@/lib/home-search';

export function TimeOffPage() {
  const balances = useLeaveBalances();
  const requests = useLeaveRequests();

  if (balances.isPending || requests.isPending) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (balances.isError) {
    return (
      <p role="alert" className="text-destructive p-6 text-sm">
        {balances.error.message}
      </p>
    );
  }

  if (requests.isError) {
    return (
      <p role="alert" className="text-destructive p-6 text-sm">
        {requests.error.message}
      </p>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-5">
        <PageTitle>Time off</PageTitle>
      </div>

      <div className="bg-card mb-4 flex overflow-hidden rounded-xl border">
        {balances.data.map((balance) => (
          <div key={balance.type} className="flex-1 border-r px-4 py-3.5 last:border-r-0">
            <p className="text-muted-foreground text-xs">{balance.type}</p>
            <p className="text-xl font-semibold tracking-tight">{balance.remaining}</p>
            <p className="text-muted-foreground text-xs">
              of {balance.total} · left
            </p>
            <ProgressBar
              className="mt-2"
              value={(balance.remaining / balance.total) * 100}
            />
          </div>
        ))}
      </div>

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

      <div className="bg-card mt-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <Badge>Closed</Badge>
          <div className="flex-1">
            <p className="font-medium">Next closed day · 5 Sep</p>
            <p className="text-muted-foreground text-xs">Company Day · paid · not leave</p>
          </div>
          <Button variant="link" className="h-auto p-0 text-[13px]" asChild>
            <Link to={homeHref({ month: 'september', day: 5 })}>Show on calendar</Link>
          </Button>
        </div>
      </div>
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
