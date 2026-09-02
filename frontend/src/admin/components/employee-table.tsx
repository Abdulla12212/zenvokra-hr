import { Columns3, MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { formatShortDate } from '../lib/format-short-date';
import { initialsFromName } from '../lib/initials';
import type { Employee } from '../types';

import { MonogramAvatar } from './monogram-avatar';
import { PresenceDot } from './presence-dot';

export function EmployeeTable({
  employees,
  selectedIds,
  onToggle,
  onToggleAll,
}: {
  employees: Employee[];
  selectedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
}) {
  const allSelected = employees.length > 0 && employees.every((employee) => selectedIds.has(employee.id));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <label className="flex items-center">
              <span className="sr-only">Select all on this page</span>
              <input
                type="checkbox"
                className="accent-primary size-3.5"
                checked={allSelected}
                onChange={(event) => {
                  onToggleAll(event.target.checked);
                }}
              />
            </label>
          </TableHead>
          <TableHead>Person</TableHead>
          <TableHead>ID</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Job title</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Start date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-10 text-right">
            <Columns3 className="text-muted-foreground ml-auto size-4" aria-hidden="true" />
            <span className="sr-only">Columns</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((employee) => (
          <TableRow key={employee.id}>
            <TableCell>
              <label className="flex items-center">
                <span className="sr-only">Select {employee.fullName}</span>
                <input
                  type="checkbox"
                  className="accent-primary size-3.5"
                  checked={selectedIds.has(employee.id)}
                  onChange={() => {
                    onToggle(employee.id);
                  }}
                />
              </label>
            </TableCell>
            <TableCell>
              <span className="flex items-center gap-2">
                <MonogramAvatar initials={initialsFromName(employee.fullName)} />
                <span>
                  <span className="block text-xs font-medium">{employee.fullName}</span>
                  <span className="text-muted-foreground block text-[11px]">{employee.workEmail}</span>
                </span>
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">{employee.employeeId}</TableCell>
            <TableCell className="text-xs">{employee.department}</TableCell>
            <TableCell className="text-xs">{employee.jobTitle}</TableCell>
            <TableCell className="text-muted-foreground text-xs">{employee.location}</TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {formatShortDate(employee.startDate)}
            </TableCell>
            <TableCell>
              <span className="flex items-center gap-1.5 text-xs">
                <PresenceDot status={employee.status} />
                {employee.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={`Actions for ${employee.fullName}`}
              >
                <MoreHorizontal aria-hidden="true" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
