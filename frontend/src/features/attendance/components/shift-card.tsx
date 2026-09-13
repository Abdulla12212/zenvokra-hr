import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { AttendanceSnapshot } from '../api/attendance-api';
import { usePunchIn, usePunchOut } from '../api/attendance-queries';
import {
  formatStampTime,
  formatWorkedClock,
  timerPriorSeconds,
  useWorkedClock,
} from '../lib/worked-clock';

export function ShiftCard({ attendance }: { attendance: AttendanceSnapshot }) {
  const punchIn = usePunchIn();
  const punchOut = usePunchOut();
  const clockInLabel = formatStampTime(attendance.clockInAt);
  const clockOutLabel = attendance.clockedIn ? '—' : formatStampTime(attendance.clockOutAt);
  const error = punchIn.error ?? punchOut.error;

  return (
    <div className="bg-card rounded-xl border p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.06em] uppercase">
            Today
          </p>
          <p className="text-muted-foreground text-xs">{attendance.todayLabel}</p>
        </div>
        <Badge variant={attendance.clockedIn ? 'present' : 'off'}>
          {attendance.clockedIn ? 'Clocked in' : attendance.clockInAt ? 'Clocked out' : 'Out'}
        </Badge>
      </div>

      <WorkedTimer
        todayIso={attendance.todayIso}
        priorWorkedSeconds={timerPriorSeconds(
          attendance.clockedIn,
          attendance.priorWorkedSeconds,
          attendance.recordedSeconds,
        )}
        openSinceAt={attendance.openSinceAt}
      />
      <p className="text-muted-foreground mt-1 mb-3.5 text-xs">
        {attendance.clockedIn
          ? 'Running'
          : attendance.clockInAt
            ? 'Paused'
            : 'Clock in to start the day'}
      </p>

      <dl className="mb-3.5 flex flex-col gap-2 text-[13px]">
        <div className="flex items-start justify-between gap-2.5">
          <dt className="text-muted-foreground">Clock in</dt>
          <dd className="font-medium">{clockInLabel}</dd>
        </div>
        <div className="flex items-start justify-between gap-2.5">
          <dt className="text-muted-foreground">Clock out</dt>
          <dd className="font-medium">{clockOutLabel}</dd>
        </div>
      </dl>

      {error ? (
        <p role="alert" className="text-destructive mb-3 text-sm">
          {error.message}
        </p>
      ) : null}

      {attendance.clockedIn ? (
        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={punchOut.isPending}
          onClick={() => {
            punchOut.mutate();
          }}
        >
          Clock out
        </Button>
      ) : (
        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={punchIn.isPending}
          onClick={() => {
            punchIn.mutate();
          }}
        >
          Clock in
        </Button>
      )}
    </div>
  );
}

function WorkedTimer({
  todayIso,
  priorWorkedSeconds,
  openSinceAt,
}: {
  todayIso: string;
  priorWorkedSeconds: number;
  openSinceAt: string | null;
}) {
  const seconds = useWorkedClock(todayIso, priorWorkedSeconds, openSinceAt);

  return (
    <p className="text-[28px] leading-none font-bold tracking-tight tabular-nums">
      {formatWorkedClock(seconds)}
    </p>
  );
}
