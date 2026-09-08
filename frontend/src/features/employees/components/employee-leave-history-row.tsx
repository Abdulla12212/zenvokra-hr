import { CalendarX, CheckCircle, Clock, HeartPulse, House, Plane } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { LeaveRequest } from '@/lib/employee-app-types';

import { daysLabel, leaveTitle, requestFootnote } from './employee-leave-format';

export function EmployeeLeaveHistoryRow({ request }: { request: LeaveRequest }) {
  const footnote = requestFootnote(request);

  return (
    <div className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center">
      <div className="flex items-start gap-3.5">
        <div
          className={cn(
            'mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl',
            iconWrap(request),
          )}
        >
          <RowGlyph request={request} />
        </div>
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-body-md font-semibold">{request.datesLabel}</span>
            <span
              className={cn(
                'text-label-xs rounded px-2 py-0.5 font-semibold',
                typeChip(request.type),
              )}
            >
              {leaveTitle(request.type)}
            </span>
            <span className="text-muted-foreground text-label-xs">{daysLabel(request.days)}</span>
          </div>
          {request.note.length > 0 ? (
            <p className="text-muted-foreground text-body-sm mt-0.5">{request.note}</p>
          ) : null}
          {footnote.length > 0 ? (
            <span className="text-outline text-label-xs mt-0.5">{footnote}</span>
          ) : null}
        </div>
      </div>
      <StatusPill status={request.status} />
    </div>
  );
}

function StatusPill({ status }: { status: LeaveRequest['status'] }) {
  if (status === 'pending') {
    return (
      <span className="bg-warning-muted text-warning border-warning-border text-label-xs inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-semibold">
        <Clock className="size-[13px]" strokeWidth={1.5} aria-hidden="true" />
        Pending
      </span>
    );
  }

  if (status === 'approved') {
    return (
      <span className="bg-success-muted text-success text-label-xs inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold">
        <CheckCircle className="size-[13px]" strokeWidth={1.5} aria-hidden="true" />
        Approved
      </span>
    );
  }

  if (status === 'rejected') {
    return (
      <span className="bg-destructive-muted text-destructive text-label-xs inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold">
        <CalendarX className="size-[13px]" strokeWidth={1.5} aria-hidden="true" />
        Rejected
      </span>
    );
  }

  return (
    <span className="bg-muted text-muted-foreground text-label-xs rounded-full px-2.5 py-1 font-semibold">
      {status}
    </span>
  );
}

function RowGlyph({ request }: { request: LeaveRequest }) {
  const className = 'size-5';
  if (request.status === 'rejected') {
    return <CalendarX className={className} strokeWidth={1.5} aria-hidden="true" />;
  }
  if (request.type === 'Casual') {
    return <House className={className} strokeWidth={1.5} aria-hidden="true" />;
  }
  if (request.type === 'Sick') {
    return <HeartPulse className={className} strokeWidth={1.5} aria-hidden="true" />;
  }
  return <Plane className={className} strokeWidth={1.5} aria-hidden="true" />;
}

function iconWrap(request: LeaveRequest): string {
  if (request.status === 'rejected') return 'bg-surface-high text-destructive';
  if (request.type === 'Casual') return 'bg-warning-muted text-warning';
  if (request.type === 'Sick') return 'bg-success-muted text-success';
  return 'bg-primary-fixed text-primary';
}

function typeChip(type: string): string {
  if (type === 'Casual') return 'bg-warning-muted text-warning';
  if (type === 'Sick') return 'bg-success-muted text-success';
  return 'bg-primary-fixed text-primary-deep';
}
