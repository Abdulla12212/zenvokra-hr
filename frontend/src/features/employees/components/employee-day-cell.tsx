import { TriangleAlert } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { EmployeeCalendarCell } from '../api/employees-api';
import { outsideMonthDay } from './employee-calendar-format';

export function EmployeeDayCell({
  cell,
  index,
  cells,
  ringSelected,
  onSelect,
}: {
  cell: EmployeeCalendarCell;
  index: number;
  cells: EmployeeCalendarCell[];
  ringSelected: boolean;
  onSelect: (day: number) => void;
}) {
  if (cell.day === null) {
    const label = outsideMonthDay(index, cells);
    return (
      <div className="bg-muted/40 border-outline-variant/10 min-h-[96px] rounded-lg border p-2 opacity-40 select-none">
        {label === null ? null : <span className="text-outline text-label-xs">{label}</span>}
      </div>
    );
  }

  const day = cell.day;

  return (
    <button
      type="button"
      onClick={() => {
        onSelect(day);
      }}
      className={cn(
        'flex min-h-[96px] cursor-pointer flex-col justify-between rounded-lg p-2 text-left transition-all duration-300',
        cell.weekend
          ? 'bg-muted/50 border-outline-variant/20 hover:border-outline border'
          : 'bg-card border-outline-variant/30 hover:border-primary border shadow-sm',
        cell.kind === 'late' && 'border-warning-border hover:border-warning',
        cell.today &&
          'bg-primary-fixed/20 border-primary ring-primary/20 border-2 shadow-sm ring-2',
        ringSelected && 'ring-primary ring-2',
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'text-label-xs',
            cell.today && 'text-primary font-bold',
            cell.weekend && !cell.today && 'text-outline font-medium',
            !cell.today && !cell.weekend && 'font-semibold',
          )}
        >
          {day}
        </span>
        <CellMark cell={cell} />
      </div>
      <CellChip cell={cell} />
    </button>
  );
}

function CellMark({ cell }: { cell: EmployeeCalendarCell }) {
  if (cell.kind === 'closed') {
    return null;
  }

  if (cell.weekend) {
    return <span className="text-outline/70 text-micro">Wknd</span>;
  }

  if (cell.today) {
    return <span className="bg-success size-2 animate-pulse rounded-full" title="Active on duty" />;
  }

  if (cell.kind === 'late') {
    return (
      <TriangleAlert className="text-warning size-[15px]" strokeWidth={1.5} aria-hidden="true" />
    );
  }

  if (cell.kind === 'present') {
    return <span className="bg-success size-1.5 rounded-full" />;
  }

  return null;
}

function CellChip({ cell }: { cell: EmployeeCalendarCell }) {
  if (cell.kind === 'today') {
    return (
      <span className="bg-primary-fixed text-primary text-micro mt-auto block truncate rounded px-1.5 py-0.5 text-center leading-tight font-semibold">
        Today · On Duty
      </span>
    );
  }

  if (cell.kind === 'present' && cell.metaPrimary) {
    return (
      <span className="bg-muted text-success text-micro mt-auto block truncate rounded px-1 py-0.5 leading-tight font-medium">
        {cell.metaPrimary} · On Time
      </span>
    );
  }

  if (cell.kind === 'late' && cell.metaPrimary) {
    return (
      <span className="bg-warning-muted text-warning text-micro mt-auto block truncate rounded px-1 py-0.5 leading-tight font-medium">
        {cell.metaPrimary}
      </span>
    );
  }

  if (cell.kind === 'leave' && cell.metaSecondary) {
    return (
      <span className="bg-primary-fixed text-primary text-micro mt-auto block truncate rounded px-1 py-0.5 leading-tight font-semibold">
        {cell.metaSecondary}
      </span>
    );
  }

  if (cell.kind === 'closed' && cell.metaPrimary) {
    return (
      <span className="bg-destructive-muted text-destructive text-micro mt-auto block truncate rounded px-1 py-0.5 leading-tight font-medium">
        {cell.metaPrimary}
      </span>
    );
  }

  return null;
}
