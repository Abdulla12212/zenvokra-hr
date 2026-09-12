import { Link } from 'react-router';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/format-date';

import type { Tenant } from '../api/tenants-api';

export function CompanyTable({ tenants }: { tenants: Tenant[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Admins</TableHead>
          <TableHead className="w-40">Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tenants.map((tenant) => (
          <TableRow key={tenant.id}>
            <TableCell className="font-medium">
              <Link to={`/tenants/${tenant.id}`} className="hover:underline">
                {tenant.name}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">{tenant.slug}</TableCell>
            <TableCell>{tenant.isActive ? 'Active' : 'Inactive'}</TableCell>
            <TableCell>{tenant.adminCount}</TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(tenant.createdAtUtc)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
