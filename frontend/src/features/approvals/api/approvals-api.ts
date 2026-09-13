import { api } from '@/lib/api-client';

export type ApprovalKind = 'leave' | 'punch';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalItem {
  id: string;
  kind: ApprovalKind;
  status: ApprovalStatus;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  title: string;
  location: string;
  summary: string;
  detail: string;
  note: string;
  managerVerified: boolean;
  recordedLabel: string;
  requestedLabel: string;
  sentLabel: string;
  sentAtUtc: string;
  decidedAtUtc: string | null;
}

export interface Approvals {
  pending: ApprovalItem[];
  resolved: ApprovalItem[];
  pendingPunches: number;
  pendingLeaves: number;
}

export interface DecideApprovalInput {
  kind: ApprovalKind;
  decision: 'approve' | 'reject';
  note?: string;
}

export function listApprovals(signal?: AbortSignal): Promise<Approvals> {
  return api.get<Approvals>('/api/approvals', { signal });
}

export function decideApproval(id: string, input: DecideApprovalInput): Promise<Approvals> {
  return api.post<Approvals>(`/api/approvals/${id}/decide`, input);
}
