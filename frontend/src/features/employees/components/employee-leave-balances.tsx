import { CalendarDays, NotebookPen, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { ClosedDay } from '@/lib/employee-app-types';
import type { EmployeeLeave } from '../api/employees-api';

import { EmployeeLeaveBalanceCard } from './employee-leave-balance-card';
import { EmployeeLeaveHistory } from './employee-leave-history';
import { EmployeeLeaveSidebar } from './employee-leave-sidebar';

export function EmployeeLeaveBalances({
  leave,
  holidays,
  managerName,
  departmentName,
}: {
  leave: EmployeeLeave;
  holidays: ClosedDay[];
  managerName: string;
  departmentName: string;
}) {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="border-outline-variant/30 bg-card flex flex-col justify-between gap-4 rounded-xl border p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <NotebookPen
              className="text-primary size-[22px]"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <h2 className="text-headline-sm">Leave Status & Allowance (2026)</h2>
          </div>
          <span className="bg-surface-high text-muted-foreground text-label-xs border-outline-variant/20 rounded-full border px-2.5 py-0.5 font-medium">
            Standard {departmentName} Entitlement · Resets 31 Dec
          </span>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="border-outline-variant/30 bg-muted text-body-sm flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-medium">
            <CalendarDays className="text-outline size-4" strokeWidth={1.5} aria-hidden="true" />
            2026 Calendar Year
          </div>
          <Button
            type="button"
            className="text-label-md hover:bg-primary-deep h-9 rounded-xl px-3.5 shadow-sm"
          >
            <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Apply Leave on Behalf
          </Button>
        </div>
      </div>

      {leave.balances.length === 0 ? (
        <p className="text-muted-foreground text-sm">No leave balances recorded for this person.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {leave.balances.map((balance) => (
            <EmployeeLeaveBalanceCard
              key={balance.type}
              balance={balance}
              requests={leave.requests}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        {leave.requests.length === 0 ? (
          <p className="text-muted-foreground text-body-sm bg-card w-full flex-1 rounded-xl border p-5">
            No leave requests yet.
          </p>
        ) : (
          <EmployeeLeaveHistory requests={leave.requests} />
        )}
        <EmployeeLeaveSidebar holidays={holidays} managerName={managerName} />
      </div>
    </div>
  );
}
