import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { AdminBreadcrumb } from '@/app/layout/admin-breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import type { ApprovalItem } from '@/features/approvals/api/approvals-api';
import { useApprovals, useDecideApproval } from '@/features/approvals/api/approvals-queries';
import { ApprovalDrawer } from '@/features/approvals/components/approval-drawer';
import { ApprovalHistoryStrip } from '@/features/approvals/components/approval-history-strip';
import { ApprovalRow } from '@/features/approvals/components/approval-row';
import {
  ApprovalToolbar,
  type ApprovalFilter,
} from '@/features/approvals/components/approval-toolbar';
import { dashboardKeys } from '@/features/dashboard/api/dashboard-queries';

export function AdminApprovalsPage() {
  const approvals = useApprovals();
  const decide = useDecideApproval();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ApprovalFilter>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(true);

  const pending = useMemo(() => approvals.data?.pending ?? [], [approvals.data]);
  const resolved = useMemo(() => approvals.data?.resolved ?? [], [approvals.data]);
  const visible = useMemo(() => {
    const source =
      filter === 'resolved'
        ? resolved
        : filter === 'all'
          ? pending
          : pending.filter((item) => item.kind === filter);
    const term = query.trim().toLowerCase();
    if (term.length === 0) {
      return source;
    }

    return source.filter(
      (item) =>
        item.employeeName.toLowerCase().includes(term) ||
        item.employeeNumber.toLowerCase().includes(term) ||
        item.summary.toLowerCase().includes(term),
    );
  }, [filter, pending, query, resolved]);

  const selected =
    visible.find((item) => item.id === selectedId) ??
    (filter === 'resolved' ? undefined : visible[0]);

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
    setSelectedId(null);
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 pb-8 md:px-6">
      <div className="flex items-center justify-between gap-2">
        <AdminBreadcrumb items={[{ label: 'Approvals', heading: true }]} />
        <span className="text-outline text-label-xs flex items-center gap-2">
          <span className="bg-success size-2 animate-pulse rounded-full" aria-hidden="true" />
          Live Syncing
        </span>
      </div>

      <ApprovalToolbar
        filter={filter}
        pendingCount={pending.length}
        pendingPunches={data.pendingPunches}
        pendingLeaves={data.pendingLeaves}
        resolvedCount={resolved.length}
        query={query}
        visibleCount={visible.length}
        onFilter={setFilter}
        onQuery={setQuery}
      />

      <div className="relative flex min-h-[580px] flex-col items-stretch gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-2 transition-all duration-300">
          <div className="bg-muted/60 text-outline text-label-xs hidden grid-cols-12 gap-3 rounded-lg border px-4 py-2 font-semibold tracking-wider uppercase md:grid">
            <div className="col-span-4">Employee & Dept</div>
            <div className="col-span-2">Request Type</div>
            <div className="col-span-4">Summary & Timestamps</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {visible.length === 0 ? (
            <p className="text-muted-foreground py-10 text-center text-sm">
              {filter === 'resolved'
                ? 'No recently decided requests.'
                : 'Nothing waiting on a decision.'}
            </p>
          ) : (
            visible.map((item) => (
              <ApprovalRow
                key={item.id}
                item={item}
                selected={selected?.id === item.id}
                busy={decide.isPending}
                onSelect={() => {
                  setSelectedId(item.id);
                  setDrawerOpen(true);
                }}
                onDecide={onDecide}
              />
            ))
          )}
        </div>

        {selected && drawerOpen && filter !== 'resolved' ? (
          <ApprovalDrawer
            item={selected}
            busy={decide.isPending}
            onClose={() => setDrawerOpen(false)}
            onDecide={onDecide}
          />
        ) : null}
      </div>

      {filter !== 'resolved' && resolved.length > 0 ? (
        <ApprovalHistoryStrip items={resolved} onViewAll={() => setFilter('resolved')} />
      ) : null}
    </div>
  );
}
