import { ChevronDown, History, ListChecks, Search } from 'lucide-react';

import { AdminFilterChip } from '@/app/layout/admin-filter-chip';
import { Input } from '@/components/ui/input';

export type ApprovalFilter = 'all' | 'punch' | 'leave' | 'resolved';

export function ApprovalToolbar({
  filter,
  pendingCount,
  pendingPunches,
  pendingLeaves,
  resolvedCount,
  query,
  visibleCount,
  onFilter,
  onQuery,
}: {
  filter: ApprovalFilter;
  pendingCount: number;
  pendingPunches: number;
  pendingLeaves: number;
  resolvedCount: number;
  query: string;
  visibleCount: number;
  onFilter: (filter: ApprovalFilter) => void;
  onQuery: (query: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-card flex flex-col justify-between gap-3 rounded-xl border p-3 shadow-sm lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 overflow-x-auto">
          <AdminFilterChip
            label="All Pending"
            count={pendingCount}
            active={filter === 'all'}
            filled
            onClick={() => onFilter('all')}
          />
          <AdminFilterChip
            label="Punches & Edits"
            count={pendingPunches}
            active={filter === 'punch'}
            filled
            onClick={() => onFilter('punch')}
          />
          <AdminFilterChip
            label="Time Off & Leaves"
            count={pendingLeaves}
            active={filter === 'leave'}
            filled
            onClick={() => onFilter('leave')}
          />
          <AdminFilterChip
            label="Resolved History"
            count={resolvedCount}
            active={filter === 'resolved'}
            filled
            countTone="plain"
            onClick={() => onFilter('resolved')}
          />
        </div>
        <div className="flex items-center gap-2.5 self-start lg:self-auto">
          <button
            type="button"
            className="border-outline-variant/30 bg-muted text-label-md inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 transition-colors"
          >
            <ListChecks
              className="text-muted-foreground size-[17px]"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            Approve All Selected
          </button>
          <button
            type="button"
            className="border-outline-variant/30 bg-muted text-label-md inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 transition-colors"
          >
            <History className="text-primary size-[17px]" strokeWidth={1.5} aria-hidden="true" />
            Audit Log
          </button>
        </div>
      </div>
      <div className="bg-card flex flex-col items-center justify-between gap-2.5 rounded-xl border px-3 py-2 sm:flex-row">
        <label className="relative w-full sm:w-80">
          <span className="sr-only">Filter requests or employee</span>
          <Search
            className="text-outline pointer-events-none absolute top-1/2 left-2.5 size-[18px] -translate-y-1/2"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            className="bg-muted h-8 rounded-lg pl-8"
            placeholder="Filter requests or employee..."
          />
        </label>
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
          <p className="text-outline text-label-xs">
            Showing <strong className="text-foreground">{visibleCount}</strong>{' '}
            {filter === 'resolved' ? 'history' : 'pending'} records
          </p>
          <div className="border-outline-variant/20 bg-muted text-muted-foreground flex items-center gap-1 rounded-lg border px-2 py-1">
            <span className="text-label-xs">Sort: Newest First</span>
            <ChevronDown className="text-outline size-4" strokeWidth={1.5} aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
