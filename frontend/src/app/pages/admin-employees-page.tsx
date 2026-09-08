import { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Building2,
  ChevronDown,
  Clock,
  Columns3,
  Download,
  Home,
  MapPin,
  MoreVertical,
  Phone,
  Search,
  SlidersHorizontal,
  UserCog,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router';

import { AdminAddEmployeeButton } from '@/app/layout/admin-add-employee-button';
import { AdminBreadcrumb } from '@/app/layout/admin-breadcrumb';
import { AdminFilterChip } from '@/app/layout/admin-filter-chip';
import { AdminInitials } from '@/app/layout/admin-initials';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDashboard } from '@/features/dashboard/api/dashboard-queries';
import type { EmployeeDetail } from '@/features/employees/api/employees-api';
import { AddEmployeeDialog } from '@/features/employees/components/add-employee-dialog';
import { EmployeeLeaveCell } from '@/features/employees/components/employee-leave-cell';
import { EmployeeStatusBadge } from '@/features/employees/components/employee-status-badge';
import { useEmployees } from '@/features/employees/api/employees-queries';
import { cn } from '@/lib/utils';

export function AdminEmployeesPage() {
  const [params, setParams] = useSearchParams();
  const department = params.get('department') ?? 'All';
  const search = params.get('q') ?? '';
  const status = params.get('status') ?? 'All';
  const location = params.get('location') ?? 'All';
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

  const locations = useMemo(() => {
    return [...new Set(employees.map((employee) => employee.location))].sort();
  }, [employees]);

  const statuses = useMemo(() => {
    return [...new Set(employees.map((employee) => employee.status))].sort();
  }, [employees]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return employees.filter((employee) => {
      const deptOk = department === 'All' || employee.departmentName === department;
      const statusOk = status === 'All' || employee.status === status;
      const locationOk = location === 'All' || employee.location === location;
      if (!deptOk || !statusOk || !locationOk) {
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
  }, [department, employees, location, search, status]);

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

  function setParam(key: string, value: string, allValue = 'All') {
    const next = new URLSearchParams(params);
    if (value === allValue || value.length === 0) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setParams(next);
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:px-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <AdminBreadcrumb items={[{ label: 'Employees', heading: true }, { label: 'Directory' }]} />
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            className="text-body-sm bg-card h-9 rounded-xl border-0 px-3.5 font-medium shadow-sm"
          >
            <Download className="text-outline size-[18px]" strokeWidth={1.5} aria-hidden="true" />
            Export Roster (CSV)
          </Button>
          <AdminAddEmployeeButton onClick={() => setAdding(true)} />
        </div>
      </div>

      <div className="bg-card flex flex-col gap-3 rounded-xl p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 overflow-x-auto">
            <AdminFilterChip
              label="All"
              count={employees.length}
              active={department === 'All'}
              onClick={() => setParam('department', 'All')}
            />
            {departments.map(([name, count]) => (
              <AdminFilterChip
                key={name}
                label={name}
                count={count}
                active={department === name}
                onClick={() => setParam('department', name)}
              />
            ))}
          </div>
          {dashboard.data ? (
            <span className="bg-muted text-muted-foreground text-label-xs inline-flex items-center gap-1 rounded-full px-2.5 py-1">
              <span className="bg-success size-2 rounded-full" aria-hidden="true" />
              {dashboard.data.present} Present
              <span className="text-outline">·</span>
              {dashboard.data.lateToday} Late
              <span className="text-outline">·</span>
              {dashboard.data.onLeave} Leave
            </span>
          ) : null}
        </div>

        <div className="flex flex-col items-center justify-between gap-3 pt-2 lg:flex-row">
          <label className="relative w-full lg:w-96">
            <span className="sr-only">Search employees</span>
            <Search
              className="text-outline pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(event) => setParam('q', event.target.value, '')}
              placeholder="Search employee name, EMP-ID, or role..."
              aria-label="Search employees"
              className="bg-muted text-body-sm h-9 rounded-xl border-0 pr-14 pl-9"
            />
            <kbd className="bg-secondary text-muted-foreground text-micro pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded px-1.5 py-0.5 leading-none">
              ⌘K
            </kbd>
          </label>
          <div className="flex w-full items-center gap-2 overflow-x-auto lg:w-auto">
            <FilterSelect
              icon={SlidersHorizontal}
              label="Status"
              value={status === 'All' ? 'All Live' : status}
              options={['All', ...statuses]}
              onChange={(value) => setParam('status', value)}
            />
            <FilterSelect
              icon={MapPin}
              label="Location"
              value={location === 'All' ? 'All locations' : location}
              options={['All', ...locations]}
              onChange={(value) => setParam('location', value)}
            />
            <span className="bg-muted text-foreground text-body-sm inline-flex h-9 items-center gap-2 rounded-xl px-3 font-medium">
              <Clock className="text-outline size-4" strokeWidth={1.5} aria-hidden="true" />
              Shift: <strong>Regular (09:00 - 18:00)</strong>
            </span>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-10 text-center text-sm">
          No employees match this filter. Add the first person with Add employee.
        </p>
      ) : (
        <div className="bg-card flex flex-col overflow-hidden rounded-xl shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-outline text-label-xs font-semibold tracking-wider uppercase">
              All Employees ({employees.length} Active)
            </p>
            <div className="flex items-center gap-2">
              <span className="bg-muted text-muted-foreground text-label-md inline-flex h-8 items-center gap-1.5 rounded-xl px-2.5">
                <Columns3 className="size-4" strokeWidth={1.5} aria-hidden="true" />
                Columns
              </span>
              <span className="bg-muted text-muted-foreground text-label-md inline-flex h-8 items-center gap-1.5 rounded-xl px-2.5">
                <ArrowUpDown className="size-4" strokeWidth={1.5} aria-hidden="true" />
                Sort: Name (A-Z)
              </span>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="px-4">Employee</TableHead>
                <TableHead className="px-4">EMP ID</TableHead>
                <TableHead className="px-4">Workstation</TableHead>
                <TableHead className="px-4">Status</TableHead>
                <TableHead className="px-4">Contact</TableHead>
                <TableHead className="px-4">Leave</TableHead>
                <TableHead className="px-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((employee, index) => (
                <EmployeeRow key={employee.id} employee={employee} striped={index % 2 === 1} />
              ))}
            </TableBody>
          </Table>
          <p className="text-muted-foreground text-label-xs border-t px-4 py-3">
            Showing {filtered.length} of {employees.length} employees
          </p>
        </div>
      )}

      {adding ? (
        <AddEmployeeDialog nextNumber={nextNumber} onClose={() => setAdding(false)} />
      ) : null}
    </div>
  );
}

