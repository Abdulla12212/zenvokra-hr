import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { homeHref, type HomeSearch } from '@/lib/home-search';
import { cn } from '@/lib/utils';

import type { AttendanceSnapshot, WeekBar } from '../api/attendance-api';

export function WeeklyQuotaCard({
  attendance,
  search,
}: {
  attendance: AttendanceSnapshot;
  search: HomeSearch;
}) {
  return (
    <div className="bg-card rounded-xl border p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.06em] uppercase">
            Weekly quota
          </p>
          <p className="text-lg font-semibold tracking-tight">{attendance.weekTotalLabel}</p>
        </div>
        <p
          className={cn(
            'text-xs',
            attendance.weekShiftsOk ? 'text-success font-semibold' : 'text-muted-foreground',
          )}
        >
          {attendance.weekShiftsLabel}
        </p>
      </div>

      <div className="grid h-[88px] grid-cols-5 items-end gap-2">
        {attendance.weekDays.map((bar) => (
          <WeekColumn key={bar.id} bar={bar} />
        ))}
      </div>
      <div className="text-muted-foreground mt-3 flex items-center justify-between gap-2 border-t pt-2.5 text-xs">
        <span>{attendance.overtimeLabel}</span>
        <Button variant="link" className="h-auto p-0 text-sm" asChild>
          <Link to={homeHref({ ...search, sheet: 'punch-log' })}>Timesheet logs</Link>
        </Button>
      </div>
    </div>
  );
}

function WeekColumn({ bar }: { bar: WeekBar }) {
  return (
    <div className="flex h-full flex-col items-center gap-1">
      <div className="bg-muted relative flex w-full flex-1 items-end overflow-hidden rounded-md">
        {bar.fillPercent > 0 ? (
          <div
            className={cn(
              'w-full rounded-md',
              bar.tone === 'ok' && 'bg-success',
              bar.tone === 'warn' && 'bg-warning',
              bar.tone === 'now' && 'bg-primary',
            )}
            style={{ height: `${String(bar.fillPercent)}%` }}
          />
        ) : null}
      </div>
      <span className="text-[10px] font-semibold">{bar.hoursLabel}</span>
      <span className="text-muted-foreground text-[10px]">{bar.day}</span>
    </div>
  );
}
