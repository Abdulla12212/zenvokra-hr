import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/lib/api-client';
import { employeeTimeKeys } from '@/lib/employee-time-keys';

import {
  createLeaveRequest,
  getLeaveRequestById,
  listLeaveBalances,
  listLeaveRequests,
  withdrawLeaveRequest,
  type CreateLeaveRequestInput,
  type LeaveBalance,
  type LeaveRequest,
} from './leave-api';

export const leaveKeys = {
  all: [...employeeTimeKeys.all, 'leave'] as const,
  balances: () => [...leaveKeys.all, 'balances'] as const,
  list: () => [...leaveKeys.all, 'list'] as const,
  detail: (id: string) => [...leaveKeys.all, 'detail', id] as const,
};

async function invalidateEmployeeTime(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: employeeTimeKeys.all });
}

export function useLeaveBalances() {
  return useQuery<LeaveBalance[], ApiError>({
    queryKey: leaveKeys.balances(),
    queryFn: ({ signal }) => listLeaveBalances(signal),
  });
}

export function useLeaveRequests() {
  return useQuery<LeaveRequest[], ApiError>({
    queryKey: leaveKeys.list(),
    queryFn: ({ signal }) => listLeaveRequests(signal),
  });
}

export function useLeaveRequest(id: string) {
  return useQuery<LeaveRequest | undefined, ApiError>({
    queryKey: leaveKeys.detail(id),
    queryFn: ({ signal }) => getLeaveRequestById(id, signal),
    enabled: id.length > 0,
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation<LeaveRequest, ApiError, CreateLeaveRequestInput>({
    mutationFn: (input) => createLeaveRequest(input),
    onSuccess: async () => {
      await invalidateEmployeeTime(queryClient);
    },
  });
}

export function useCancelLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation<LeaveRequest, ApiError, string>({
    mutationFn: (id) => withdrawLeaveRequest(id),
    onSuccess: async () => {
      await invalidateEmployeeTime(queryClient);
    },
  });
}
