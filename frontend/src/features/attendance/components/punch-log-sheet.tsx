import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { SheetPanel } from '@/components/sheet-panel';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusDot } from '@/components/status-dot';
import { homeHref, type CalendarMonth } from '@/lib/home-search';

import { useAttendance, usePunchLog } from '../api/attendance-queries';

export function PunchLogSheet({ month, day }: { month: CalendarMonth; day: number }) {
  const log = usePunchLog();
  const attendance = useAttendance();
  const closeTo = homeHref({ month, day });
  const summary = attendance.data?.punchLogSummaryLabel ?? 'This week';

  return (
    <SheetPanel wide>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.06em] uppercase">
            Timesheet
          </p>
          <h2 className="font-semibold">Punch log</h2>
        </div>
        <Button variant="ghost" className="h-auto p-0 text-xs" asChild>
          <Link to={closeTo}>Close</Link>
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">{summary}</p>

      {log.isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : null}

      {log.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {log.error.message}
        </p>
      ) : null}

      {log.data?.map((group) => (
        <div key={group.id}>
          <p className="text-muted-foreground mb-1.5 text-xs font-semibold">{group.heading}</p>
          <div className="bg-card rounded-xl border shadow-sm">
            {group.entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0"
              >
                <StatusDot
                  tone={
                    entry.tone === 'warn'
                      ? 'warn'
                      : entry.tone === 'ok'
                        ? 'ok'
                        : entry.tone === 'mute'
                          ? 'mute'
                          : 'primary'
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{entry.title}</p>
                  <p className="text-muted-foreground text-xs">{entry.detail}</p>
                </div>
                {entry.action === 'edit' ? (
                  <Button variant="link" className="h-auto p-0 text-[13px]" asChild>
                    <Link to={homeHref({ month, day: 20, sheet: 'fix-punch' })}>Edit</Link>
                  </Button>
                ) : null}
                {entry.action === 'fix' ? (
                  <Button variant="link" className="h-auto p-0 text-[13px]" asChild>
                    <Link to={homeHref({ month: 'august', day: 19, sheet: 'fix-punch' })}>Fix</Link>
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ))}
    </SheetPanel>
  );
}
