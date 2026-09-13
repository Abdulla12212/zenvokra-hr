import { PageTitle } from '@/components/page-title';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { useCurrentEmployee } from '../api/employees-queries';

export function EmployeeProfilePage() {
  const employeeQuery = useCurrentEmployee();
  const employee = employeeQuery.data;

  if (employeeQuery.isPending) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading profile</span>
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (employeeQuery.isError || !employee) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {employeeQuery.error?.message ?? 'Could not load your profile.'}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <PageTitle>Profile</PageTitle>

      <div className="bg-card mb-4 flex items-center gap-4 rounded-xl border p-4 shadow-sm">
        <div className="bg-primary text-primary-foreground grid size-16 place-items-center rounded-full text-lg font-semibold">
          {initials(employee.fullName)}
        </div>
        <div>
          <p className="text-base font-semibold">{employee.fullName}</p>
          <p className="text-muted-foreground text-xs">
            {employee.title} · {employee.employeeNumber}
          </p>
          <p className="text-muted-foreground text-xs">{employee.workEmail}</p>
        </div>
        <Badge className="ml-auto">{employee.employmentType}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
            Employment
          </p>
          <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2.5 text-sm">
            <dt className="text-muted-foreground">Department</dt>
            <dd className="font-medium">{employee.departmentName}</dd>
            <dt className="text-muted-foreground">Location</dt>
            <dd className="font-medium">{employee.location || '—'}</dd>
            <dt className="text-muted-foreground">Manager</dt>
            <dd className="font-medium">{employee.managerName || '—'}</dd>
            <dt className="text-muted-foreground">Started</dt>
            <dd className="font-medium">{formatStartedOn(employee.startedOn)}</dd>
          </dl>
        </div>
        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
            Schedule
          </p>
          <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2.5 text-sm">
            <dt className="text-muted-foreground">Hours</dt>
            <dd className="font-medium">{employee.hoursLabel}</dd>
            <dt className="text-muted-foreground">Days</dt>
            <dd className="font-medium">{employee.workingDaysLabel}</dd>
            <dt className="text-muted-foreground">Timezone</dt>
            <dd className="font-medium">{employee.timeZone}</dd>
            <dt className="text-muted-foreground">Emergency</dt>
            <dd className="font-medium">{employee.emergencyContact || '—'}</dd>
          </dl>
          <p className="text-muted-foreground mt-4 text-xs">
            Record changes go through People Ops.
          </p>
        </div>
      </div>
    </div>
  );
}

function initials(fullName: string): string {
  const parts = fullName.split(' ').filter((part) => part.length > 0);
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '');
  return letters.join('') || '?';
}

function formatStartedOn(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) {
    return isoDate;
  }

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const monthLabel = months[Number(month) - 1];
  return monthLabel ? `${String(Number(day))} ${monthLabel} ${year}` : isoDate;
}