function EmployeeRow({ employee, striped }: { employee: EmployeeDetail; striped: boolean }) {
  const remote = employee.location.toLowerCase().includes('remote');

  return (
    <TableRow className={cn('group', striped && 'bg-muted/30')}>
      <TableCell className="px-4 py-3">
        <Link to={`/admin/employees/${employee.id}`} className="flex items-center gap-3">
          <AdminInitials name={employee.fullName} tone={employee.isAdmin ? 'primary' : 'muted'} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="group-hover:text-primary text-title-md font-semibold">
                {employee.fullName}
              </span>
              {employee.isAdmin ? (
                <span className="bg-muted text-muted-foreground text-micro rounded px-1.5 font-semibold">
                  Admin
                </span>
              ) : null}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground text-body-sm truncate font-medium">
                {employee.title} · {employee.departmentName}
                {employee.teamName ? ` · ${employee.teamName}` : ''}
              </span>
              {employee.managerName ? (
                <span className="bg-muted text-muted-foreground text-label-xs inline-flex items-center gap-0.5 rounded px-1.5 font-medium">
                  <UserCog className="text-outline size-3.5" strokeWidth={1.5} aria-hidden="true" />
                  Mgr: {employee.managerName}
                </span>
              ) : null}
            </div>
            <p className="text-outline text-label-xs truncate">{employee.workEmail}</p>
          </div>
        </Link>
      </TableCell>
      <TableCell className="px-4 py-3">
        <span className="bg-surface-high text-muted-foreground text-label-xs inline-flex rounded-md px-2 py-0.5 font-semibold">
          {employee.employeeNumber}
        </span>
      </TableCell>
      <TableCell className="px-4 py-3">
        <p className="text-body-sm flex items-center gap-1">
          {remote ? (
            <Home className="text-outline size-3.5" strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <Building2 className="text-outline size-3.5" strokeWidth={1.5} aria-hidden="true" />
          )}
          {employee.location}
        </p>
        {employee.deskLabel ? (
          <p className="text-outline text-label-xs">{employee.deskLabel}</p>
        ) : null}
      </TableCell>
      <TableCell className="px-4 py-3">
        <EmployeeStatusBadge status={employee.status} />
      </TableCell>
      <TableCell className="px-4 py-3">
        <p className="text-body-sm flex items-center gap-1.5 font-medium">
          <Phone className="text-outline size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          {employee.phone || '—'}
        </p>
      </TableCell>
      <TableCell className="px-4 py-3">
        <EmployeeLeaveCell
          employeeId={employee.id}
          remaining={employee.leaveRemaining ?? 0}
          balances={employee.leaveBalances ?? []}
        />
      </TableCell>
      <TableCell className="px-4 py-3 text-right">
        <Link
          to={`/admin/employees/${employee.id}`}
          className="text-outline hover:bg-muted hover:text-foreground inline-flex rounded-xl p-1.5"
          aria-label={`Open ${employee.fullName}`}
        >
          <MoreVertical className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </Link>
      </TableCell>
    </TableRow>
  );
}

function FilterSelect({
  icon: Icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="bg-muted text-body-sm relative inline-flex h-9 items-center gap-2 rounded-xl px-3 font-medium">
      <Icon className="text-outline size-4" strokeWidth={1.5} aria-hidden="true" />
      <span>
        {label}: <strong>{value}</strong>
      </span>
      <ChevronDown className="text-outline size-4" strokeWidth={1.5} aria-hidden="true" />
      <select
        aria-label={label}
        className="absolute inset-0 cursor-pointer opacity-0"
        value={value === 'All Live' || value === 'All locations' ? 'All' : value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === 'All' ? `All ${label.toLowerCase()}` : option}
          </option>
        ))}
      </select>
    </label>
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
