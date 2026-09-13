import { Link, useNavigate } from 'react-router';

import { ProgressBar } from '@/components/progress-bar';
import { SheetPanel } from '@/components/sheet-panel';
import { Button } from '@/components/ui/button';
import { homeHref, type HomeSearch } from '@/lib/home-search';
import { cn } from '@/lib/utils';

import type { AttendanceSnapshot } from '../api/attendance-api';
import { usePunchOut } from '../api/attendance-queries';

export function PunchOutSheet({
  attendance,
  search,
}: {
  attendance: AttendanceSnapshot;
  search: HomeSearch;
}) {
  const punchOut = usePunchOut();
  const navigate = useNavigate();
  const closeTo = homeHref({ ...search, sheet: null });

  return (
    <SheetPanel>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.06em] uppercase">
            Today’s shift
          </p>
          <h2 className="font-semibold">Punch out</h2>
        </div>
        <Button variant="ghost" className="h-auto p-0 text-xs" asChild>
          <Link to={closeTo}>Close</Link>
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">Stamps now. No approval.</p>
      <div>
        <p className="text-[28px] leading-none font-bold tracking-tight">
          {attendance.recordedTimer}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">Recorded working time today</p>
      </div>
      <ProgressBar value={attendance.percentOfShift} />
      <dl className="flex flex-col gap-2 text-[13px]">
        <StampRow label="Clock-in" value={attendance.clockInDetail} ok />
        <StampRow label="Out" value={attendance.currentTime} />
        <StampRow label="Lunch" value={attendance.breakDetail} />
        <StampRow label="Worked" value={attendance.recordedShort} />
        <StampRow label="Location" value={attendance.locationLabel} ok />
      </dl>
      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={punchOut.isPending}
        onClick={() => {
          punchOut.mutate(undefined, {
            onSuccess: () => {
              void navigate(closeTo);
            },
          });
        }}
      >
        Punch out
      </Button>
      <Button variant="ghost" className="w-full" asChild>
        <Link to={closeTo}>Stay in</Link>
      </Button>
    </SheetPanel>
  );
}

function StampRow({ label, value, ok = false }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn('text-right font-medium', ok && 'text-success')}>{value}</dd>
    </div>
  );
}
