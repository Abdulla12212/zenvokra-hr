import type { Employee } from '../types';

export function HeadcountByDepartmentPanel({ employees }: { employees: Employee[] }) {
  const rows = headcountByDepartment(employees);
  const max = Math.max(...rows.map((row) => row.count), 1);

  return (
    <section className="bg-card rounded-xl border px-4 py-3">
      <h2 className="mb-3 text-sm font-semibold">Headcount by department</h2>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.department} className="flex items-center gap-3 text-xs">
            <span className="w-28 shrink-0">{row.department}</span>
            <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${(row.count / max) * 100}%` }}
              />
            </div>
            <span className="text-muted-foreground w-6 text-right tabular-nums">{row.count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function headcountByDepartment(employees: Employee[]): { department: string; count: number }[] {
  const counts = new Map<string, number>();

  for (const employee of employees) {
    counts.set(employee.department, (counts.get(employee.department) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([department, count]) => ({ department, count }))
    .sort((left, right) => right.count - left.count || left.department.localeCompare(right.department));
}
