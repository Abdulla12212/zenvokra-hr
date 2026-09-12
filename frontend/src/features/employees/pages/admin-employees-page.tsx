import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import type { Employee } from '../api/employees-api';
import { useEmployees } from '../api/employees-queries';
import { AddEmployeeDialog } from '../components/add-employee-dialog';
import { EditEmployeeDialog } from '../components/edit-employee-dialog';
import { EmployeeTable } from '../components/employee-table';

export function AdminEmployeesPage() {
  const { data, isPending, isError, error } = useEmployees();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-muted-foreground text-sm">
            Add people to this company. Each employee gets their own login email and password.
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          Add employee
        </Button>
      </header>

      <AddEmployeeDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditEmployeeDialog employee={editing} onClose={() => setEditing(null)} />

      {isPending ? <LoadingState /> : null}

      {isError ? (
        <p role="alert" className="text-destructive text-sm">
          {error.message}
        </p>
      ) : null}

      {data ? (
        data.items.length > 0 ? (
          <div className="space-y-3">
            <EmployeeTable employees={data.items} onEdit={setEditing} />
            <p className="text-muted-foreground text-xs">
              {data.totalCount} employee{data.totalCount === 1 ? '' : 's'}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No employees yet. Add the first person so they can sign in to the employee app.
          </p>
        )
      ) : null}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-2" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading employees</span>
      {[0, 1, 2].map((row) => (
        <Skeleton key={row} className="h-10 w-full" />
      ))}
    </div>
  );
}
