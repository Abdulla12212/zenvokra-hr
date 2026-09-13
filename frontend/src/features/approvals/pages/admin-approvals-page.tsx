import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import type { ApprovalItem } from '../api/approvals-api';
import { useApprovals, useDecideApproval } from '../api/approvals-queries';
import { ApprovalCard } from '../components/approval-card';

type ApprovalFilter = 'all' | 'leave' | 'punch' | 'resolved';

export function AdminApprovalsPage() {
  const { data, isPending, isError, error } = useApprovals();
  const decide = useDecideApproval();
  const [filter, setFilter] = useState<ApprovalFilter>('all');

  if (isPending) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading approvals</span>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
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

  const items = visibleItems(data.pending, data.resolved, filter);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
        <p className="text-muted-foreground text-sm">
          Review, grant, or decline employee requests for this company.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <FilterButton
          current={filter}
          value="all"
          label={`All pending (${String(data.pending.length)})`}
          onSelect={setFilter}
        />
        <FilterButton
          current={filter}
          value="punch"
          label={`Punches (${String(data.pendingPunches)})`}
          onSelect={setFilter}
        />
        <FilterButton
          current={filter}
          value="leave"
          label={`Time off (${String(data.pendingLeaves)})`}
          onSelect={setFilter}
        />
        <FilterButton
          current={filter}
          value="resolved"
          label={`Resolved (${String(data.resolved.length)})`}
          onSelect={setFilter}
        />
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          {filter === 'resolved'
            ? 'No recently decided requests.'
            : 'Nothing waiting for a decision.'}
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <ApprovalCard
              key={item.id}
              item={item}
              busy={decide.isPending}
              onDecide={(decision) => {
                void decide.mutateAsync({ id: item.id, kind: item.kind, decision });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function visibleItems(
  pending: ApprovalItem[],
  resolved: ApprovalItem[],
  filter: ApprovalFilter,
): ApprovalItem[] {
  if (filter === 'resolved') {
    return resolved;
  }

  if (filter === 'all') {
    return pending;
  }

  return pending.filter((item) => item.kind === filter);
}

function FilterButton({
  current,
  value,
  label,
  onSelect,
}: {
  current: ApprovalFilter;
  value: ApprovalFilter;
  label: string;
  onSelect: (value: ApprovalFilter) => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={current === value ? 'default' : 'outline'}
      onClick={() => {
        onSelect(value);
      }}
    >
      {label}
    </Button>
  );
}
