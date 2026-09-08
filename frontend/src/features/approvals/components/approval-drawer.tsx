import { useEffect } from 'react';
import { Check, CheckCircle, X } from 'lucide-react';

import { AdminInitials } from '@/app/layout/admin-initials';
import { Button } from '@/components/ui/button';
import type { ApprovalItem } from '../api/approvals-api';

import { splitClock12 } from './approval-format';
import { ApprovalTypeBadge } from './approval-type-badge';

export function ApprovalDrawer({
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
  const recorded = splitClock12(item.recordedLabel);
  const requested = splitClock12(item.requestedLabel);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <aside className="bg-card flex w-full shrink-0 flex-col rounded-xl border shadow-lg transition-all duration-300 lg:w-[31.25rem]">
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
          className="text-outline hover:bg-muted hover:text-foreground rounded-lg p-1.5 transition-colors"
          aria-label="Close drawer"
          title="Close Drawer (Esc)"
          onClick={onClose}
        >
          <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
      <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto p-4">
        <div className="flex items-center justify-between gap-2">
          <ApprovalTypeBadge item={item} drawer />
          <span className="text-outline text-label-xs">{item.sentLabel}</span>
        </div>
        {item.kind === 'punch' ? (
          <PunchComparison recorded={recorded} requested={requested} />
        ) : (
          <div className="flex flex-col gap-1">
            <p className="text-outline text-label-xs font-semibold tracking-wider uppercase">
              Leave request
            </p>
            <p className="text-title-md font-semibold">{item.detail}</p>
            <p className="text-outline text-body-sm">{item.summary}</p>
          </div>
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
          {item.managerVerified ? (
            <span className="text-success flex items-center gap-1 font-semibold">
              <CheckCircle className="size-[15px]" strokeWidth={1.5} aria-hidden="true" />
              Verified
            </span>
          ) : (
            <span className="font-semibold">Not verified</span>
          )}
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

function PunchComparison({
  recorded,
  requested,
}: {
  recorded: { time: string; period: string };
  requested: { time: string; period: string };
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-outline text-label-xs font-semibold tracking-wider uppercase">
        Attendance Comparison
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-muted flex flex-col justify-between gap-1 rounded-xl p-3">
          <span className="text-outline text-label-xs font-medium">Recorded Time</span>
          <p className="text-destructive text-stat mt-1 leading-tight font-semibold tracking-tight">
            {recorded.time}{' '}
            <span className="text-outline text-label-md font-medium">{recorded.period}</span>
          </p>
          <p className="text-outline text-label-xs mt-0.5">Late stamp recorded</p>
        </div>
        <div className="bg-muted border-primary/30 flex flex-col justify-between gap-1 rounded-xl border p-3">
          <span className="text-primary text-label-xs font-medium">Requested Correction</span>
          <p className="text-primary text-stat mt-1 leading-tight font-semibold tracking-tight">
            {requested.time}{' '}
            <span className="text-primary text-label-md font-medium">{requested.period}</span>
          </p>
          <p className="text-success text-label-xs mt-0.5 font-medium">On-time adjustment</p>
        </div>
      </div>
    </div>
  );
}
