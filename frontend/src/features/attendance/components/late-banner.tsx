import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { homeHref, parseIsoDate } from '@/lib/home-search';

import type { AttendanceSnapshot } from '../api/attendance-api';
import { useDismissLateBanner } from '../api/attendance-queries';

export function LateBanner({ attendance }: { attendance: AttendanceSnapshot }) {
  const dismiss = useDismissLateBanner();
  const late = attendance.lateDayIso ? parseIsoDate(attendance.lateDayIso) : null;

  return (
    <div className="border-warning-border bg-warning-muted mb-4 flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-[13px]">
      <div>
        <strong className="block font-semibold">{attendance.lateDayTitle}</strong>
        {attendance.lateDayDetail ? (
          <span className="text-muted-foreground text-xs">
            Clocked in {attendance.lateDayDetail} — missed the 15m grace.
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {late ? (
          <Button variant="outline" size="sm" asChild>
            <Link to={homeHref({ ...late, sheet: 'fix-punch' })}>Fix punch</Link>
          </Button>
        ) : null}
        <button
          type="button"
          className="text-muted-foreground px-1 text-base leading-none"
          aria-label="Dismiss late notice"
          onClick={() => {
            dismiss.mutate();
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
