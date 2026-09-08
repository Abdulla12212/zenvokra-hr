import { Home, IdCard } from 'lucide-react';

export function EmployeeStatusBadge({ status }: { status: string }) {
  if (status === 'Remote') {
    return (
      <span className="bg-info-muted text-primary-deep text-label-xs inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold">
        <Home className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
        Remote
      </span>
    );
  }

  if (status === 'Probation') {
    return (
      <span className="bg-info-muted text-muted-foreground text-label-xs inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold">
        <IdCard className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
        Probation
      </span>
    );
  }

  return (
    <span className="bg-success-muted text-success text-label-xs inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold">
      <span className="bg-success size-1.5 rounded-full" aria-hidden="true" />
      {status}
    </span>
  );
}
