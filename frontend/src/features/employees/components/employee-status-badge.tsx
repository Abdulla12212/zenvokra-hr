const labels: Record<string, string> = {
  Active: 'Active',
  Remote: 'Remote',
  Probation: 'Probation',
};

export function EmployeeStatusBadge({ status }: { status: string }) {
  return (
    <span className="text-muted-foreground rounded-full border px-2.5 py-0.5 text-xs">
      {labels[status] ?? status}
    </span>
  );
}
