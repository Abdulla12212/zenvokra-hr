import { Clock } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';

import { PageTitle } from '@/components/page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useHolidays } from '@/features/holidays/api/holidays-queries';
import { RequestTimeOffSheet } from '@/features/leave/components/request-time-off-sheet';
import { homeHref, isoDate, parseHomeSearch, parseIsoDate } from '@/lib/home-search';

import { useAttendance } from '../api/attendance-queries';
import { ClosedDayCard } from '../components/closed-day-card';
import { FixPunchSheet } from '../components/fix-punch-sheet';
import { LateBanner } from '../components/late-banner';
import { MonthCalendar } from '../components/month-calendar';
import { PunchLogSheet } from '../components/punch-log-sheet';
import { PunchOutSheet } from '../components/punch-out-sheet';
import { ShiftCard } from '../components/shift-card';
import { WeeklyQuotaCard } from '../components/weekly-quota-card';

export function EmployeeHomePage() {
  const [params] = useSearchParams();
  const search = parseHomeSearch(params);
  const attendanceQuery = useAttendance();
  const holidays = useHolidays();

  if (attendanceQuery.isPending) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading attendance</span>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (attendanceQuery.isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {attendanceQuery.error.message}
      </p>
    );
  }

  const attendance = attendanceQuery.data;
  const sheetOpen = search.sheet !== null;
  const selectedIso = isoDate(search.year, search.month, search.day);
  const closedDays = holidays.data?.holidays ?? [];
  const selectedHoliday = closedDays.find((day) => day.date === selectedIso);
  const nextHoliday = closedDays
    .filter((day) => day.date >= attendance.todayIso)
    .sort((left, right) => left.date.localeCompare(right.date))[0];
  const nextHolidayDate = nextHoliday ? parseIsoDate(nextHoliday.date) : null;

  return (
    <div className={sheetOpen ? 'flex min-h-0 flex-col gap-4 lg:flex-row' : 'space-y-5'}>
      <div className={sheetOpen ? 'min-w-0 flex-1' : undefined}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <PageTitle>Home</PageTitle>
              <Badge variant={attendance.clockedIn ? 'present' : 'off'}>
                {attendance.clockedIn
                  ? `Clocked in at ${attendance.clockInTime}`
                  : 'Not clocked in'}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Regular shift · standard 8h · {attendance.locationReadyLabel}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to={homeHref({ ...search, sheet: 'punch-log' })}>
              <Clock aria-hidden="true" />
              Punch log
            </Link>
          </Button>
        </div>

        {sheetOpen ? null : attendance.lateBannerVisible ? (
          <LateBanner attendance={attendance} />
        ) : null}

        {sheetOpen ? (
          <MonthCalendar search={search} todayIso={attendance.todayIso} compact />
        ) : (
          <div className="grid items-start gap-4 xl:grid-cols-[1fr_360px]">
            <MonthCalendar
              search={search}
              todayIso={attendance.todayIso}
              nextHolidayLabel={nextHoliday?.name ?? null}
              nextHolidayHref={
                nextHolidayDate ? homeHref({ ...nextHolidayDate, sheet: null }) : null
              }
            />
            <div className="flex flex-col gap-4">
              {selectedHoliday ? (
                <ClosedDayCard
                  dateLabel={selectedHoliday.date}
                  name={selectedHoliday.name}
                  detail={selectedHoliday.detail}
                />
              ) : (
                <ShiftCard attendance={attendance} search={search} />
              )}
              <WeeklyQuotaCard attendance={attendance} search={search} />
            </div>
          </div>
        )}
      </div>

      {search.sheet === 'punch-out' ? (
        <PunchOutSheet attendance={attendance} search={search} />
      ) : null}
      {search.sheet === 'fix-punch' ? <FixPunchSheet search={search} /> : null}
      {search.sheet === 'request' ? <RequestTimeOffSheet search={search} /> : null}
      {search.sheet === 'punch-log' ? <PunchLogSheet search={search} /> : null}
    </div>
  );
}
