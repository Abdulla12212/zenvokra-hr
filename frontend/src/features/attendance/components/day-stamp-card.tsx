import { Link } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { homeHref, monthTitle, type HomeSearch } from '@/lib/home-search';

import type { CalendarCell } from '../api/attendance-api';
import { useAttendanceCalendar } from '../api/attendance-queries';

export function DayStampCard({ search }: { search: HomeSearch }) {
  const calendar = useAttendanceCalendar(search.year, search.month);
  const cell = calendar.data?.find((item) => item.day === search.day);

  if (calendar.isPending && cell === undefined) {
    return (
      <div className="bg-card rounded-xl border p-4 shadow-sm">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-3 h-24 w-full" />
      </div>
    );
  }

  if (calendar.isError && cell === undefined) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {calendar.error.message}
      </p>
    );
  }

  return <DayStampBody search={search} cell={cell} />;
}

function DayStampBody({
  search,
  cell,
}: {
  search: HomeSearch;
  cell: CalendarCell | undefined;
}) {
  const heading = `${search.day} ${monthTitle(search.year, search.month)}`;
  const canEdit = cell?.kind !== 'closed' && cell?.kind !== 'leave';

  return (
    <div className="bg-card rounded-xl border p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.06em] uppercase">
            Selected day
          </p>
          <p className="text-muted-foreground text-xs">{heading}</p>
        </div>
        <DayBadge kind={cell?.kind} />
      </div>

      <dl className="mb-3.5 flex flex-col gap-2 text-[13px]">
        <Row label="In" value={cell?.clockIn ?? '—'} />
        <Row label="Out" value={cell?.clockOut ?? '—'} />
        <Row label="Worked" value={cell?.hours ?? cell?.metaPrimary ?? '—'} />
        {cell?.note ? <Row label="Note" value={cell.note} /> : null}
      </dl>

      {canEdit ? (
        <Button variant="outline" className="w-full" asChild>
          <Link to={homeHref({ ...search, sheet: 'fix-punch' })}>Edit punch</Link>
        </Button>
      ) : (
        <p className="text-muted-foreground text-xs">
          {cell?.kind === 'closed'
            ? 'Office closed — no punch to edit.'
            : cell?.kind === 'leave'
              ? 'Leave covers this day.'
              : null}
        </p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function DayBadge({ kind }: { kind: CalendarCell['kind'] | undefined }) {
  if (kind === 'late') {
    return <Badge variant="late">Late</Badge>;
  }

  if (kind === 'present') {
    return <Badge variant="present">Present</Badge>;
  }

  if (kind === 'leave') {
    return <Badge variant="pending">Leave</Badge>;
  }

  if (kind === 'closed') {
    return <Badge variant="rejected">Closed</Badge>;
  }

  return <Badge variant="off">No stamp</Badge>;
}
