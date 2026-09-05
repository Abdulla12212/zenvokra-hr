import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/lib/api-client';
import { employeeAppKeys } from '@/lib/employee-query-keys';

import type { CalendarMonth } from '@/lib/home-search';

import {
  clockIn,
  clockOut,
  getAttendance,
  getAttendanceCalendar,
  getStamp,
  getTimesheet,
  hideLateBanner,
  startOrEndBreak,
  updateStamp,
  type AttendanceSnapshot,
  type CalendarCell,
  type PunchLogGroup,
  type StampDraft,
} from './attendance-api';

export const attendanceKeys = {
  all: [...employeeAppKeys.all, 'attendance'] as const,
  current: () => [...attendanceKeys.all, 'current'] as const,
  log: () => [...attendanceKeys.all, 'log'] as const,
  stamp: (date: string) => [...attendanceKeys.all, 'stamp', date] as const,
  calendar: (month: CalendarMonth, day: number) =>
    [...attendanceKeys.all, 'calendar', month, day] as const,
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

export function useAttendanceCalendar(month: CalendarMonth, day: number) {
  return useQuery<CalendarCell[], ApiError>({
    queryKey: attendanceKeys.calendar(month, day),
    queryFn: ({ signal }) => getAttendanceCalendar(month, day, signal),
  });
}

export function useStampDraft(date: string) {
  return useQuery<StampDraft, ApiError>({
    queryKey: attendanceKeys.stamp(date),
    queryFn: ({ signal }) => getStamp(date, signal),
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

  return useMutation<AttendanceSnapshot, ApiError, { date: string; draft: StampDraft }>({
    mutationFn: (input) => updateStamp(input),
    onSuccess: async () => {
      await invalidateEmployeeApp(queryClient);
    },
  });
}
