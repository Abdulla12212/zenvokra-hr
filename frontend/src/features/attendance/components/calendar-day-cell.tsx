import { Plane } from 'lucide-react';

import { StatusDot } from '@/components/status-dot';
import { cn } from '@/lib/utils';

import type { CalendarCell } from '../api/attendance-api';

export function CalendarDayCell({
  cell,
  onSelect,
}: {
  cell: CalendarCell;
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
        cell.weekend && cell.kind !== 'closed'
          ? 'text-muted-foreground bg-muted/70'
          : 'bg-background',
        cell.kind === 'late' && 'bg-warning-muted/40',
        cell.kind === 'leave' && 'bg-primary/5',
        cell.kind === 'closed' && 'bg-destructive-muted/50',
        (cell.today || cell.selected) && 'border-primary bg-primary/5',
        cell.today && 'ring-primary ring-1',
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs font-semibold">{day}</span>
        <DayDot cell={cell} />
      </div>
      <div
        className={cn(
          'flex flex-col gap-px text-[10px] leading-tight font-medium',
          cell.kind === 'leave' ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        {cell.showPlane ? <Plane className="text-primary size-[11px]" aria-hidden="true" /> : null}
        {cell.metaPrimary ? (
          <strong
            className={cn(
              'text-[11px] font-semibold',
              cell.today && 'text-primary',
              cell.kind === 'late' && 'text-warning',
              cell.kind === 'closed' && 'text-destructive',
              cell.kind !== 'late' && cell.kind !== 'closed' && !cell.today && 'text-foreground',
            )}
          >
            {cell.metaPrimary}
          </strong>
        ) : null}
        {cell.metaSecondary ? <span>{cell.metaSecondary}</span> : null}
      </div>
    </button>
  );
}

function DayDot({ cell }: { cell: CalendarCell }) {
  if (cell.today) {
    return <StatusDot tone="primary" />;
  }

  if (cell.kind === 'late') {
    return <StatusDot tone="warn" />;
  }

  if (cell.kind === 'leave') {
    return <StatusDot tone="leave" />;
  }

  if (cell.kind === 'closed') {
    return <StatusDot tone="closed" />;
  }

  if (cell.kind === 'present') {
    return <StatusDot tone="ok" />;
  }

  return null;
}
