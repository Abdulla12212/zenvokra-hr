import { cn } from '@/lib/utils';
import type { LeaveBalance, LeaveRequest } from '@/lib/employee-app-types';

import {
  availableDays,
  leaveTitle,
  pendingDaysFor,
  percentOf,
  usedDays,
} from './employee-leave-format';

export function EmployeeLeaveBalanceCard({
  balance,
  requests,
}: {
  balance: LeaveBalance;
  requests: LeaveRequest[];
}) {
  const pending = pendingDaysFor(requests, balance.type);
  const used = usedDays(balance);
  const left = availableDays(balance.remaining, pending);
  const tone = cardTone(balance.type);

  return (
    <div className="border-outline-variant/30 bg-card flex flex-col justify-between gap-3 rounded-xl border p-4 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between gap-2">
        <span className="text-title-md font-semibold">{leaveTitle(balance.type)}</span>
        <span className={cn('text-label-xs rounded px-2 py-0.5 font-semibold', tone.chip)}>
          {left}d Left
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={cn('text-headline-lg font-bold', tone.number)}>{left}</span>
        <span className="text-muted-foreground text-body-sm">/ {balance.total} Total days</span>
      </div>
      <div className="bg-surface-high flex h-2 overflow-hidden rounded-full">
        <div
          className={cn('h-full', tone.used)}
          style={{ width: `${String(percentOf(used, balance.total))}%` }}
        />
        <div
          className={cn('h-full', tone.pending)}
          style={{ width: `${String(percentOf(pending, balance.total))}%` }}
        />
      </div>
      <div className="border-outline-variant/20 text-muted-foreground text-label-xs flex items-center justify-between border-t pt-1">
        <span>
          Used: <strong className="text-foreground">{used}d</strong>
        </span>
        <span>
          Pending:{' '}
          <strong className={pending > 0 ? 'text-warning' : 'text-foreground'}>{pending}d</strong>
        </span>
      </div>
    </div>
  );
}

function cardTone(type: string): {
  chip: string;
  number: string;
  used: string;
  pending: string;
} {
  if (type === 'Casual') {
    return {
      chip: 'bg-warning-muted text-warning',
      number: 'text-warning',
      used: 'bg-warning',
      pending: 'bg-warning-border',
    };
  }

  if (type === 'Sick') {
    return {
      chip: 'bg-success-muted text-success',
      number: 'text-success',
      used: 'bg-success',
      pending: 'bg-success-border',
    };
  }

  return {
    chip: 'bg-primary-fixed text-primary-deep',
    number: 'text-primary',
    used: 'bg-primary',
    pending: 'bg-primary/40',
  };
}
