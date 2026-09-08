import { useState } from 'react';
import { LogIn, LogOut, X } from 'lucide-react';

import { StatusDot } from '@/components/status-dot';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import type { EmployeeCalendarCell } from '../api/employees-api';
import { useEmployeeAttendance } from '../api/employees-queries';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function EmployeeMonthCalendar({
  employeeId,
  day,
  hoursLabel,
  onSelectDay,
}: {
  employeeId: string;
  day: number;
  hoursLabel: string;
  onSelectDay: (nextDay: number) => void;
}) {
  const calendar = useEmployeeAttendance(employeeId, 'august', day);
  const [drawerOpen, setDrawerOpen] = useState(true);

  if (calendar.isPending) {
    return (
      <div className="bg-card rounded-xl border p-4 shadow-sm">
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

  const cells = calendar.data ?? [];
  const selected = cells.find((cell) => cell.day === day);

  return (
    <div className="flex flex-col items-start gap-6 lg:flex-row">
      <div className="bg-card w-full min-w-0 flex-1 overflow-x-auto rounded-xl border p-3 shadow-sm sm:p-4">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-title-md font-semibold">August 2026</h2>
          <div className="text-muted-foreground text-label-xs flex flex-wrap items-center gap-3">
            <Legend tone="ok" label="On-time" />
            <Legend tone="warn" label="Late / short" />
            <Legend tone="leave" label="Leave / WFH" />
            <Legend tone="closed" label="Weekend" />
          </div>
        </div>
        <div className="min-w-[36rem]">
          <div className="text-outline text-label-xs mb-1 grid grid-cols-7 border-b pb-2 text-center font-semibold tracking-wider uppercase">
            {WEEKDAYS.map((label) => (
              <div key={label} className="py-1">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {cells.map((cell, index) => (
              <AdminDayCell
                key={cell.day === null ? `empty-${String(index)}` : `day-${String(cell.day)}`}
                cell={cell}
                onSelect={(nextDay) => {
                  onSelectDay(nextDay);
                  setDrawerOpen(true);
                }}
              />
            ))}
          </div>
        </div>
      </div>
      {selected && selected.day !== null && drawerOpen ? (
        <DayDrawer cell={selected} hoursLabel={hoursLabel} onClose={() => setDrawerOpen(false)} />
      ) : null}
    </div>
  );
}

function AdminDayCell({
  cell,
  onSelect,
}: {
  cell: EmployeeCalendarCell;
  onSelect: (day: number) => void;
}) {
  if (cell.day === null) {
    return <div className="bg-muted min-h-[72px] rounded-lg sm:min-h-[88px] lg:min-h-[96px]" />;
  }

  const day = cell.day;

  return (
    <button
      type="button"
      onClick={() => {
        onSelect(day);
      }}
      className={cn(
        'flex min-h-[72px] flex-col justify-between rounded-lg border px-1.5 pt-1 pb-1.5 text-left sm:min-h-[88px] lg:min-h-[96px]',
        cell.weekend ? 'text-muted-foreground bg-muted/70' : 'bg-card',
        cell.kind === 'late' && 'border-warning-border bg-warning-muted/70',
        cell.kind === 'leave' && 'border-info-border bg-info-muted',
        cell.kind === 'present' && 'border-success-border bg-success-muted/50',
        (cell.today || cell.selected) && 'border-primary ring-primary/20 border-2 shadow-sm ring-2',
      )}
    >
      <span
        className={cn(
          'text-label-xs font-semibold',
          cell.today || cell.selected ? 'text-primary' : undefined,
        )}
      >
        {day}
      </span>
      {cell.metaPrimary ? (
        <strong className="text-micro truncate font-semibold">{cell.metaPrimary}</strong>
      ) : null}
      {cell.metaSecondary ? (
        <span className="text-muted-foreground text-micro truncate">{cell.metaSecondary}</span>
      ) : null}
    </button>
  );
}

function DayDrawer({
  cell,
  hoursLabel,
  onClose,
}: {
  cell: EmployeeCalendarCell;
  hoursLabel: string;
  onClose: () => void;
}) {
  const day = cell.day ?? 20;
  const weekday = weekdayName(day);
  const status =
    cell.kind === 'today'
      ? 'Active on duty'
      : cell.kind === 'late'
        ? 'Late'
        : cell.kind === 'leave'
          ? 'Leave'
          : cell.kind === 'weekend'
            ? 'Weekend'
            : cell.kind === 'present'
              ? 'On-time'
              : 'Scheduled';

  return (
    <aside className="border-primary bg-card w-full shrink-0 rounded-xl border border-l-4 p-4 shadow-lg sm:p-6 lg:w-96">
      <div className="mb-4 flex items-start justify-between gap-2 border-b pb-3">
        <div>
          <h2 className="text-headline-sm font-semibold">Shift & Punch</h2>
          <p className="text-muted-foreground text-body-sm">
            {weekday}, {day} August 2026
          </p>
        </div>
        <button
          type="button"
          className="text-outline hover:bg-muted hover:text-foreground rounded-lg p-1.5"
          aria-label="Close day details"
          onClick={onClose}
        >
          <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="text-outline text-label-xs font-semibold tracking-wider uppercase">
          Shift status
        </span>
        <span className="bg-success-muted text-success text-label-xs rounded-full px-2.5 py-0.5 font-semibold">
          {status}
        </span>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="bg-muted flex flex-col gap-0.5 rounded-xl p-3">
          <span className="text-outline text-label-xs flex items-center gap-1 font-medium">
            <LogIn className="text-success size-3.5" strokeWidth={1.5} aria-hidden="true" />
            Clock In
          </span>
          <span className="text-headline-sm text-success font-bold">
            {cell.metaSecondary && cell.kind !== 'weekend' ? cell.metaSecondary : '—'}
          </span>
          <span className="text-outline text-micro">Target: 09:00 AM</span>
        </div>
        <div className="bg-muted flex flex-col gap-0.5 rounded-xl p-3">
          <span className="text-outline text-label-xs flex items-center gap-1 font-medium">
            <LogOut className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
            Clock Out
          </span>
          <span className="text-headline-sm font-bold">{cell.metaPrimary ?? '—'}</span>
          <span className="text-outline text-micro">Shift {hoursLabel}</span>
        </div>
      </div>
      <p className="text-muted-foreground text-body-sm">
        {cell.metaPrimary ? `${cell.metaPrimary} recorded` : 'No stamp recorded for this date.'}
        {cell.metaSecondary ? ` · ${cell.metaSecondary}` : ''}
      </p>
    </aside>
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

function weekdayName(day: number): string {
  const names = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  return names[(day - 1) % 7] ?? 'Day';
}
