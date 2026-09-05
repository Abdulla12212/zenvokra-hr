import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/lib/api-client';
import { employeeAppKeys } from '@/lib/employee-query-keys';

import {
  createLeaveRequest,
  getLeaveRequestById,
  listClosedDays,
  listLeaveBalances,
  listLeaveRequests,
  withdrawLeaveRequest,
  type ClosedDay,
  type CreateLeaveRequestInput,
  type LeaveBalance,
  type LeaveRequest,
} from './leave-api';

export const leaveKeys = {
  all: [...employeeAppKeys.all, 'leave'] as const,
  balances: () => [...leaveKeys.all, 'balances'] as const,
  closedDays: () => [...leaveKeys.all, 'closed-days'] as const,
  list: () => [...leaveKeys.all, 'list'] as const,
  detail: (id: string) => [...leaveKeys.all, 'detail', id] as const,
};

async function invalidateEmployeeApp(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: employeeAppKeys.all });
}

export function useLeaveBalances() {
  return useQuery<LeaveBalance[], ApiError>({
    queryKey: leaveKeys.balances(),
    queryFn: ({ signal }) => listLeaveBalances(signal),
  });
}

export function useClosedDays() {
  return useQuery<ClosedDay[], ApiError>({
    queryKey: leaveKeys.closedDays(),
    queryFn: ({ signal }) => listClosedDays(signal),
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
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation<LeaveRequest, ApiError, CreateLeaveRequestInput>({
    mutationFn: (input) => createLeaveRequest(input),
    onSuccess: async () => {
      await invalidateEmployeeApp(queryClient);
    },
  });
}

export function useCancelLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation<LeaveRequest, ApiError, string>({
    mutationFn: (id) => withdrawLeaveRequest(id),
    onSuccess: async () => {
      await invalidateEmployeeApp(queryClient);
    },
  });
}
