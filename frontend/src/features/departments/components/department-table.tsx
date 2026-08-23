import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { Department } from '../api/departments-api';

/*
 * WALKING SKELETON: delete alongside the Departments feature.
 */

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

export function DepartmentTable({ departments }: { departments: Department[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="w-40">Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {departments.map((department) => (
          <TableRow key={department.id}>
            <TableCell className="font-medium">{department.name}</TableCell>
            <TableCell className="text-muted-foreground">
              {/* The API sends UTC; the browser renders it in the viewer's zone. */}
              {dateFormat.format(new Date(department.createdAtUtc))}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
