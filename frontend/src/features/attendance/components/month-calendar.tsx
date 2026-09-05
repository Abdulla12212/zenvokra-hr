import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { StatusDot } from '@/components/status-dot';
import { buildCalendarDays, type AttendanceSnapshot } from '@/lib/employee-app-store';
import { homeHref, type CalendarMonth } from '@/lib/home-search';
import { cn } from '@/lib/utils';

import { CalendarDayCell } from './calendar-day-cell';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface MonthCalendarProps {
  month: CalendarMonth;
  day: number;
  attendance: AttendanceSnapshot;
  compact?: boolean;
}

export function MonthCalendar({ month, day, attendance, compact = false }: MonthCalendarProps) {
  const navigate = useNavigate();
  const cells = buildCalendarDays(month, day, attendance.clockedIn, attendance.lateDayFixed);
  const title = month === 'september' ? 'September 2026' : 'August 2026';
  const rangeSelected = month === 'august' && (day === 25 || day === 26);

  return (
    <div className="bg-card rounded-xl border p-4 shadow-sm">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className={cn(month === 'august' && 'pointer-events-none opacity-40')}
            asChild={month === 'september'}
            disabled={month === 'august'}
            aria-label="Previous month"
          >
            {month === 'september' ? (
              <Link to={homeHref({ month: 'august', day: 20 })}>
                <ChevronLeft />
              </Link>
            ) : (
              <ChevronLeft />
            )}
          </Button>
          <h2 className="min-w-[118px] text-center text-sm font-semibold">{title}</h2>
          <Button
            variant="outline"
            size="icon"
            className={cn(month === 'september' && 'pointer-events-none opacity-40')}
            asChild={month === 'august'}
            disabled={month === 'september'}
            aria-label="Next month"
          >
            {month === 'august' ? (
              <Link to={homeHref({ month: 'september', day: 5 })}>
                <ChevronRight />
              </Link>
            ) : (
              <ChevronRight />
            )}
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
          <Button
            variant={month === 'september' ? 'default' : 'outline'}
            size="sm"
            className={cn(month === 'august' && 'opacity-40')}
            asChild
          >
            <Link to={homeHref({ month: 'august', day: 20 })}>Today</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
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
            cell={cell}
            onSelect={(nextDay) => {
              void navigate(homeHref({ month, day: nextDay }));
            }}
          />
        ))}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3 border-t pt-2.5 text-xs">
        <CalendarFooter month={month} day={day} rangeSelected={rangeSelected} />
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

function CalendarFooter({
  month,
  day,
  rangeSelected,
}: {
  month: CalendarMonth;
  day: number;
  rangeSelected: boolean;
}) {
  if (rangeSelected) {
    return (
      <>
        <span className="text-muted-foreground">
          Range · <b className="text-foreground font-medium">Tue 25 – Wed 26 Aug</b> · 2 working
          days
        </span>
        <Button variant="link" className="h-auto p-0 text-[13px]" asChild>
          <Link to={homeHref({ month: 'august', day: 20 })}>Clear</Link>
        </Button>
      </>
    );
  }

  if (month === 'september') {
    return (
      <>
        <span className="text-muted-foreground">
          Selected · <b className="text-foreground font-medium">5 Sep 2026</b>
          {day === 5 ? ' · Company Day · paid' : null}
        </span>
        <Button variant="link" className="h-auto p-0 text-[13px]" asChild>
          <Link to={homeHref({ month: 'august', day: 20 })}>Back to August</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <span className="text-muted-foreground">
        Next public holiday · <b className="text-foreground font-medium">5 Sep 2026</b> · Company
        Day
      </span>
      <Button variant="link" className="h-auto p-0 text-[13px]" asChild>
        <Link to={homeHref({ month: 'september', day: 5 })}>View calendar</Link>
      </Button>
    </>
  );
}
