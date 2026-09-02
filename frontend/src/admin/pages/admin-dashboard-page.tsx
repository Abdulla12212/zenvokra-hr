import { Download } from 'lucide-react';
import { Link } from 'react-router';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { AttendanceTodayPanel } from '../components/attendance-today-panel';
import { HeadcountByDepartmentPanel } from '../components/headcount-by-department-panel';
import { KpiCard } from '../components/kpi-card';
import { LeaveThisWeekPanel } from '../components/leave-this-week-panel';
import { PageHeader } from '../components/page-header';
import { PendingApprovalsPanel } from '../components/pending-approvals-panel';
import { companyName, dashboardDateLabel, seedAttendanceToday, seedLeaveThisWeek, weekHours } from '../data/seed';
import { useAdminState } from '../use-admin-state';

export function AdminDashboardPage() {
  const { employees, approvals } = useAdminState();
  const activeCount = employees.filter((employee) => employee.status === 'active').length;
  const lateCount = seedAttendanceToday.filter((row) => row.status === 'late').length;
  const onLeaveCount = uniqueLeavePeople(seedLeaveThisWeek);
  const presentCount = Math.max(activeCount - onLeaveCount - lateCount, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        description={`${dashboardDateLabel} · ${companyName}`}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                toast.message('Export will be available when reports ship.');
              }}
            >
              <Download aria-hidden="true" />
              Export
            </Button>
            <Button type="button" size="sm" asChild>
              <Link to="/approvals">Review approvals</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Headcount" value={String(employees.length)} delta="↑ 2 vs last month" tone="positive" />
        <KpiCard label="Present" value={String(presentCount)} delta="↑ 3 vs yesterday" tone="positive" />
        <KpiCard label="On leave" value={String(onLeaveCount)} delta="↓ 1 vs yesterday" tone="negative" />
        <KpiCard label="Late" value={String(lateCount)} delta="↓ 2 vs yesterday" tone="negative" />
        <KpiCard
          label="Pending approvals"
          value={String(approvals.length)}
          delta="↑ 2 vs yesterday"
          tone="primary"
        />
        <KpiCard label="Hours this week" value={String(weekHours)} delta="↑ 52 vs last week" tone="positive" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.9fr)]">
        <PendingApprovalsPanel approvals={approvals} />
        <div className="space-y-3">
          <AttendanceTodayPanel rows={seedAttendanceToday} />
          <LeaveThisWeekPanel days={seedLeaveThisWeek} />
        </div>
      </div>

      <HeadcountByDepartmentPanel employees={employees} />
    </div>
  );
}

function uniqueLeavePeople(days: typeof seedLeaveThisWeek): number {
  const names = new Set<string>();

  for (const day of days) {
    for (const person of day.people) {
      names.add(person);
    }
  }

  return names.size;
}
