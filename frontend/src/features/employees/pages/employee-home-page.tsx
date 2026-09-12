import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useCurrentEmployee } from '../api/employees-queries';

export function EmployeeHomePage({ companyName }: { companyName?: string }) {
  const employee = useCurrentEmployee();

  if (employee.isPending) {
    return (
      <div className="space-y-2" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading your profile</span>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (employee.isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {employee.error.message}
      </p>
    );
  }

  const person = employee.data;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Signed in as {person.fullName}. Time off and inbox land in a later slice.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{person.fullName}</CardTitle>
          <CardDescription>
            {person.employeeNumber} · {person.title} · {person.departmentName}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-1 text-sm">
          <p>{person.workEmail}</p>
          <p>{person.location || 'No location set'}</p>
          {companyName ? <p>{companyName}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
