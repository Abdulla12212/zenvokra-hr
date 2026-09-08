import { useState } from 'react';
import { Calendar, FileDown, Mail, MapPin, Pencil, Phone, Shield } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router';

import { AdminBreadcrumb } from '@/app/layout/admin-breadcrumb';
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

/** Admin employee detail: attendance calendar and leave balances. */
export function AdminEmployeePage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const employeeId = params.employeeId ?? '';
  const [tab, setTab] = useState<EmployeeTab>(
    searchParams.get('tab') === 'leave' ? 'leave' : 'calendar',
  );
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
    <div className="flex flex-col gap-6 px-4 py-4 pb-10 md:px-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <AdminBreadcrumb
          items={[
            { label: 'Employees', to: '/admin/employees' },
            { label: employee.fullName },
            { label: employee.employeeNumber },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            className="text-label-md bg-card h-9 rounded-xl border-0 shadow-sm"
            onClick={() => setEditing(true)}
          >
            <Pencil className="text-outline size-4" strokeWidth={1.5} aria-hidden="true" />
            Edit Profile
          </Button>
          <Button
            type="button"
            variant="outline"
            className="text-label-md bg-card h-9 rounded-xl border-0 shadow-sm"
          >
            <FileDown className="text-outline size-4" strokeWidth={1.5} aria-hidden="true" />
            Export PDF
          </Button>
          <Button
            type="button"
            className="text-label-md hover:bg-primary-deep h-9 rounded-xl px-4 shadow-sm"
          >
            <Shield className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Manage Access
          </Button>
        </div>
      </div>

      <div className="bg-card flex flex-col justify-between gap-6 rounded-xl border p-4 shadow-sm lg:flex-row lg:items-start lg:p-6">
        <div className="flex min-w-0 flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <div className="bg-primary text-primary-foreground text-headline-lg grid size-16 place-items-center rounded-2xl font-bold shadow-sm sm:size-20">
              {initials(employee.fullName)}
            </div>
            {employee.status === 'Active' ? (
              <span
                className="bg-success ring-card absolute right-1 bottom-1 grid size-4 place-items-center rounded-full ring-2"
                title="Active On Duty"
              >
                <span className="bg-card size-2 animate-pulse rounded-full" />
              </span>
            ) : null}
          </div>
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
              <h1 className="text-headline-lg">{employee.fullName}</h1>
              {employee.isAdmin ? <Badge variant="pending">Admin</Badge> : null}
              {employee.teamName ? (
                <Badge>
                  {employee.departmentName} · {employee.teamName}
                </Badge>
              ) : (
                <Badge>{employee.departmentName}</Badge>
              )}
              <Badge variant="present">
                {employee.status}
                {employee.status === 'Active' ? ' · On duty' : ''}
              </Badge>
            </div>
            <p className="text-muted-foreground text-body-md mb-3">
              {employee.title} · {employee.location}
            </p>
            <div className="text-muted-foreground text-body-sm flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="text-outline size-4" strokeWidth={1.5} aria-hidden="true" />
                {employee.workEmail}
              </span>
              {employee.phone ? (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="text-outline size-4" strokeWidth={1.5} aria-hidden="true" />
                  {employee.phone}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="text-outline size-4" strokeWidth={1.5} aria-hidden="true" />
                {employee.deskLabel || employee.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="text-outline size-4" strokeWidth={1.5} aria-hidden="true" />
                Hired {employee.startedOn} · {employee.employmentType}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-muted flex min-w-[200px] flex-col justify-center gap-2 rounded-xl p-3.5 sm:flex-col">
          <div className="flex items-center justify-between gap-4">
            <span className="text-outline text-label-xs font-semibold tracking-wider uppercase">
              Current shift
            </span>
            <span className="text-title-md font-bold">{employee.hoursLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-outline text-label-xs font-semibold tracking-wider uppercase">
              Workstation
            </span>
            <span className="text-body-md font-medium">{employee.location}</span>
          </div>
        </div>
      </div>

      <div className="text-label-md flex items-center gap-1 overflow-x-auto border-b">
        <TabButton active={tab === 'calendar'} onClick={() => setTab('calendar')}>
          Attendance Calendar
        </TabButton>
        <TabButton active={tab === 'leave'} onClick={() => setTab('leave')}>
          Leave & Balances
        </TabButton>
      </div>

      {tab === 'calendar' ? (
        <EmployeeMonthCalendar
          employeeId={employee.id}
          day={day}
          hoursLabel={employee.hoursLabel}
          onSelectDay={setDay}
        />
      ) : null}

      {tab === 'leave' ? <LeaveTab leaveQuery={leaveQuery} /> : null}

      {editing ? (
        <EditEmployeeDialog employee={employee} onClose={() => setEditing(false)} />
      ) : null}
    </div>
  );
}

function LeaveTab({ leaveQuery }: { leaveQuery: ReturnType<typeof useEmployeeLeave> }) {
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
        <strong className="text-title-md">Leave status & allowance (2026)</strong>
        <p className="text-muted-foreground text-label-xs">Standard entitlement · Resets 31 Dec</p>
      </div>
      {leave.balances.length === 0 ? (
        <p className="text-muted-foreground text-sm">No leave balances recorded for this person.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {leave.balances.map((balance) => {
            const used = Math.max(0, balance.total - balance.remaining);
            const percent = balance.total === 0 ? 0 : (used / balance.total) * 100;
            return (
              <div key={balance.type} className="bg-card rounded-xl border p-4 shadow-sm">
                <p className="text-muted-foreground text-label-xs font-medium tracking-wide uppercase">
                  {balance.type}
                </p>
                <p className="text-headline-sm mt-1 font-semibold">
                  {balance.remaining} / {balance.total}
                </p>
                <ProgressBar value={percent} className="my-2" />
                <p className="text-muted-foreground text-label-xs">
                  Used {used} · Left {balance.remaining}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        <strong className="text-title-md">Leave history</strong>
        {leave.requests.length === 0 ? (
          <p className="text-muted-foreground text-sm">No leave requests yet.</p>
        ) : (
          leave.requests.map((request) => (
            <div key={request.id} className="bg-card rounded-xl border px-4 py-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-body-sm font-medium">
                    {request.type} · {request.days} day{request.days === 1 ? '' : 's'}
                  </p>
                  <p className="text-muted-foreground text-label-xs">{request.datesLabel}</p>
                  {request.note ? (
                    <p className="text-muted-foreground text-label-xs mt-1">{request.note}</p>
                  ) : null}
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
        'shrink-0 px-4 py-2.5 whitespace-nowrap',
        active
          ? 'text-primary border-primary border-b-2 font-semibold'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}
