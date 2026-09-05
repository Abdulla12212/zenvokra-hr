import { Plane } from 'lucide-react';

import { StatusDot } from '@/components/status-dot';
import type { CalendarCell } from '@/lib/employee-app-store';
import { cn } from '@/lib/utils';

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
        cell.weekend && !cell.kind.includes('closed')
          ? 'text-muted-foreground bg-[color-mix(in_oklch,var(--muted)_70%,var(--background))]'
          : 'bg-background',
        cell.kind === 'late' && 'bg-[color-mix(in_oklch,var(--warning)_7%,var(--background))]',
        cell.kind === 'leave' && 'bg-[color-mix(in_oklch,var(--primary)_6%,var(--background))]',
        cell.kind === 'closed' && 'bg-[color-mix(in_oklch,var(--destructive)_5%,var(--background))]',
        (cell.today || cell.selected) &&
          'bg-[color-mix(in_oklch,var(--primary)_8%,var(--background))] border-primary',
        cell.today && 'shadow-[inset_0_0_0_1px_var(--primary)]',
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
              cell.kind === 'late' &&
                'text-[color-mix(in_oklch,var(--warning)_55%,var(--foreground))]',
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
