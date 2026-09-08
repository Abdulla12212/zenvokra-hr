import { useState } from 'react';
import { ArrowLeft, Calendar, FileDown, Mail, MapPin, Pencil, Phone, Shield } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  expectedOutFromHours,
  formatClock12,
} from '@/features/employees/components/employee-calendar-format';
import { EditEmployeeDialog } from '@/features/employees/components/edit-employee-dialog';
import { EmployeeLeaveBalances } from '@/features/employees/components/employee-leave-balances';
import { EmployeeMonthCalendar } from '@/features/employees/components/employee-month-calendar';
import {
  useEmployee,
  useEmployeeAttendance,
  useEmployeeLeave,
} from '@/features/employees/api/employees-queries';
import { useClosedDays } from '@/features/leave/api/leave-queries';
import { initials } from '@/lib/initials';
import { cn } from '@/lib/utils';

type EmployeeTab = 'calendar' | 'leave';

/** Admin employee detail: attendance calendar and leave balances. */
export function AdminEmployeePage() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const employeeId = params.employeeId ?? '';
  const tab: EmployeeTab = searchParams.get('tab') === 'leave' ? 'leave' : 'calendar';
  const [editing, setEditing] = useState(false);
  const [day, setDay] = useState(20);
  const employeeQuery = useEmployee(employeeId);
  const leaveQuery = useEmployeeLeave(employeeId);
  const holidaysQuery = useClosedDays();
  const attendanceQuery = useEmployeeAttendance(employeeId, 'august', day);

  function selectTab(next: EmployeeTab) {
    if (next === 'leave') {
      setSearchParams({ tab: 'leave' }, { replace: true });
      return;
    }

    setSearchParams({}, { replace: true });
  }

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
  const todayStamp = attendanceQuery.data?.find((cell) => cell.today);
  const clockInLabel = formatClock12(todayStamp?.clockIn);
  const expectedOut = expectedOutFromHours(employee.hoursLabel);

  return (
    <div className="flex flex-col gap-6 px-4 py-4 pb-10 md:px-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/employees"
            className="text-label-md text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="size-[18px]" strokeWidth={1.5} aria-hidden="true" />
            Employees
          </Link>
          <span className="text-outline-variant text-label-md">/</span>
          <span className="text-title-md font-semibold">{employee.fullName}</span>
          <span className="bg-surface-high text-muted-foreground text-label-xs rounded-full px-2 py-0.5 font-semibold">
            {employee.employeeNumber}
          </span>
        </div>
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
              {employee.status === 'Active' ? (
                <span className="bg-success-muted text-success text-label-xs inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold">
                  <span className="bg-success size-1.5 animate-ping rounded-full" />
                  Active · On Duty
                </span>
              ) : (
                <Badge variant="present">{employee.status}</Badge>
              )}
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
        <div className="bg-muted flex min-w-[200px] flex-col justify-center gap-2 rounded-xl p-3.5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-outline text-label-xs font-semibold tracking-wider uppercase">
              Today's Clock In
            </span>
            <span className="text-title-md text-success font-bold">{clockInLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-outline text-label-xs font-semibold tracking-wider uppercase">
              Expected Out
            </span>
            <span className="text-body-md font-medium">{expectedOut}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-outline text-label-xs font-semibold tracking-wider uppercase">
              Current Shift
            </span>
            <span className="bg-surface-high text-muted-foreground text-label-xs rounded px-2 py-0.5 font-medium">
              Standard Day
            </span>
          </div>
        </div>
      </div>

      <div className="text-label-md flex items-center gap-1 overflow-x-auto border-b">
        <TabButton active={tab === 'calendar'} onClick={() => selectTab('calendar')}>
          Attendance Calendar
        </TabButton>
        <TabButton active={tab === 'leave'} onClick={() => selectTab('leave')}>
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

      {tab === 'leave' && leaveQuery.isPending ? <Skeleton className="h-48 w-full" /> : null}
      {tab === 'leave' && leaveQuery.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {leaveQuery.error.message}
        </p>
      ) : null}
      {tab === 'leave' && leaveQuery.data ? (
        <EmployeeLeaveBalances
          leave={leaveQuery.data}
          holidays={holidaysQuery.data ?? []}
          managerName={employee.managerName}
          departmentName={employee.departmentName}
        />
      ) : null}

      {editing ? (
        <EditEmployeeDialog employee={employee} onClose={() => setEditing(false)} />
      ) : null}
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
