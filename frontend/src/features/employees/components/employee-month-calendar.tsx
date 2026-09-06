import { StatusDot } from '@/components/status-dot';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import type { EmployeeCalendarCell } from '../api/employees-api';
import { useEmployeeAttendance } from '../api/employees-queries';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function EmployeeMonthCalendar({
  employeeId,
  day,
  onSelectDay,
}: {
  employeeId: string;
  day: number;
  onSelectDay: (nextDay: number) => void;
}) {
  const calendar = useEmployeeAttendance(employeeId, 'august', day);

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

  return (
    <div className="bg-card rounded-xl border p-4 shadow-sm">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">August 2026</h2>
        <div className="text-muted-foreground flex items-center gap-3 text-xs">
          <Legend tone="ok" label="On-time" />
          <Legend tone="warn" label="Late / short" />
          <Legend tone="leave" label="Leave / WFH" />
          <Legend tone="closed" label="Weekend" />
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
          <AdminDayCell
            key={cell.day === null ? `empty-${String(index)}` : `day-${String(cell.day)}`}
            cell={cell}
            onSelect={onSelectDay}
          />
        ))}
      </div>
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
        cell.weekend ? 'text-muted-foreground bg-muted/70' : 'bg-background',
        cell.kind === 'late' && 'bg-[color-mix(in_oklch,var(--warning)_7%,var(--background))]',
        cell.kind === 'leave' && 'bg-[color-mix(in_oklch,var(--primary)_6%,var(--background))]',
        (cell.today || cell.selected) && 'border-primary bg-primary/8',
      )}
    >
      <span className="text-xs font-semibold">{day}</span>
      {cell.metaPrimary ? (
        <strong className="text-[11px] font-semibold">{cell.metaPrimary}</strong>
      ) : null}
      {cell.metaSecondary ? (
        <span className="text-muted-foreground text-[10px]">{cell.metaSecondary}</span>
      ) : null}
    </button>
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
