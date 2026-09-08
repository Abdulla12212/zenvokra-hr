import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, History, Search, X } from 'lucide-react';

import { AdminBreadcrumb } from '@/app/layout/admin-breadcrumb';
import { AdminFilterChip } from '@/app/layout/admin-filter-chip';
import { AdminInitials } from '@/app/layout/admin-initials';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { ApprovalItem } from '@/features/approvals/api/approvals-api';
import { useApprovals, useDecideApproval } from '@/features/approvals/api/approvals-queries';
import { dashboardKeys } from '@/features/dashboard/api/dashboard-queries';
import { cn } from '@/lib/utils';

type ApprovalFilter = 'all' | 'punch' | 'leave' | 'resolved';

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
          <span className="bg-success size-2 rounded-full" aria-hidden="true" />
          Live Syncing
        </span>
      </div>

      <div className="bg-card flex flex-col justify-between gap-3 rounded-xl border p-3 shadow-sm lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 overflow-x-auto">
          <AdminFilterChip
            label="All Pending"
            count={pending.length}
            active={filter === 'all'}
            filled
            onClick={() => setFilter('all')}
          />
          <AdminFilterChip
            label="Punches & Edits"
            count={data.pendingPunches}
            active={filter === 'punch'}
            filled
            onClick={() => setFilter('punch')}
          />
          <AdminFilterChip
            label="Time Off & Leaves"
            count={data.pendingLeaves}
            active={filter === 'leave'}
            filled
            onClick={() => setFilter('leave')}
          />
          <AdminFilterChip
            label="Resolved History"
            count={resolved.length}
            active={filter === 'resolved'}
            filled
            onClick={() => setFilter('resolved')}
          />
        </div>
        <div className="flex items-center gap-2.5">
          <Button type="button" variant="outline" size="sm" className="text-label-md rounded-lg">
            Approve All Selected
          </Button>
          <Button type="button" variant="outline" size="sm" className="text-label-md rounded-lg">
            <History className="text-outline size-4" strokeWidth={1.5} aria-hidden="true" />
            Audit Log
          </Button>
        </div>
      </div>

      <div className="bg-card flex flex-col items-center justify-between gap-2.5 rounded-xl border px-3 py-2 sm:flex-row">
        <label className="relative w-full sm:w-80">
          <span className="sr-only">Filter requests or employee</span>
          <Search
            className="text-outline pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="bg-muted h-8 rounded-lg pl-8"
            placeholder="Filter requests or employee..."
          />
        </label>
        <p className="text-outline text-label-xs">
          Showing <strong className="text-foreground">{visible.length}</strong>{' '}
          {filter === 'resolved' ? 'history' : 'pending'} records
        </p>
      </div>

      <div className="relative flex min-h-[420px] flex-col items-stretch gap-4 xl:flex-row xl:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
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
        <div className="bg-card flex flex-col gap-3 rounded-xl border p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History
                className="text-primary-deep size-[18px]"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <strong className="text-title-md">Recently Processed Approvals</strong>
            </div>
            <button
              type="button"
              className="text-primary text-label-xs font-semibold hover:underline"
              onClick={() => setFilter('resolved')}
            >
              View all {resolved.length} history records
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {resolved.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="bg-muted flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <AdminInitials name={item.employeeName} size="sm" />
                  <div className="min-w-0">
                    <p className="text-body-sm truncate font-semibold">{item.employeeName}</p>
                    <p
                      className={cn(
                        'text-label-xs truncate',
                        item.status === 'rejected' ? 'text-destructive' : 'text-outline',
                      )}
                    >
                      {item.summary} · {item.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ApprovalRow({
  item,
  selected,
  busy,
  onSelect,
  onDecide,
}: {
  item: ApprovalItem;
  selected: boolean;
  busy: boolean;
  onSelect: () => void;
  onDecide: (item: ApprovalItem, decision: 'approve' | 'reject') => Promise<void>;
}) {
  return (
    <div
      className={cn(
        'bg-card group flex cursor-pointer flex-col gap-3 rounded-xl border p-3.5 shadow-sm transition-all md:grid md:grid-cols-12 md:items-center',
        selected ? 'border-primary ring-primary ring-1' : 'hover:bg-muted/50',
      )}
    >
      <button
        type="button"
        className="col-span-4 flex min-w-0 items-center gap-3 text-left"
        onClick={onSelect}
      >
        <AdminInitials name={item.employeeName} size="lg" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-title-md truncate font-semibold">{item.employeeName}</span>
            <span className="bg-muted text-muted-foreground text-label-xs rounded px-1.5">
              {item.employeeNumber}
            </span>
          </div>
          <p className="text-outline text-label-xs truncate">
            {item.title} · {item.location}
          </p>
        </div>
      </button>
      <div className="col-span-2 flex items-center">
        <Badge
          variant={
            item.kind === 'punch'
              ? 'pending'
              : item.summary.toLowerCase().includes('sick')
                ? 'rejected'
                : 'late'
          }
        >
          {item.kind === 'punch' ? 'Late Punch Fix' : item.summary}
        </Badge>
      </div>
      <button type="button" className="col-span-4 min-w-0 text-left" onClick={onSelect}>
        {item.kind === 'punch' ? (
          <p className="text-label-xs">
            <span className="text-primary font-semibold">Req: {item.requestedLabel}</span>
            <span className="text-outline"> vs </span>
            <span className="text-destructive font-medium">Sys: {item.recordedLabel}</span>
          </p>
        ) : (
          <p className="text-label-xs font-semibold">{item.detail}</p>
        )}
        <p className="text-outline text-label-xs mt-0.5 truncate">{item.sentLabel}</p>
      </button>
      <div className="col-span-2 flex items-center justify-end gap-1.5">
        {item.status === 'pending' ? (
          <>
            <button
              type="button"
              title="Quick Reject"
              disabled={busy}
              className="bg-muted text-destructive hover:bg-destructive/10 grid size-7 place-items-center rounded-lg"
              onClick={() => {
                void onDecide(item, 'reject');
              }}
            >
              <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
            </button>
            <button
              type="button"
              title="Quick Approve"
              disabled={busy}
              className="bg-muted text-success hover:bg-success/10 grid size-7 place-items-center rounded-lg"
              onClick={() => {
                void onDecide(item, 'approve');
              }}
            >
              <Check className="size-4" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </>
        ) : (
          <Badge variant={item.status === 'approved' ? 'present' : 'rejected'}>{item.status}</Badge>
        )}
      </div>
    </div>
  );
}

function ApprovalDrawer({
  item,
  busy,
  onClose,
  onDecide,
}: {
  item: ApprovalItem;
  busy: boolean;
  onClose: () => void;
  onDecide: (item: ApprovalItem, decision: 'approve' | 'reject') => Promise<void>;
}) {
  const pending = item.status === 'pending';

  return (
    <aside className="bg-card flex w-full shrink-0 flex-col rounded-xl border shadow-lg xl:w-[min(26.25rem,40%)] xl:max-w-[420px]">
      <div className="bg-muted/40 flex items-start justify-between gap-3 rounded-t-xl border-b p-4">
        <div className="flex min-w-0 items-center gap-3">
          <AdminInitials name={item.employeeName} size="lg" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-title-md truncate font-semibold">{item.employeeName}</span>
              <span className="bg-muted text-muted-foreground text-label-xs rounded px-1.5">
                {item.employeeNumber}
              </span>
            </div>
            <p className="text-outline text-label-xs truncate">
              {item.title} · {item.location}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="text-outline hover:bg-muted hover:text-foreground rounded-lg p-1.5"
          aria-label="Close drawer"
          onClick={onClose}
        >
          <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
      <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto p-4">
        <div className="flex items-center justify-between gap-2">
          <Badge variant={item.kind === 'punch' ? 'pending' : 'late'}>
            {item.kind === 'punch' ? 'Punch Rectification Request' : item.summary}
          </Badge>
          <span className="text-outline text-label-xs">{item.sentLabel}</span>
        </div>
        {item.kind === 'punch' ? (
          <div className="flex flex-col gap-2">
            <p className="text-outline text-label-xs font-semibold tracking-wider uppercase">
              Attendance Comparison
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-muted flex flex-col rounded-xl p-3">
                <span className="text-outline text-label-xs font-medium">Recorded Time</span>
                <p className="text-destructive text-stat mt-1 leading-tight font-semibold">
                  {item.recordedLabel}
                </p>
                <p className="text-outline text-label-xs mt-0.5">Late stamp recorded</p>
              </div>
              <div className="bg-muted border-primary/30 flex flex-col rounded-xl border p-3">
                <span className="text-primary text-label-xs font-medium">Requested Correction</span>
                <p className="text-primary text-stat mt-1 leading-tight font-semibold">
                  {item.requestedLabel}
                </p>
                <p className="text-success text-label-xs mt-0.5 font-medium">On-time adjustment</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-body-sm">{item.detail}</p>
        )}
        {item.note ? (
          <div className="bg-muted flex flex-col gap-1.5 rounded-xl p-3">
            <p className="text-outline text-label-xs font-semibold tracking-wider uppercase">
              Justification Note
            </p>
            <p className="text-body-sm leading-relaxed italic">&ldquo;{item.note}&rdquo;</p>
          </div>
        ) : null}
        <div className="bg-muted text-muted-foreground text-label-xs flex items-center justify-between rounded-lg p-2.5">
          <span className="text-outline">Manager Endorsement</span>
          <span className={item.managerVerified ? 'text-success font-semibold' : 'font-semibold'}>
            {item.managerVerified ? 'Verified' : 'Not verified'}
          </span>
        </div>
      </div>
      {pending ? (
        <div className="bg-muted/40 flex items-center justify-end gap-2.5 rounded-b-xl border-t p-4">
          <Button
            type="button"
            variant="destructive"
            className="rounded-xl"
            disabled={busy}
            onClick={() => {
              void onDecide(item, 'reject');
            }}
          >
            <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Reject
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            disabled={busy}
            onClick={() => {
              void onDecide(item, 'approve');
            }}
          >
            <Check className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Approve
          </Button>
        </div>
      ) : null}
    </aside>
  );
}
