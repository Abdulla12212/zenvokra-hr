import { Link } from 'react-router';

import { SheetPanel } from '@/components/sheet-panel';
import { StatusDot } from '@/components/status-dot';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { homeHref, parseIsoDate, type HomeSearch } from '@/lib/home-search';

import { useAttendance, usePunchLog } from '../api/attendance-queries';

export function PunchLogSheet({ search }: { search: HomeSearch }) {
  const log = usePunchLog();
  const attendance = useAttendance();
  const closeTo = homeHref({ ...search, sheet: null });
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

      {log.data?.map((group) => {
        const groupDate = parseIsoDate(group.id);

        return (
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
                  {entry.action === 'edit' || entry.action === 'fix' ? (
                    <Button variant="link" className="h-auto p-0 text-sm" asChild>
                      <Link
                        to={homeHref({
                          ...(groupDate ?? search),
                          sheet: 'fix-punch',
                        })}
                      >
                        {entry.action === 'fix' ? 'Fix' : 'Edit'}
                      </Link>
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </SheetPanel>
  );
}
