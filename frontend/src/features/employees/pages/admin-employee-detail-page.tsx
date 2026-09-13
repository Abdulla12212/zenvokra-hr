import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { Employee } from '../api/employees-api';
import { useEmployee, useEmployeeLeave } from '../api/employees-queries';
import { EmployeeCalendarGrid } from '../components/employee-calendar-grid';
import { EditEmployeeDialog } from '../components/edit-employee-dialog';
import { EmployeeStatusBadge } from '../components/employee-status-badge';

type DetailTab = 'calendar' | 'leave';

export function AdminEmployeeDetailPage() {
  const { employeeId } = useParams();
  const id = employeeId ?? '';
  const query = useEmployee(id);
  const [tab, setTab] = useState<DetailTab>('calendar');
  const [editing, setEditing] = useState<Employee | null>(null);
  const today = new Date();
  const [month, setMonth] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });
  const [day, setDay] = useState(today.getDate());

  if (query.isPending) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading employee</span>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {query.error.message}
      </p>
    );
  }

  const employee = query.data;

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        <Link to="/admin/employees" className="hover:underline">
          Employees
        </Link>
        {' / '}
        <span className="text-foreground">{employee.fullName}</span>
      </p>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{employee.fullName}</h1>
          <p className="text-muted-foreground text-sm">
            {employee.employeeNumber} · {employee.title} · {employee.departmentName}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <EmployeeStatusBadge status={employee.status} />
            <span className="text-muted-foreground text-xs">{employee.workEmail}</span>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setEditing(employee);
          }}
        >
          Edit profile
        </Button>
      </header>

      <EditEmployeeDialog employee={editing} onClose={() => setEditing(null)} />

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={tab === 'calendar' ? 'default' : 'outline'}
          onClick={() => {
            setTab('calendar');
          }}
        >
          Attendance calendar
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === 'leave' ? 'default' : 'outline'}
          onClick={() => {
            setTab('leave');
          }}
        >
          Leave & balances
        </Button>
      </div>

      {tab === 'calendar' ? (
        <EmployeeCalendarGrid
          employeeId={employee.id}
          year={month.year}
          month={month.month}
          day={day}
          onMonthChange={(nextYear, nextMonth) => {
            setMonth({ year: nextYear, month: nextMonth });
            setDay(1);
          }}
          onSelectDay={setDay}
        />
      ) : (
        <EmployeeLeaveTab employeeId={employee.id} />
      )}
    </div>
  );
}

function EmployeeLeaveTab({ employeeId }: { employeeId: string }) {
  const query = useEmployeeLeave(employeeId);

  if (query.isPending) {
    return (
      <div className="space-y-3" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading leave</span>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {query.error.message}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {query.data.balances.length === 0 ? (
        <p className="text-muted-foreground text-sm">No leave balances yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {query.data.balances.map((balance) => (
            <div key={balance.type} className="bg-card rounded-xl border p-4">
              <p className="text-muted-foreground text-xs">{balance.type}</p>
              <p className="text-xl font-semibold">
                {balance.remaining} / {balance.total}
              </p>
            </div>
          ))}
        </div>
      )}

      {query.data.requests.length === 0 ? (
        <p className="text-muted-foreground text-sm">No leave requests yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dates</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.data.requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <p className="font-medium">{request.datesLabel}</p>
                  {request.note ? <p className="text-muted-foreground text-xs">{request.note}</p> : null}
                </TableCell>
                <TableCell>{request.type}</TableCell>
                <TableCell>{request.days}</TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
