import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import { PageTitle } from '@/components/page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDashboard } from '@/features/dashboard/api/dashboard-queries';
import type { EmployeeDetail } from '@/features/employees/api/employees-api';
import { AddEmployeeDialog } from '@/features/employees/components/add-employee-dialog';
import { useEmployees } from '@/features/employees/api/employees-queries';
import { initials } from '@/lib/initials';
import { cn } from '@/lib/utils';

export function AdminEmployeesPage() {
  const [params, setParams] = useSearchParams();
  const department = params.get('department') ?? 'All';
  const search = params.get('q') ?? '';
  const [adding, setAdding] = useState(false);
  const roster = useEmployees({ pageSize: 100 });
  const dashboard = useDashboard();

  const employees = useMemo(() => roster.data?.items ?? [], [roster.data]);
  const departments = useMemo(() => {
    const counts = new Map<string, number>();
    for (const employee of employees) {
      counts.set(employee.departmentName, (counts.get(employee.departmentName) ?? 0) + 1);
    }
    return [...counts.entries()].sort((left, right) => left[0].localeCompare(right[0]));
  }, [employees]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return employees.filter((employee) => {
      const deptOk = department === 'All' || employee.departmentName === department;
      if (!deptOk) {
        return false;
      }

      if (term.length === 0) {
        return true;
      }

      return (
        employee.fullName.toLowerCase().includes(term) ||
        employee.employeeNumber.toLowerCase().includes(term) ||
        employee.title.toLowerCase().includes(term) ||
        employee.workEmail.toLowerCase().includes(term)
      );
    });
  }, [department, employees, search]);

  const nextNumber = nextEmployeeNumber(employees);

  if (roster.isPending) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (roster.isError) {
    return (
      <p role="alert" className="text-destructive p-6 text-sm">
        {roster.error.message}
      </p>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <p className="text-muted-foreground text-xs">Home / Employees / Directory</p>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <PageTitle>Employees</PageTitle>
          <p className="text-muted-foreground text-sm">
            Roster for Acme Consulting. Create, view, and update people in this tenant.
          </p>
        </div>
        <Button type="button" onClick={() => setAdding(true)}>
          + Add employee
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          <FilterChip
            label={`All (${String(employees.length)})`}
            active={department === 'All'}
            onClick={() => {
              const next = new URLSearchParams(params);
              next.delete('department');
              setParams(next);
            }}
          />
          {departments.map(([name, count]) => (
            <FilterChip
              key={name}
              label={`${name} (${String(count)})`}
              active={department === name}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set('department', name);
                setParams(next);
              }}
            />
          ))}
        </div>
        <p className="text-muted-foreground text-xs">
          {dashboard.data
            ? `${String(dashboard.data.present)} Present · ${String(dashboard.data.lateToday)} Late · ${String(dashboard.data.onLeave)} Leave`
            : null}
        </p>
      </div>

      <Input
        value={search}
        onChange={(event) => {
          const next = new URLSearchParams(params);
          if (event.target.value.length === 0) {
            next.delete('q');
          } else {
            next.set('q', event.target.value);
          }
          setParams(next);
        }}
        placeholder="Search name, EMP-ID, or role…"
        aria-label="Search employees"
      />

      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-10 text-center text-sm">
          No employees match this filter. Add the first person with Add employee.
        </p>
      ) : (
        <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>EMP ID</TableHead>
                <TableHead>Workstation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((employee) => (
                <EmployeeRow key={employee.id} employee={employee} />
              ))}
            </TableBody>
          </Table>
          <p className="text-muted-foreground border-t px-4 py-3 text-xs">
            Showing {filtered.length} of {employees.length} employees
          </p>
        </div>
      )}

      {adding ? <AddEmployeeDialog nextNumber={nextNumber} onClose={() => setAdding(false)} /> : null}
    </div>
  );
}

function EmployeeRow({ employee }: { employee: EmployeeDetail }) {
  return (
    <TableRow>
      <TableCell>
        <Link to={`/admin/employees/${employee.id}`} className="flex items-center gap-2">
          <div className="bg-muted grid size-8 place-items-center rounded-full text-xs font-semibold">
            {initials(employee.fullName)}
          </div>
          <div>
            <p className="font-medium">
              {employee.fullName}
              {employee.isAdmin ? (
                <Badge variant="pending" className="ml-1.5">
                  Admin
                </Badge>
              ) : null}
            </p>
            <p className="text-muted-foreground text-xs">
              {employee.title} · {employee.departmentName}
              {employee.teamName ? ` · ${employee.teamName}` : ''}
            </p>
            <p className="text-muted-foreground text-xs">
              {employee.managerName ? `${employee.managerName} · ` : ''}
              {employee.workEmail}
            </p>
          </div>
        </Link>
      </TableCell>
      <TableCell>{employee.employeeNumber}</TableCell>
      <TableCell>
        {employee.location}
        {employee.deskLabel ? ` · ${employee.deskLabel}` : ''}
      </TableCell>
      <TableCell>
        <Badge
          variant={
            employee.status === 'Remote' ? 'pending' : employee.status === 'Probation' ? 'late' : 'present'
          }
        >
          {employee.status}
        </Badge>
      </TableCell>
      <TableCell>{employee.phone || '—'}</TableCell>
    </TableRow>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md border px-2.5 py-1 text-xs font-medium',
        active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground',
      )}
    >
      {label}
    </button>
  );
}

function nextEmployeeNumber(employees: EmployeeDetail[]): string {
  let max = 1048;
  for (const employee of employees) {
    const match = /^EMP-(\d+)$/.exec(employee.employeeNumber);
    const digits = match?.[1];
    if (digits === undefined) {
      continue;
    }

    const value = Number(digits);
    if (Number.isFinite(value) && value > max) {
      max = value;
    }
  }

  return `EMP-${String(max + 1).padStart(4, '0')}`;
}
