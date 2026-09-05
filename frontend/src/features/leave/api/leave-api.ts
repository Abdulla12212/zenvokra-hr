import { ApiError, api } from '@/lib/api-client';
import type { ClosedDay, LeaveBalance, LeaveRequest, LeaveType } from '@/lib/employee-app-types';

export type { ClosedDay, LeaveBalance, LeaveRequest, LeaveType };

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

export function listClosedDays(signal?: AbortSignal): Promise<ClosedDay[]> {
  return api.get<ClosedDay[]>('/api/holidays', { signal });
}
