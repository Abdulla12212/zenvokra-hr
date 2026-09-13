import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router';

import { StatusDot } from '@/components/status-dot';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  addCalendarMonth,
  homeHref,
  monthTitle,
  parseIsoDate,
  type HomeSearch,
} from '@/lib/home-search';
import { cn } from '@/lib/utils';
import { useAttendanceCalendar } from '../api/attendance-queries';
import { CalendarDayCell } from './calendar-day-cell';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface MonthCalendarProps {
  search: HomeSearch;
  todayIso: string;
  compact?: boolean;
  nextHolidayLabel?: string | null;
  nextHolidayHref?: string | null;
}

export function MonthCalendar({
  search,
  todayIso,
  compact = false,
  nextHolidayLabel,
  nextHolidayHref,
}: MonthCalendarProps) {
  const navigate = useNavigate();
  const { year, month, day } = search;
  const calendar = useAttendanceCalendar(year, month);
  const title = monthTitle(year, month);
  const previous = addCalendarMonth(year, month, -1);
  const next = addCalendarMonth(year, month, 1);
  const today = parseIsoDate(todayIso) ?? { year, month, day };
  const cells = calendar.data;

  if (calendar.isPending && cells === undefined) {
    return (
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <Skeleton className="mb-3 h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (calendar.isError && cells === undefined) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {calendar.error.message}
      </p>
    );
  }

  if (cells === undefined) {
    return null;
  }

  return (
    <div className="bg-card rounded-xl border p-4 shadow-sm">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon" asChild aria-label="Previous month">
            <Link to={homeHref({ ...search, ...previous, day: 1, sheet: search.sheet })}>
              <ChevronLeft />
            </Link>
          </Button>
          <h2 className="min-w-[140px] text-center text-sm font-semibold">{title}</h2>
          <Button variant="outline" size="icon" asChild aria-label="Next month">
            <Link to={homeHref({ ...search, ...next, day: 1, sheet: search.sheet })}>
              <ChevronRight />
            </Link>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {compact ? null : (
            <div className="text-muted-foreground flex items-center gap-3 text-xs">
              <Legend tone="ok" label="Present" />
              <Legend tone="warn" label="Late" />
              <Legend tone="leave" label="Leave" />
              <Legend tone="closed" label="Closed" />
            </div>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link to={homeHref({ ...today, sheet: search.sheet })}>Today</Link>
          </Button>
        </div>
      </div>

      <div
        className={cn(
          'grid grid-cols-7 gap-1',
          calendar.isPlaceholderData && 'opacity-60',
        )}
      >
        {WEEKDAYS.map((label) => (
          <div
            key={label}
            className="text-muted-foreground pb-0.5 text-center text-[11px] font-medium"
          >
            {label}
          </div>
        ))}
        {cells.map((cell, index) => (
          <CalendarDayCell
            key={cell.day === null ? `empty-${String(index)}` : `day-${String(cell.day)}`}
            cell={{
              ...cell,
              selected: cell.day === day,
              inRange: false,
            }}
            onSelect={(nextDay) => {
              void navigate(homeHref({ ...search, day: nextDay }));
            }}
          />
        ))}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3 border-t pt-2.5 text-xs">
        {nextHolidayLabel && nextHolidayHref ? (
          <>
            <span className="text-muted-foreground">
              Next closed day · <b className="text-foreground font-medium">{nextHolidayLabel}</b>
            </span>
            <Button variant="link" className="h-auto p-0 text-sm" asChild>
              <Link to={nextHolidayHref}>Show on calendar</Link>
            </Button>
          </>
        ) : (
          <span className="text-muted-foreground">
            Pick a day to review or edit punches · {day} {title}
          </span>
        )}
      </div>
    </div>
  );
}

function Legend({ tone, label }: { tone: 'ok' | 'warn' | 'leave' | 'closed'; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <StatusDot tone={tone} />
      {label}
    </span>
  );
}
