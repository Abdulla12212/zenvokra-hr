import { Check, X } from 'lucide-react';

import { AdminInitials } from '@/app/layout/admin-initials';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ApprovalItem } from '../api/approvals-api';

import { formatClock12 } from './approval-format';
import { ApprovalTypeBadge } from './approval-type-badge';

export function ApprovalRow({
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
        'bg-card group flex cursor-pointer flex-col gap-3 rounded-xl border p-3.5 shadow-sm transition-all duration-300 md:grid md:grid-cols-12 md:items-center',
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
            <span className="bg-surface-high text-muted-foreground text-label-xs rounded px-1.5">
              {item.employeeNumber}
            </span>
          </div>
          <p className="text-outline text-label-xs truncate">
            {item.title} · {item.location}
          </p>
        </div>
      </button>
      <div className="col-span-2 flex items-center">
        <ApprovalTypeBadge item={item} />
      </div>
      <button type="button" className="col-span-4 min-w-0 text-left" onClick={onSelect}>
        {item.kind === 'punch' ? (
          <p className="text-label-xs">
            <span className="text-primary font-semibold">
              Req: {formatClock12(item.requestedLabel)}
            </span>
            <span className="text-outline"> vs </span>
            <span className="text-destructive font-medium">
              Sys: {formatClock12(item.recordedLabel)}
            </span>
          </p>
        ) : (
          <p className="text-label-xs">
            <span className="text-foreground font-semibold">{item.detail}</span>
            {item.note.length > 0 ? <span className="text-outline"> · {item.note}</span> : null}
          </p>
        )}
        <p className="text-outline text-label-xs mt-0.5 truncate">
          {item.kind === 'punch' && item.note.length > 0
            ? `${item.note} · ${item.sentLabel}`
            : item.sentLabel}
        </p>
      </button>
      <div className="border-outline-variant/20 col-span-2 flex items-center justify-end gap-1.5 border-t pt-2 md:border-t-0 md:pt-0">
        {item.status === 'pending' ? (
          <>
            <button
              type="button"
              title="Quick Reject"
              disabled={busy}
              className="bg-muted text-destructive hover:bg-destructive-muted grid size-7 place-items-center rounded-lg transition-colors"
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
              className="bg-muted text-success hover:bg-success-muted grid size-7 place-items-center rounded-lg transition-colors"
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
