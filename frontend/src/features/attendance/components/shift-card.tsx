import { LogOut } from 'lucide-react';
import { Link } from 'react-router';

import { ProgressBar } from '@/components/progress-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { homeHref, type HomeSearch } from '@/lib/home-search';
import { cn } from '@/lib/utils';

import type { AttendanceSnapshot } from '../api/attendance-api';
import { usePunchIn, useToggleBreak } from '../api/attendance-queries';

export function ShiftCard({
  attendance,
  search,
}: {
  attendance: AttendanceSnapshot;
  search: HomeSearch;
}) {
  const punchIn = usePunchIn();
  const toggleBreak = useToggleBreak();

  return (
    <div className="bg-card rounded-xl border p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.06em] uppercase">
            Today’s shift
          </p>
          <p className="text-muted-foreground text-xs">{attendance.todayLabel}</p>
        </div>
        <Badge variant={attendance.clockedIn ? 'present' : 'off'}>
          {attendance.clockedIn ? 'Active' : 'Out'}
        </Badge>
      </div>

      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-[28px] leading-none font-bold tracking-tight">
            {attendance.recordedTimer}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {attendance.clockedIn
              ? 'Recorded working time today'
              : `Not started · stamps ${attendance.currentTime}`}
          </p>
        </div>
        <p className="text-muted-foreground shrink-0 text-right text-xs font-semibold">
          {attendance.percentOfShift}% of 8h
        </p>
      </div>

      <ProgressBar value={attendance.percentOfShift} className="mb-3.5" />

      {attendance.clockedIn ? (
        <>
          <Button className="mb-2 w-full" asChild>
            <Link to={homeHref({ ...search, sheet: 'punch-out' })}>
              Punch out
              <LogOut aria-hidden="true" />
            </Link>
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={toggleBreak.isPending}
              onClick={() => {
                toggleBreak.mutate();
              }}
            >
              {attendance.onBreak ? 'End break' : 'Take break'}
            </Button>
            <Button variant="outline" asChild>
              <Link to={homeHref({ ...search, sheet: 'fix-punch' })}>Edit stamp</Link>
            </Button>
          </div>
          <StampList attendance={attendance} />
        </>
      ) : (
        <>
          <p className="text-muted-foreground mb-3 text-xs">
            Clock in from here. The stamp uses your workplace location.
          </p>
          <Button
            type="button"
            size="lg"
            className="mb-2 w-full"
            disabled={punchIn.isPending}
            onClick={() => {
              punchIn.mutate();
            }}
          >
            Punch in
          </Button>
          <dl className="mt-3.5 flex flex-col gap-2 text-[13px]">
            <StampRow label="Scheduled in" value="09:00" />
            <StampRow label="Expected out" value="18:00" />
            <StampRow label="Time now" value={attendance.currentTime} />
            <StampRow label="Location" value={attendance.locationReadyLabel} />
          </dl>
        </>
      )}
    </div>
  );
}

function StampList({ attendance }: { attendance: AttendanceSnapshot }) {
  return (
    <dl className="mt-3.5 flex flex-col gap-2 text-[13px]">
      <StampRow label="Clock-in" value={attendance.clockInDetail} ok />
      <StampRow label="Lunch break" value={attendance.breakDetail} />
      <StampRow label="Current" value={attendance.currentTime} />
      <StampRow
        label="Estimated out"
        value={`${attendance.estimatedOut} · ${attendance.timeUntilOut}`}
      />
      <StampRow label="Location" value={attendance.locationLabel} ok />
    </dl>
  );
}

function StampRow({ label, value, ok = false }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn('text-right font-medium', ok && 'text-success')}>{value}</dd>
    </div>
  );
}
