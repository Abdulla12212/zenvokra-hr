import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { ApprovalItem } from '../api/approvals-api';

export function ApprovalCard({
  item,
  busy,
  onDecide,
}: {
  item: ApprovalItem;
  busy: boolean;
  onDecide: (decision: 'approve' | 'reject') => void;
}) {
  return (
    <article className="bg-card space-y-3 rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{item.employeeName}</p>
          <p className="text-muted-foreground text-xs">
            {item.employeeNumber} · {item.title}
            {item.location ? ` · ${item.location}` : ''}
          </p>
        </div>
        <Badge variant={item.kind === 'leave' ? 'pending' : 'late'}>
          {item.kind === 'leave' ? 'Time off' : 'Punch'}
        </Badge>
      </div>
      <p className="text-sm">
        {item.summary}
        <span className="text-muted-foreground"> · {item.detail}</span>
      </p>
      {item.note ? <p className="bg-muted rounded-md px-3 py-2 text-sm">{item.note}</p> : null}
      {item.kind === 'punch' ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="bg-muted rounded-md px-3 py-2">
            <p className="text-muted-foreground text-xs">Recorded</p>
            <p className="font-medium">{item.recordedLabel}</p>
          </div>
          <div className="bg-muted rounded-md px-3 py-2">
            <p className="text-muted-foreground text-xs">Requested</p>
            <p className="font-medium">{item.requestedLabel}</p>
          </div>
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">{item.sentLabel}</p>
        {item.status === 'pending' ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => {
                onDecide('reject');
              }}
            >
              Reject
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => {
                onDecide('approve');
              }}
            >
              Approve
            </Button>
          </div>
        ) : (
          <Badge variant={item.status === 'approved' ? 'present' : 'rejected'}>{item.status}</Badge>
        )}
      </div>
    </article>
  );
}
