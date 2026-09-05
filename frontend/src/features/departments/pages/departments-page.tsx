import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useDepartments } from '../api/departments-queries';
import { DepartmentForm } from '../components/department-form';
import { DepartmentTable } from '../components/department-table';

/*
 * WALKING SKELETON: delete alongside the Departments feature.
 *
 * The shape to copy: the page owns loading, error, and empty states, and delegates
 * everything else to focused components. See docs/ADD-A-FEATURE.md.
 */
export function DepartmentsPage() {
  const { data, isPending, isError, error } = useDepartments();

  return (
    <div className="space-y-6 overflow-auto p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Departments</h1>
        <p className="text-muted-foreground text-sm">
          Scoped to the current tenant by the API. Another company&rsquo;s departments cannot appear
          here, no matter what this page asks for.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a department</CardTitle>
          <CardDescription>Names must be unique within a company.</CardDescription>
        </CardHeader>
        <CardContent>
          <DepartmentForm />
        </CardContent>
      </Card>

      {isPending ? <LoadingState /> : null}

      {isError ? (
        <p role="alert" className="text-destructive text-sm">
          {error.message}
        </p>
      ) : null}

      {data ? (
        data.items.length > 0 ? (
          <div className="space-y-3">
            <DepartmentTable departments={data.items} />
            <p className="text-muted-foreground text-xs">
              {data.totalCount} department{data.totalCount === 1 ? '' : 's'}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No departments yet. Add the first one above.
          </p>
        )
      ) : null}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-2" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading departments</span>
      {[0, 1, 2].map((row) => (
        <Skeleton key={row} className="h-10 w-full" />
      ))}
    </div>
  );
}
