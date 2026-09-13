import { ApiError, api } from '@/lib/api-client';

export type LeaveType = 'Annual' | 'Casual' | 'Sick';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: string;
  type: LeaveType;
  datesLabel: string;
  fromLabel: string;
  toLabel: string;
  rangeShort: string;
  heading: string;
  days: number;
  status: LeaveStatus;
  statusLabel: string;
  approverName: string;
  note: string;
  sentLabel: string;
  waitingLabel: string;
  remainingAfterLabel: string;
  inboxTitle: string;
  inboxDetail: string;
}

export interface LeaveBalance {
  type: LeaveType;
  remaining: number;
  total: number;
}

export interface CreateLeaveRequestInput {
  type: LeaveType;
  from: string;
  to: string;
  note: string;
}

export function listLeaveBalances(signal?: AbortSignal): Promise<LeaveBalance[]> {
  return api.get<LeaveBalance[]>('/api/leave/balances', { signal });
}

export function listLeaveRequests(signal?: AbortSignal): Promise<LeaveRequest[]> {
  return api.get<LeaveRequest[]>('/api/leave/requests', { signal });
}

export async function getLeaveRequestById(
  id: string,
  signal?: AbortSignal,
): Promise<LeaveRequest | undefined> {
  try {
    return await api.get<LeaveRequest>(`/api/leave/requests/${id}`, { signal });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return undefined;
    }
    throw error;
  }
}

export function createLeaveRequest(input: CreateLeaveRequestInput): Promise<LeaveRequest> {
  return api.post<LeaveRequest>('/api/leave/requests', input);
}

export function withdrawLeaveRequest(id: string): Promise<LeaveRequest> {
  return api.post<LeaveRequest>(`/api/leave/requests/${id}/cancel`, {});
}
