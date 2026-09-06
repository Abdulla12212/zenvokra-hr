import { api } from '@/lib/api-client';

export type ApprovalKind = 'leave' | 'punch';

export interface ApprovalItem {
  id: string;
  kind: ApprovalKind;
  status: string;
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

export interface ApprovalsResponse {
  pending: ApprovalItem[];
  resolved: ApprovalItem[];
  pendingPunches: number;
  pendingLeaves: number;
}

export interface DecideApprovalInput {
  kind: ApprovalKind;
  decision: 'approve' | 'reject';
  note: string;
}

const basePath = '/api/approvals';

export function listApprovals(signal?: AbortSignal): Promise<ApprovalsResponse> {
  return api.get<ApprovalsResponse>(basePath, { signal });
}

export function decideApproval(
  approvalId: string,
  input: DecideApprovalInput,
): Promise<ApprovalsResponse> {
  return api.post<ApprovalsResponse>(`${basePath}/${approvalId}/decide`, input);
}
