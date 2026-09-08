import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { useEmployeeAttendance } from '../api/employees-queries';
import { EmployeeCalendarLegend } from './employee-calendar-legend';
import { EmployeeDayCell } from './employee-day-cell';
import { EmployeeShiftDrawer } from './employee-shift-drawer';

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
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (calendar.isPending) {
    return (
      <div className="bg-card rounded-xl border p-5 shadow-sm">
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
  const selectedCell = selected?.day != null ? selected : null;

  return (
    <div className="relative flex w-full flex-col items-start gap-6 transition-all duration-300 lg:flex-row">
      <div className="border-outline-variant/30 bg-card w-full min-w-0 flex-1 overflow-x-auto rounded-xl border p-5 shadow-sm transition-all duration-300">
        <div className="border-outline-variant/20 flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="bg-muted border-outline-variant/30 flex items-center rounded-xl border p-1">
              <button
                type="button"
                className="hover:bg-surface-high rounded-lg p-1 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="size-[18px]" strokeWidth={1.5} aria-hidden="true" />
              </button>
              <span className="text-title-md px-3 select-none">August 2026</span>
              <button
                type="button"
                className="hover:bg-surface-high rounded-lg p-1 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="size-[18px]" strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
            <button
              type="button"
              className="bg-muted hover:bg-accent text-label-md border-outline-variant/30 rounded-xl border px-3 py-1.5 transition-colors"
              onClick={() => {
                onSelectDay(20);
                setDrawerOpen(true);
              }}
            >
              Today
            </button>
          </div>
          <EmployeeCalendarLegend />
        </div>
        <div className="mt-4 min-w-[36rem]">
          <div className="text-outline text-label-xs mb-1 grid grid-cols-7 border-b pb-2 text-center font-semibold tracking-wider uppercase">
            {WEEKDAYS.map((label) => (
              <div
                key={label}
                className={cn('py-1', (label === 'Sat' || label === 'Sun') && 'text-outline/60')}
              >
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {cells.map((cell, index) => (
              <EmployeeDayCell
                key={cell.day === null ? `empty-${String(index)}` : `day-${String(cell.day)}`}
                cell={cell}
                index={index}
                cells={cells}
                ringSelected={drawerOpen && cell.selected && cell.day !== null}
                onSelect={(nextDay) => {
                  onSelectDay(nextDay);
                  setDrawerOpen(true);
                }}
              />
            ))}
          </div>
        </div>
      </div>
      {drawerOpen && selectedCell ? (
        <EmployeeShiftDrawer
          cell={selectedCell}
          hoursLabel={hoursLabel}
          onClose={() => setDrawerOpen(false)}
        />
      ) : null}
    </div>
  );
}
