import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { PageTitle } from '@/components/page-title';
import { ProgressBar } from '@/components/progress-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EditEmployeeDialog } from '@/features/employees/components/edit-employee-dialog';
import { EmployeeMonthCalendar } from '@/features/employees/components/employee-month-calendar';
import { useEmployee, useEmployeeLeave } from '@/features/employees/api/employees-queries';
import { initials } from '@/lib/initials';
import { cn } from '@/lib/utils';

type EmployeeTab = 'calendar' | 'leave';

export function AdminEmployeePage() {
  const params = useParams();
  const employeeId = params.employeeId ?? '';
  const [tab, setTab] = useState<EmployeeTab>('leave');
  const [editing, setEditing] = useState(false);
  const [day, setDay] = useState(20);
  const employeeQuery = useEmployee(employeeId);
  const leaveQuery = useEmployeeLeave(employeeId);

  if (employeeQuery.isPending) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (employeeQuery.isError) {
    return (
      <p role="alert" className="text-destructive p-6 text-sm">
        {employeeQuery.error.message}
      </p>
    );
  }

  const employee = employeeQuery.data;

  return (
    <div className="space-y-4 p-6">
      <p className="text-muted-foreground text-xs">
        <Link to="/admin/employees" className="hover:text-foreground">
          Employees
        </Link>
        {' / '}
        <b className="text-foreground">{employee.fullName}</b> / {employee.employeeNumber}
      </p>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle>{employee.fullName}</PageTitle>
        <Button type="button" variant="outline" onClick={() => setEditing(true)}>
          Edit profile
        </Button>
      </div>

      <div className="bg-card flex flex-wrap items-start gap-4 rounded-xl border p-4 shadow-sm">
        <div className="bg-primary text-primary-foreground grid size-14 place-items-center rounded-full text-sm font-semibold">
          {initials(employee.fullName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <strong className="text-lg">{employee.fullName}</strong>
            {employee.isAdmin ? <Badge variant="pending">Admin</Badge> : null}
            <Badge variant="present">
              {employee.status}
              {employee.status === 'Active' ? ' · On duty' : ''}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {employee.title} · {employee.departmentName}
            {employee.teamName ? ` · ${employee.teamName}` : ''}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {employee.workEmail}
            {employee.phone ? ` · ${employee.phone}` : ''}
            {employee.deskLabel ? ` · ${employee.deskLabel}` : ''}
          </p>
          <p className="text-muted-foreground text-xs">
            Hired {employee.startedOn} · {employee.employmentType}
          </p>
        </div>
        <div className="text-sm">
          <p className="text-muted-foreground text-xs">Hours</p>
          <p className="font-medium">{employee.hoursLabel}</p>
          <p className="text-muted-foreground text-xs">{employee.location}</p>
        </div>
      </div>

      <div className="flex gap-4 border-b">
        <TabButton active={tab === 'calendar'} onClick={() => setTab('calendar')}>
          Attendance calendar
        </TabButton>
        <TabButton active={tab === 'leave'} onClick={() => setTab('leave')}>
          Leave & balances
        </TabButton>
      </div>

      {tab === 'calendar' ? (
        <EmployeeMonthCalendar employeeId={employee.id} day={day} onSelectDay={setDay} />
      ) : null}

      {tab === 'leave' ? (
        <LeaveTab leaveQuery={leaveQuery} />
      ) : null}

      {editing ? <EditEmployeeDialog employee={employee} onClose={() => setEditing(false)} /> : null}
    </div>
  );
}

function LeaveTab({
  leaveQuery,
}: {
  leaveQuery: ReturnType<typeof useEmployeeLeave>;
}) {
  if (leaveQuery.isPending) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (leaveQuery.isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {leaveQuery.error.message}
      </p>
    );
  }

  const leave = leaveQuery.data;

  return (
    <div className="space-y-4">
      <div>
        <strong>Leave status & allowance (2026)</strong>
        <p className="text-muted-foreground text-xs">Standard entitlement · Resets 31 Dec</p>
      </div>
      {leave.balances.length === 0 ? (
        <p className="text-muted-foreground text-sm">No leave balances recorded for this person.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {leave.balances.map((balance) => {
            const used = Math.max(0, balance.total - balance.remaining);
            const percent = balance.total === 0 ? 0 : (used / balance.total) * 100;
            return (
              <div key={balance.type} className="bg-card rounded-xl border p-4 shadow-sm">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {balance.type}
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {balance.remaining} / {balance.total}
                </p>
                <ProgressBar value={percent} className="my-2" />
                <p className="text-muted-foreground text-xs">
                  Used {used} · Left {balance.remaining}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        <strong>Leave history</strong>
        {leave.requests.length === 0 ? (
          <p className="text-muted-foreground text-sm">No leave requests yet.</p>
        ) : (
          leave.requests.map((request) => (
            <div key={request.id} className="bg-card rounded-xl border px-4 py-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {request.type} · {request.days} day{request.days === 1 ? '' : 's'}
                  </p>
                  <p className="text-muted-foreground text-xs">{request.datesLabel}</p>
                  {request.note ? <p className="text-muted-foreground mt-1 text-xs">{request.note}</p> : null}
                </div>
                <Badge
                  variant={
                    request.status === 'approved'
                      ? 'present'
                      : request.status === 'rejected'
                        ? 'rejected'
                        : 'pending'
                  }
                >
                  {request.statusLabel}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        '-mb-px border-b-2 pb-2 text-sm font-medium',
        active ? 'border-primary text-foreground' : 'text-muted-foreground border-transparent',
      )}
    >
      {children}
    </button>
  );
}
