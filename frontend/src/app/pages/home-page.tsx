import { Clock } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/page-title';
import { Skeleton } from '@/components/ui/skeleton';
import { ClosedDayCard } from '@/features/attendance/components/closed-day-card';
import { FixPunchSheet } from '@/features/attendance/components/fix-punch-sheet';
import { LateBanner } from '@/features/attendance/components/late-banner';
import { MonthCalendar } from '@/features/attendance/components/month-calendar';
import { PunchLogSheet } from '@/features/attendance/components/punch-log-sheet';
import { PunchOutSheet } from '@/features/attendance/components/punch-out-sheet';
import { ShiftCard } from '@/features/attendance/components/shift-card';
import { WeeklyQuotaCard } from '@/features/attendance/components/weekly-quota-card';
import { useAttendance } from '@/features/attendance/api/attendance-queries';
import { RequestTimeOffSheet } from '@/features/leave/components/request-time-off-sheet';
import { demoSession } from '@/lib/demo-session';
import { homeHref, parseHomeSearch } from '@/lib/home-search';

export function HomePage() {
  const [params] = useSearchParams();
  const search = parseHomeSearch(params);
  const attendanceQuery = useAttendance();

  if (attendanceQuery.isPending) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (attendanceQuery.isError) {
    return (
      <p role="alert" className="text-destructive p-6 text-sm">
        {attendanceQuery.error.message}
      </p>
    );
  }

  const attendance = attendanceQuery.data;
  const { month, day, sheet } = search;
  const sheetOpen = sheet !== null;
  const showClosedDay = month === 'september' && day === 5;

  return (
    <div className={sheetOpen ? 'flex min-h-0 flex-1' : 'flex-1 overflow-auto p-6'}>
      <div className={sheetOpen ? 'min-w-0 flex-1 overflow-auto p-6' : undefined}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <PageTitle>Home</PageTitle>
              <Badge variant={attendance.clockedIn ? 'present' : 'off'}>
                {attendance.clockedIn
                  ? `Clocked in at ${attendance.clockInTime}`
                  : 'Not clocked in'}
              </Badge>
            </div>
            <div className="text-muted-foreground mt-1.5 flex flex-wrap gap-x-3.5 gap-y-1 text-[13px]">
              <span>
                Regular shift · <b className="text-foreground font-medium">{demoSession.employee.hoursLabel}</b> ·
                Standard 8h
              </span>
              <span>{demoSession.campusLabel}</span>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link to={homeHref({ month, day, sheet: 'punch-log' })}>
              <Clock aria-hidden="true" />
              Punch log
            </Link>
          </Button>
        </div>

        {sheetOpen ? null : attendance.lateBannerVisible ? <LateBanner /> : null}

        {sheetOpen ? (
          <MonthCalendar month={month} day={day} attendance={attendance} compact />
        ) : (
          <div className="grid items-start gap-4 xl:grid-cols-[1fr_360px]">
            <MonthCalendar month={month} day={day} attendance={attendance} />
            <div className="flex flex-col gap-4">
              {showClosedDay ? (
                <>
                  <ClosedDayCard />
                  <WeeklyQuotaCard attendance={attendance} month={month} day={day} preview />
                </>
              ) : (
                <>
                  <ShiftCard attendance={attendance} month={month} day={day} />
                  <WeeklyQuotaCard attendance={attendance} month={month} day={day} />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {sheet === 'punch-out' ? (
        <PunchOutSheet attendance={attendance} month={month} day={day} />
      ) : null}
      {sheet === 'fix-punch' ? <FixPunchSheet month={month} day={day} /> : null}
      {sheet === 'request' ? <RequestTimeOffSheet month={month} day={day} /> : null}
      {sheet === 'punch-log' ? <PunchLogSheet month={month} day={day} /> : null}
    </div>
  );
}
