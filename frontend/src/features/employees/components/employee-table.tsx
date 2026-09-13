import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { Employee } from '../api/employees-api';
import { EmployeeStatusBadge } from './employee-status-badge';

export function EmployeeTable({
  employees,
  onEdit,
}: {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Number</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Email</TableHead>
          <TableHead className="w-24">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((employee) => (
          <TableRow key={employee.id}>
            <TableCell className="font-medium">{employee.fullName}</TableCell>
            <TableCell className="text-muted-foreground">{employee.employeeNumber}</TableCell>
            <TableCell>{employee.title}</TableCell>
            <TableCell>{employee.departmentName}</TableCell>
            <TableCell>
              <EmployeeStatusBadge status={employee.status} />
            </TableCell>
            <TableCell className="text-muted-foreground">{employee.workEmail}</TableCell>
            <TableCell className="space-x-1">
              <Button type="button" variant="ghost" size="sm" asChild>
                <Link to={`/admin/employees/${employee.id}`}>View</Link>
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(employee)}>
                Edit
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
