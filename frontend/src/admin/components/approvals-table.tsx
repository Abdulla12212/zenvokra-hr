import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { approvalKindMeta } from '../lib/approval-kind';
import { initialsFromName } from '../lib/initials';
import type { Approval } from '../types';
import { useAdminState } from '../use-admin-state';

import { MonogramAvatar } from './monogram-avatar';

export function ApprovalsTable({ approvals }: { approvals: Approval[] }) {
  if (approvals.length === 0) {
    return <p className="text-muted-foreground px-4 py-10 text-center text-sm">No pending approvals in this view.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Request type</TableHead>
          <TableHead>Employee</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Details</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead>Waiting</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {approvals.map((approval) => (
          <ApprovalRow key={approval.id} approval={approval} />
        ))}
      </TableBody>
    </Table>
  );
}

function ApprovalRow({ approval }: { approval: Approval }) {
  const { decideApproval } = useAdminState();
  const meta = approvalKindMeta(approval.kind);
  const Icon = meta.icon;

  return (
    <TableRow>
      <TableCell>
        <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Icon className="size-3.5" aria-hidden="true" />
          {meta.label}
        </span>
      </TableCell>
      <TableCell>
        <span className="flex items-center gap-2">
          <MonogramAvatar initials={initialsFromName(approval.employeeName)} />
          <span className="text-xs font-medium">{approval.employeeName}</span>
        </span>
      </TableCell>
      <TableCell className="text-xs">{approval.department}</TableCell>
      <TableCell className="text-muted-foreground text-xs">{approval.details}</TableCell>
      <TableCell className="text-muted-foreground text-xs">{approval.submittedLabel}</TableCell>
      <TableCell className="text-muted-foreground text-xs">{approval.waiting}</TableCell>
      <TableCell className="text-right">
        <Button
          type="button"
          size="sm"
          className="h-7 px-2.5"
          onClick={() => {
            decideApproval(approval.id, 'approved');
            toast.success(`Approved ${approval.details}.`);
          }}
        >
          Approve
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-7"
          onClick={() => {
            decideApproval(approval.id, 'rejected');
            toast.success(`Rejected ${approval.details}.`);
          }}
        >
          Reject
        </Button>
      </TableCell>
    </TableRow>
  );
}
