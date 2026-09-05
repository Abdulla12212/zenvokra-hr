import {
  cancelLeaveRequest,
  getLeaveBalances,
  getLeaveRequest,
  getLeaveRequests,
  sendLeaveRequest,
  type LeaveBalance,
  type LeaveRequest,
  type LeaveType,
} from '@/lib/employee-app-store';

export type { LeaveBalance, LeaveRequest, LeaveType };

export function listLeaveBalances(_signal?: AbortSignal): Promise<LeaveBalance[]> {
  return Promise.resolve(getLeaveBalances());
}

export function listLeaveRequests(_signal?: AbortSignal): Promise<LeaveRequest[]> {
  return Promise.resolve(getLeaveRequests());
}

export function getLeaveRequestById(id: string, _signal?: AbortSignal): Promise<LeaveRequest | undefined> {
  return Promise.resolve(getLeaveRequest(id));
}

export function createLeaveRequest(input: {
  type: LeaveType;
  fromLabel: string;
  toLabel: string;
  note: string;
}): Promise<LeaveRequest> {
  return Promise.resolve(sendLeaveRequest(input));
}

export function withdrawLeaveRequest(id: string): Promise<LeaveRequest | undefined> {
  return Promise.resolve(cancelLeaveRequest(id));
}
