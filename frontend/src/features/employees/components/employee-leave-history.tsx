import { useState } from 'react';
import { History } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { LeaveRequest } from '@/lib/employee-app-types';

import type { LeaveHistoryFilter } from './employee-leave-format';
import { EmployeeLeaveHistoryRow } from './employee-leave-history-row';

export function EmployeeLeaveHistory({ requests }: { requests: LeaveRequest[] }) {
  const [filter, setFilter] = useState<LeaveHistoryFilter>('all');
  const pending = count(requests, 'pending');
  const approved = count(requests, 'approved');
  const rejected = count(requests, 'rejected');
  const visible =
    filter === 'all' ? requests : requests.filter((request) => request.status === filter);

  return (
    <div className="border-outline-variant/30 bg-card w-full flex-1 rounded-xl border p-5 shadow-sm">
      <div className="border-outline-variant/20 flex flex-col justify-between gap-3 border-b pb-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <History className="text-primary size-5" strokeWidth={1.5} aria-hidden="true" />
          <h3 className="text-title-md">Leave History & Upcoming Requests</h3>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <FilterChip
            active={filter === 'all'}
            label={`All (${String(requests.length)})`}
            onClick={() => setFilter('all')}
          />
          <FilterChip
            active={filter === 'pending'}
            label={`Pending (${String(pending)})`}
            tone="pending"
            onClick={() => setFilter('pending')}
          />
          <FilterChip
            active={filter === 'approved'}
            label={`Approved (${String(approved)})`}
            tone="approved"
            onClick={() => setFilter('approved')}
          />
          <FilterChip
            active={filter === 'rejected'}
            label={`Rejected (${String(rejected)})`}
            onClick={() => setFilter('rejected')}
          />
        </div>
      </div>
      {visible.length === 0 ? (
        <p className="text-muted-foreground text-body-sm py-6">No leave requests in this filter.</p>
      ) : (
        <div className="divide-outline-variant/20 divide-y">
          {visible.map((request) => (
            <EmployeeLeaveHistoryRow key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}

function count(requests: LeaveRequest[], status: LeaveRequest['status']): number {
  return requests.filter((request) => request.status === status).length;
}

function FilterChip({
  active,
  label,
  tone,
  onClick,
}: {
  active: boolean;
  label: string;
  tone?: 'pending' | 'approved';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-label-xs shrink-0 rounded-lg px-2.5 py-1 font-medium transition-colors',
        active && 'bg-surface-high text-foreground font-semibold',
        !active &&
          tone === 'pending' &&
          'bg-warning-muted text-warning border-warning-border border',
        !active && tone === 'approved' && 'bg-muted text-success',
        !active && tone === undefined && 'bg-muted text-outline',
      )}
    >
      {label}
    </button>
  );
}
