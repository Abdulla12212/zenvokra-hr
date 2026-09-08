import {
  ArrowLeftRight,
  Mail,
  PartyPopper,
  Scale,
  Timer,
  TrendingUp,
  UserRound,
} from 'lucide-react';

import { initials } from '@/lib/initials';
import type { ClosedDay } from '@/lib/employee-app-types';

import { formatHolidayLong, isUpcomingIso } from './employee-leave-format';

export function EmployeeLeaveSidebar({
  holidays,
  managerName,
}: {
  holidays: ClosedDay[];
  managerName: string;
}) {
  const upcoming = holidays.filter((holiday) => isUpcomingIso(holiday.date));

  return (
    <div className="flex w-full flex-col gap-5 lg:w-96">
      <section className="border-outline-variant/30 bg-card rounded-xl border p-5 shadow-sm">
        <div className="border-outline-variant/20 mb-3 flex items-center gap-2 border-b pb-3">
          <Scale className="text-primary size-5" strokeWidth={1.5} aria-hidden="true" />
          <h3 className="text-title-md">Leave Policy & Rules</h3>
        </div>
        <div className="text-body-sm flex flex-col gap-3">
          <PolicyRow
            icon={TrendingUp}
            title="Monthly Accrual:"
            body="1.67 days accrued at the end of each calendar month."
          />
          <PolicyRow
            icon={ArrowLeftRight}
            title="Carry-Forward Limit:"
            body="Maximum 5 unused annual leave days roll into 2027."
          />
          <PolicyRow
            icon={Timer}
            title="Notice Period:"
            body="Minimum 3 days advance notice for more than 2 consecutive days."
          />
        </div>
      </section>

      <section className="border-outline-variant/30 bg-card rounded-xl border p-5 shadow-sm">
        <div className="border-outline-variant/20 mb-3 flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <PartyPopper className="text-success size-5" strokeWidth={1.5} aria-hidden="true" />
            <h3 className="text-title-md">Upcoming Holidays</h3>
          </div>
          <span className="text-outline text-label-xs">Dhaka HQ</span>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-muted-foreground text-body-sm">No upcoming closed days.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {upcoming.map((holiday) => (
              <div
                key={holiday.date}
                className="border-outline-variant/20 bg-muted flex flex-col gap-1 rounded-xl border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-body-sm font-semibold">{holiday.name}</span>
                  <span className="bg-success-muted text-success text-label-xs rounded px-2 py-0.5 font-semibold">
                    Paid Holiday
                  </span>
                </div>
                <span className="text-muted-foreground text-label-xs">
                  {formatHolidayLong(holiday.date)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border-outline-variant/30 bg-card rounded-xl border p-5 shadow-sm">
        <div className="border-outline-variant/20 mb-3 flex items-center gap-2 border-b pb-3">
          <UserRound className="text-primary size-5" strokeWidth={1.5} aria-hidden="true" />
          <h3 className="text-title-md">Reporting Approver</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-primary-fixed text-primary grid size-10 shrink-0 place-items-center rounded-2xl text-[14px] font-bold">
            {initials(managerName)}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-body-sm truncate font-semibold">{managerName}</span>
            <span className="text-muted-foreground text-label-xs truncate">Line Manager</span>
          </div>
          <button
            type="button"
            className="text-outline hover:bg-muted hover:text-foreground rounded-lg p-1.5 transition-colors"
            title="Send Email"
            aria-label="Send Email"
          >
            <Mail className="size-[18px]" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
}

function PolicyRow({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof TrendingUp;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="text-primary mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
      <div>
        <span className="font-medium">{title}</span>
        <p className="text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
