import { useNavigate, useParams } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/page-title';
import { Skeleton } from '@/components/ui/skeleton';
import { useCancelLeaveRequest, useLeaveRequest } from '@/features/leave/api/leave-queries';

export function RequestDetailPage() {
  const { requestId } = useParams();
  const id = requestId ?? '';
  const query = useLeaveRequest(id);
  const cancel = useCancelLeaveRequest();
  const navigate = useNavigate();

  if (query.isPending) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 max-w-[560px]" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <p role="alert" className="text-destructive p-6 text-sm">
        {query.error.message}
      </p>
    );
  }

  const request = query.data;

  if (!request) {
    return (
      <p role="alert" className="text-muted-foreground p-6 text-sm">
        That request is not on file.
      </p>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <PageTitle>{request.heading}</PageTitle>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {request.type} · {request.days} day{request.days === 1 ? '' : 's'}
          </p>
        </div>
        <Badge variant={request.status === 'pending' ? 'late' : request.status === 'approved' ? 'present' : 'rejected'}>
          {request.statusLabel}
        </Badge>
      </div>

      <div className="bg-card max-w-[560px] rounded-xl border p-6 shadow-sm">
        <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2.5 text-sm">
          <dt className="text-muted-foreground">Type</dt>
          <dd className="font-medium">{request.type}</dd>
          <dt className="text-muted-foreground">Dates</dt>
          <dd className="font-medium">{request.rangeShort}</dd>
          <dt className="text-muted-foreground">After approval</dt>
          <dd className="font-medium">{request.remainingAfterLabel}</dd>
          <dt className="text-muted-foreground">Note</dt>
          <dd className="font-medium">{request.note || '—'}</dd>
        </dl>
        <p className="mt-6 text-[13px] font-semibold">Activity</p>
        <p className="mt-1 text-sm">{request.sentLabel}</p>
        {request.waitingLabel ? (
          <p className="text-muted-foreground mt-1 text-xs">{request.waitingLabel}</p>
        ) : null}
        {request.status === 'pending' ? (
          <div className="mt-6">
            <Button
              variant="destructive"
              disabled={cancel.isPending}
              onClick={() => {
                cancel.mutate(request.id, {
                  onSuccess: () => {
                    void navigate('/time-off');
                  },
                });
              }}
            >
              Cancel request
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
