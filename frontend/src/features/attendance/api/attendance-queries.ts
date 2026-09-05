import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/lib/api-client';
import { employeeAppKeys } from '@/lib/employee-query-keys';

import {
  clockIn,
  clockOut,
  getAttendance,
  getStamp,
  getTimesheet,
  hideLateBanner,
  startOrEndBreak,
  updateStamp,
  type AttendanceSnapshot,
  type PunchLogGroup,
  type StampDraft,
} from './attendance-api';

export const attendanceKeys = {
  all: [...employeeAppKeys.all, 'attendance'] as const,
  current: () => [...attendanceKeys.all, 'current'] as const,
  log: () => [...attendanceKeys.all, 'log'] as const,
  stamp: (day: number) => [...attendanceKeys.all, 'stamp', day] as const,
};

async function invalidateEmployeeApp(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: employeeAppKeys.all });
}

export function useAttendance() {
  return useQuery<AttendanceSnapshot, ApiError>({
    queryKey: attendanceKeys.current(),
    queryFn: ({ signal }) => getAttendance(signal),
  });
}

export function usePunchLog() {
  return useQuery<PunchLogGroup[], ApiError>({
    queryKey: attendanceKeys.log(),
    queryFn: ({ signal }) => getTimesheet(signal),
  });
}

export function useStampDraft(day: number) {
  return useQuery<StampDraft, ApiError>({
    queryKey: attendanceKeys.stamp(day),
    queryFn: ({ signal }) => getStamp(day, signal),
  });
}

export function usePunchIn() {
  const queryClient = useQueryClient();

  return useMutation<AttendanceSnapshot, ApiError, void>({
    mutationFn: () => clockIn(),
    onSuccess: async () => {
      await invalidateEmployeeApp(queryClient);
    },
  });
}

export function usePunchOut() {
  const queryClient = useQueryClient();

  return useMutation<AttendanceSnapshot, ApiError, void>({
    mutationFn: () => clockOut(),
    onSuccess: async () => {
      await invalidateEmployeeApp(queryClient);
    },
  });
}

export function useToggleBreak() {
  const queryClient = useQueryClient();

  return useMutation<AttendanceSnapshot, ApiError, void>({
    mutationFn: () => startOrEndBreak(),
    onSuccess: async () => {
      await invalidateEmployeeApp(queryClient);
    },
  });
}

export function useDismissLateBanner() {
  const queryClient = useQueryClient();

  return useMutation<AttendanceSnapshot, ApiError, void>({
    mutationFn: () => hideLateBanner(),
    onSuccess: async () => {
      await invalidateEmployeeApp(queryClient);
    },
  });
}

export function useSaveStamp() {
  const queryClient = useQueryClient();

  return useMutation<AttendanceSnapshot, ApiError, { day: number; draft: StampDraft }>({
    mutationFn: (input) => updateStamp(input),
    onSuccess: async () => {
      await invalidateEmployeeApp(queryClient);
    },
  });
}
