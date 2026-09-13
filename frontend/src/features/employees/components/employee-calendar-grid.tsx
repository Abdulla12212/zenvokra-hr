import { ChevronLeft, ChevronRight } from 'lucide-react';

import { StatusDot } from '@/components/status-dot';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { addCalendarMonth, monthTitle } from '@/lib/home-search';
import { cn } from '@/lib/utils';

import type { EmployeeCalendarCell } from '../api/employees-api';
import { useEmployeeAttendance } from '../api/employees-queries';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function EmployeeCalendarGrid({
  employeeId,
  year,
  month,
  day,
  onMonthChange,
  onSelectDay,
}: {
  employeeId: string;
  year: number;
  month: number;
  day: number;
  onMonthChange: (year: number, month: number) => void;
  onSelectDay: (day: number) => void;
}) {
  const calendar = useEmployeeAttendance(employeeId, year, month, day);
  const previous = addCalendarMonth(year, month, -1);
  const next = addCalendarMonth(year, month, 1);

  if (calendar.isPending) {
    return (
      <div className="bg-card rounded-xl border p-4">
        <Skeleton className="mb-3 h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (calendar.isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {calendar.error.message}
      </p>
    );
  }

  return (
    <div className="bg-card space-y-3 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Previous month"
            onClick={() => {
              onMonthChange(previous.year, previous.month);
            }}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <h2 className="text-lg font-semibold">{monthTitle(year, month)}</h2>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Next month"
            onClick={() => {
              onMonthChange(next.year, next.month);
            }}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="text-muted-foreground hidden gap-3 text-xs sm:flex">
          <span className="flex items-center gap-1">
            <StatusDot tone="ok" /> On-time
          </span>
          <span className="flex items-center gap-1">
            <StatusDot tone="warn" /> Late
          </span>
          <span className="flex items-center gap-1">
            <StatusDot tone="leave" /> Leave
          </span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((name) => (
          <div key={name} className="text-muted-foreground px-1 text-xs font-medium">
            {name}
          </div>
        ))}
        {calendar.data.map((cell, index) => (
          <CalendarCell
            key={`${String(cell.day ?? 'empty')}-${String(index)}`}
            cell={cell}
            onSelect={onSelectDay}
          />
        ))}
      </div>
    </div>
  );
}

function CalendarCell({
  cell,
  onSelect,
}: {
  cell: EmployeeCalendarCell;
  onSelect: (day: number) => void;
}) {
  if (cell.day === null) {
    return <div className="bg-muted min-h-[68px] rounded-md" />;
  }

  const day = cell.day;

  return (
    <button
      type="button"
      onClick={() => {
        onSelect(day);
      }}
      className={cn(
        'flex min-h-[68px] flex-col gap-1 rounded-md border px-1.5 pt-1 pb-1.5 text-left',
        cell.weekend && cell.kind !== 'closed' ? 'text-muted-foreground bg-muted/70' : 'bg-background',
        cell.kind === 'late' && 'bg-warning-muted/40',
        cell.kind === 'leave' && 'bg-primary/5',
        cell.kind === 'closed' && 'bg-destructive-muted/50',
        (cell.today || cell.selected) && 'border-primary bg-primary/5',
      )}
    >
      <span className="text-xs font-semibold">{day}</span>
      {cell.metaPrimary ? <strong className="text-[11px] font-semibold">{cell.metaPrimary}</strong> : null}
      {cell.metaSecondary ? (
        <span className="text-muted-foreground text-[10px]">{cell.metaSecondary}</span>
      ) : null}
    </button>
  );
}
