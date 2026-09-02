import { Download, Plus, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { AddEmployeeDialog } from '../components/add-employee-dialog';
import { EmployeeFilters } from '../components/employee-filters';
import { EmployeeTable } from '../components/employee-table';
import { PageHeader } from '../components/page-header';
import type { Employee, EmploymentStatus, EmploymentType } from '../types';
import { useAdminState } from '../use-admin-state';

const pageSize = 8;

export function AdminEmployeesPage() {
  const { employees, addEmployee } = useAdminState();
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('all');
  const [status, setStatus] = useState<'all' | EmploymentStatus>('all');
  const [employmentType, setEmploymentType] = useState<'all' | EmploymentType>('all');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = useMemo(
    () => employees.filter((employee) => matchesFilters(employee, query, department, status, employmentType)),
    [employees, query, department, status, employmentType],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageNumber = Math.min(page, totalPages);
  const start = (pageNumber - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);

  return (
    <div>
      <PageHeader
        title="Employees"
        description={`${employees.length} people`}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                toast.message('Import will be available with file storage.');
              }}
            >
              <Upload aria-hidden="true" />
              Import
            </Button>
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
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setDialogOpen(true);
              }}
            >
              <Plus aria-hidden="true" />
              Add employee
            </Button>
          </>
        }
      />

      <div className="bg-card overflow-hidden rounded-xl border">
        <EmployeeFilters
          query={query}
          department={department}
          status={status}
          employmentType={employmentType}
          onQueryChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          onDepartmentChange={(value) => {
            setDepartment(value);
            setPage(1);
          }}
          onStatusChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          onEmploymentTypeChange={(value) => {
            setEmploymentType(value);
            setPage(1);
          }}
        />

        {filtered.length === 0 ? (
          <p className="text-muted-foreground px-4 py-10 text-center text-sm">No employees match these filters.</p>
        ) : (
          <EmployeeTable
            employees={visible}
            selectedIds={selectedIds}
            onToggle={(id) => {
              setSelectedIds((current) => toggleId(current, id));
            }}
            onToggleAll={(checked) => {
              setSelectedIds((current) => {
                const next = new Set(current);
                for (const employee of visible) {
                  if (checked) {
                    next.add(employee.id);
                  } else {
                    next.delete(employee.id);
                  }
                }
                return next;
              });
            }}
          />
        )}

        <div className="text-muted-foreground flex items-center justify-between px-3 py-2.5 text-xs">
          <p>
            Showing {filtered.length === 0 ? 0 : start + 1}–{Math.min(start + pageSize, filtered.length)} of{' '}
            {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2"
              disabled={pageNumber <= 1}
              onClick={() => {
                setPage(pageNumber - 1);
              }}
            >
              Previous
            </Button>
            <span className="px-2">
              {pageNumber} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2"
              disabled={pageNumber >= totalPages}
              onClick={() => {
                setPage(pageNumber + 1);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <AddEmployeeDialog
        open={dialogOpen}
        nextEmployeeId={nextEmployeeId(employees)}
        onOpenChange={setDialogOpen}
        onSave={(input) => {
          const created = addEmployee(input);
          toast.success(`Created ${created.fullName}.`);
        }}
      />
    </div>
  );
}

function matchesFilters(
  employee: Employee,
  query: string,
  department: string,
  status: 'all' | EmploymentStatus,
  employmentType: 'all' | EmploymentType,
): boolean {
  const needle = query.trim().toLowerCase();
  const haystack = `${employee.fullName} ${employee.workEmail} ${employee.employeeId}`.toLowerCase();

  return (
    (needle.length === 0 || haystack.includes(needle)) &&
    (department === 'all' || employee.department === department) &&
    (status === 'all' || employee.status === status) &&
    (employmentType === 'all' || employee.employmentType === employmentType)
  );
}

function toggleId(current: Set<string>, id: string): Set<string> {
  const next = new Set(current);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

function nextEmployeeId(employees: Employee[]): string {
  const maxCode = employees.reduce((highest, employee) => {
    const numeric = Number(employee.employeeId.replace('EMP-', ''));
    return Number.isFinite(numeric) ? Math.max(highest, numeric) : highest;
  }, 0);

  return `EMP-${String(maxCode + 1).padStart(4, '0')}`;
}
