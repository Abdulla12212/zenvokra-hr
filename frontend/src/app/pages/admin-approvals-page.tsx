import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { PageTitle } from '@/components/page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { ApprovalItem } from '@/features/approvals/api/approvals-api';
import { useApprovals, useDecideApproval } from '@/features/approvals/api/approvals-queries';
import { dashboardKeys } from '@/features/dashboard/api/dashboard-queries';
import { initials } from '@/lib/initials';
import { cn } from '@/lib/utils';

type ApprovalFilter = 'all' | 'punch' | 'leave' | 'resolved';

export function AdminApprovalsPage() {
  const approvals = useApprovals();
  const decide = useDecideApproval();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ApprovalFilter>('all');

  const pending = useMemo(() => approvals.data?.pending ?? [], [approvals.data]);
  const resolved = useMemo(() => approvals.data?.resolved ?? [], [approvals.data]);
  const visible = useMemo(() => {
    if (filter === 'resolved') {
      return resolved;
    }

    if (filter === 'all') {
      return pending;
    }

    return pending.filter((item) => item.kind === filter);
  }, [filter, pending, resolved]);

  if (approvals.isPending) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (approvals.isError) {
    return (
      <p role="alert" className="text-destructive p-6 text-sm">
        {approvals.error.message}
      </p>
    );
  }

  const data = approvals.data;

  async function onDecide(item: ApprovalItem, decision: 'approve' | 'reject') {
    await decide.mutateAsync({
      approvalId: item.id,
      kind: item.kind,
      decision,
      note: '',
    });
    await queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
  }

  return (
    <div className="space-y-4 p-6">
      <p className="text-muted-foreground text-xs">Home / Approvals</p>
      <div>
        <PageTitle>Approvals</PageTitle>
        <p className="text-muted-foreground text-sm">
          Review, grant, or decline employee requests for this tenant.
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        <FilterChip
          label={`All pending (${String(pending.length)})`}
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        <FilterChip
          label={`Punches & edits (${String(data.pendingPunches)})`}
          active={filter === 'punch'}
          onClick={() => setFilter('punch')}
        />
        <FilterChip
          label={`Time off & leaves (${String(data.pendingLeaves)})`}
          active={filter === 'leave'}
          onClick={() => setFilter('leave')}
        />
        <FilterChip
          label={`Resolved (${String(resolved.length)})`}
          active={filter === 'resolved'}
          onClick={() => setFilter('resolved')}
        />
      </div>

      {visible.length === 0 ? (
        <p className="text-muted-foreground py-10 text-center text-sm">
          {filter === 'resolved' ? 'No recently decided requests.' : 'Nothing waiting on a decision.'}
        </p>
      ) : (
        visible.map((item) => (
          <ApprovalCard
            key={item.id}
            item={item}
            busy={decide.isPending}
            onDecide={onDecide}
          />
        ))
      )}

      {filter !== 'resolved' && resolved.length > 0 ? (
        <div className="space-y-2">
          <strong>Recently processed</strong>
          <div className="grid gap-3 md:grid-cols-3">
            {resolved.slice(0, 6).map((item) => (
              <div key={item.id} className="bg-card rounded-xl border p-4 shadow-sm">
                <p className="font-medium">{item.employeeName}</p>
                <p
                  className={cn(
                    'text-xs',
                    item.status === 'rejected' ? 'text-destructive' : 'text-muted-foreground',
                  )}
                >
                  {item.summary} · {item.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ApprovalCard({
  item,
  busy,
  onDecide,
}: {
  item: ApprovalItem;
  busy: boolean;
  onDecide: (item: ApprovalItem, decision: 'approve' | 'reject') => Promise<void>;
}) {
  const pending = item.status === 'pending';

  return (
    <div className="bg-card space-y-3 rounded-xl border p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="bg-muted grid size-10 place-items-center rounded-full text-xs font-semibold">
            {initials(item.employeeName)}
          </div>
          <div>
            <p className="font-semibold">{item.employeeName}</p>
            <p className="text-muted-foreground text-xs">
              {item.employeeNumber} · {item.title} · {item.location}
            </p>
          </div>
        </div>
        <Badge variant={item.kind === 'punch' ? 'pending' : 'late'}>
          {item.kind === 'punch' ? 'Punch rectification' : item.summary}
        </Badge>
      </div>
      <p className="text-muted-foreground text-xs">{item.sentLabel}</p>
      {item.kind === 'punch' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs">Recorded time</p>
            <p className="text-lg font-semibold">{item.recordedLabel}</p>
            <p className="text-destructive text-xs">Late stamp recorded</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground text-xs">Requested correction</p>
            <p className="text-primary text-lg font-semibold">{item.requestedLabel}</p>
            <p className="text-primary text-xs">On-time adjustment</p>
          </div>
        </div>
      ) : (
        <p className="text-sm">{item.detail}</p>
      )}
      {item.note ? (
        <div className="bg-muted rounded-lg p-3 text-sm">{item.note}</div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          Manager endorsement ·{' '}
          <b className={item.managerVerified ? 'text-[color-mix(in_oklch,var(--success)_70%,var(--foreground))]' : undefined}>
            {item.managerVerified ? 'Verified' : 'Not verified'}
          </b>
        </p>
        {pending ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => {
                void onDecide(item, 'reject');
              }}
            >
              Reject
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => {
                void onDecide(item, 'approve');
              }}
            >
              Approve
            </Button>
          </div>
        ) : (
          <Badge variant={item.status === 'approved' ? 'present' : 'rejected'}>{item.status}</Badge>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md border px-2.5 py-1 text-xs font-medium',
        active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground',
      )}
    >
      {label}
    </button>
  );
}
