import { TriangleAlert } from 'lucide-react';

export function EmployeeCalendarLegend() {
  return (
    <div className="text-label-xs flex flex-wrap items-center gap-2">
      <span className="bg-muted text-muted-foreground border-outline-variant/20 inline-flex items-center gap-1 rounded border px-2 py-0.5">
        <span className="bg-success size-1.5 rounded-full" /> On-Time
      </span>
      <span className="bg-muted text-muted-foreground border-outline-variant/20 inline-flex items-center gap-1 rounded border px-2 py-0.5">
        <TriangleAlert className="text-warning size-[13px]" strokeWidth={1.5} aria-hidden="true" />{' '}
        Late / Short
      </span>
      <span className="bg-muted text-muted-foreground border-outline-variant/20 inline-flex items-center gap-1 rounded border px-2 py-0.5">
        <span className="bg-primary size-1.5 rounded-full" /> Leave / WFH
      </span>
      <span className="bg-muted text-outline border-outline-variant/20 inline-flex items-center gap-1 rounded border px-2 py-0.5">
        Weekend
      </span>
    </div>
  );
}
