import { CalendarCheck, Clock, Coffee, IdCard, LogIn, LogOut, ShieldCheck, X } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { EmployeeCalendarCell } from '../api/employees-api';
import {
  drawerStatus,
  expectedOutFromHours,
  formatClock12,
  verificationNote,
  weekdayName,
  weekdayShort,
  workSchedule,
} from './employee-calendar-format';

export function EmployeeShiftDrawer({
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
  const status = drawerStatus(cell.kind);
  const clockIn = formatClock12(cell.clockIn);
  const clockOut = formatClock12(cell.clockOut);
  const targetOut = expectedOutFromHours(hoursLabel);

  return (
    <aside className="border-outline-variant/30 bg-card animate-in fade-in slide-in-from-right-4 border-l-primary w-full shrink-0 rounded-xl border border-l-4 p-6 shadow-lg duration-300 lg:w-96">
      <div className="border-outline-variant/20 mb-4 flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <CalendarCheck className="text-primary size-5" strokeWidth={1.5} aria-hidden="true" />
          <h2 className="text-headline-sm">Shift & Punch</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-primary-fixed text-primary-deep text-label-xs rounded-full px-2.5 py-0.5 font-semibold">
            {weekdayShort(day)} {day} Aug 2026
          </span>
          <button
            type="button"
            className="text-outline hover:bg-muted hover:text-foreground rounded-lg p-1.5 transition-colors"
            aria-label="Close day details"
            title="Close Panel"
            onClick={onClose}
          >
            <X className="size-[18px]" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="bg-muted mb-4 flex flex-col gap-2 rounded-xl p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-outline text-label-xs font-semibold tracking-wider uppercase">
            Selected Date
          </span>
          <span className="text-body-sm font-semibold">
            {weekday}, {day} August 2026
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-outline text-label-xs font-semibold tracking-wider uppercase">
            Shift Status
          </span>
          <span
            className={cn(
              'text-label-xs rounded-full px-2.5 py-0.5 font-semibold',
              cell.kind === 'late' && 'bg-warning-muted text-warning',
              cell.kind === 'leave' && 'bg-primary-fixed text-primary',
              cell.kind === 'weekend' && 'bg-surface-high text-outline',
              (cell.kind === 'today' || cell.kind === 'present') && 'bg-success-muted text-success',
              cell.kind !== 'late' &&
                cell.kind !== 'leave' &&
                cell.kind !== 'weekend' &&
                cell.kind !== 'today' &&
                cell.kind !== 'present' &&
                'bg-muted text-muted-foreground',
            )}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="bg-muted flex flex-col gap-0.5 rounded-xl p-3">
          <span className="text-outline text-label-xs flex items-center gap-1 font-medium">
            <LogIn className="text-success size-3.5" strokeWidth={1.5} aria-hidden="true" />
            Clock In
          </span>
          <span className="text-headline-sm text-success font-bold">{clockIn}</span>
          <span className="text-outline text-micro">Target: 09:00 AM</span>
        </div>
        <div className="bg-muted flex flex-col gap-0.5 rounded-xl p-3">
          <span className="text-outline text-label-xs flex items-center gap-1 font-medium">
            <LogOut className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
            Clock Out
          </span>
          <span className="text-headline-sm font-bold">{clockOut}</span>
          <span className="text-outline text-micro">Target: {targetOut}</span>
        </div>
      </div>

      <div className="border-outline-variant/30 text-body-sm flex flex-col gap-3 border-t py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-body-sm inline-flex items-center gap-1.5">
            <Clock className="text-outline size-4" strokeWidth={1.5} aria-hidden="true" />
            Recorded Hours
          </span>
          <span className="font-semibold">{cell.hours ?? '--'}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-body-sm inline-flex items-center gap-1.5">
            <Coffee className="text-outline size-4" strokeWidth={1.5} aria-hidden="true" />
            Break Duration
          </span>
          <span className="font-semibold">{cell.breakDuration ?? '--'}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-body-sm inline-flex items-center gap-1.5">
            <IdCard className="text-outline size-4" strokeWidth={1.5} aria-hidden="true" />
            Work Schedule
          </span>
          <span className="bg-surface-high text-muted-foreground text-label-xs max-w-[170px] truncate rounded px-2 py-0.5 font-medium">
            {workSchedule(cell, hoursLabel)}
          </span>
        </div>
      </div>

      <div className="border-outline-variant/30 mt-3 border-t pt-3">
        <div className="text-muted-foreground text-label-xs flex items-start gap-2">
          <ShieldCheck
            className="text-outline mt-0.5 size-4 shrink-0"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <span className="leading-relaxed">{verificationNote(cell)}</span>
        </div>
      </div>
    </aside>
  );
}
