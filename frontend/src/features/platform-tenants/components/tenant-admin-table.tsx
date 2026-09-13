import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/format-date';

import type { TenantAdmin } from '../api/tenants-api';

export function TenantAdminTable({
  admins,
  onRemove,
  busyAdminId,
}: {
  admins: TenantAdmin[];
  onRemove: (admin: TenantAdmin) => void;
  busyAdminId?: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead className="w-40">Created</TableHead>
          <TableHead className="w-24">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {admins.map((admin) => (
          <TableRow key={admin.id}>
            <TableCell className="font-medium">{admin.email}</TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(admin.createdAtUtc)}
            </TableCell>
            <TableCell>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busyAdminId === admin.id}
                onClick={() => onRemove(admin)}
              >
                Remove
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
