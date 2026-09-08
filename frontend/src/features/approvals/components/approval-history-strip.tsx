import { History } from 'lucide-react';

import { AdminInitials } from '@/app/layout/admin-initials';
import { cn } from '@/lib/utils';
import type { ApprovalItem } from '../api/approvals-api';

export function ApprovalHistoryStrip({
  items,
  onViewAll,
}: {
  items: ApprovalItem[];
  onViewAll: () => void;
}) {
  return (
    <div className="bg-card flex flex-col gap-3 rounded-xl border p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="text-primary size-[18px]" strokeWidth={1.5} aria-hidden="true" />
          <strong className="text-title-md">Recently Processed Approvals</strong>
        </div>
        <button
          type="button"
          className="text-primary text-label-xs font-semibold hover:underline"
          onClick={onViewAll}
        >
          View all {items.length} history records
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {items.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className="bg-muted flex items-center justify-between gap-2 rounded-lg border p-3"
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
            <button
              type="button"
              className="text-outline hover:text-foreground text-label-xs rounded px-2 py-1 transition-colors"
            >
              Undo
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
