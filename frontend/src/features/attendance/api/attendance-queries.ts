import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/lib/api-client';
import { employeeTimeKeys } from '@/lib/employee-time-keys';

import {
  clockIn,
  clockOut,
  getAttendance,
  getAttendanceCalendar,
  getPunchLog,
  getStamp,
  hideLateBanner,
  startOrEndBreak,
  updateStamp,
  type AttendanceSnapshot,
  type CalendarCell,
  type PunchLogGroup,
  type StampDraft,
} from './attendance-api';

export const attendanceKeys = {
  all: [...employeeTimeKeys.all, 'attendance'] as const,
  current: () => [...attendanceKeys.all, 'current'] as const,
  log: () => [...attendanceKeys.all, 'log'] as const,
  stamp: (date: string) => [...attendanceKeys.all, 'stamp', date] as const,
  calendar: (year: number, month: number) =>
    [...attendanceKeys.all, 'calendar', year, month] as const,
};

async function applyAttendanceSnapshot(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshot: AttendanceSnapshot,
) {
  queryClient.setQueryData(attendanceKeys.current(), snapshot);
  await queryClient.invalidateQueries({
    queryKey: employeeTimeKeys.all,
    predicate: (query) => !isCurrentAttendanceQuery(query.queryKey),
  });
}

function isCurrentAttendanceQuery(queryKey: readonly unknown[]): boolean {
  const current = attendanceKeys.current();
  return (
    queryKey.length === current.length && current.every((part, index) => queryKey[index] === part)
  );
}

export function useAttendance() {
  return useQuery<AttendanceSnapshot, ApiError>({
    queryKey: attendanceKeys.current(),
    queryFn: ({ signal }) => getAttendance(signal),
    refetchInterval: (query) => (query.state.data?.clockedIn === true ? 60_000 : false),
  });
}

export function usePunchLog() {
  return useQuery<PunchLogGroup[], ApiError>({
    queryKey: attendanceKeys.log(),
    queryFn: ({ signal }) => getPunchLog(signal),
  });
}

export function useAttendanceCalendar(year: number, month: number) {
  return useQuery<CalendarCell[], ApiError>({
    queryKey: attendanceKeys.calendar(year, month),
    queryFn: ({ signal }) => getAttendanceCalendar(year, month, signal),
    placeholderData: (previous) => previous,
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
    onSuccess: async (snapshot) => {
      await applyAttendanceSnapshot(queryClient, snapshot);
    },
  });
}

export function usePunchOut() {
  const queryClient = useQueryClient();

  return useMutation<AttendanceSnapshot, ApiError, void>({
    mutationFn: () => clockOut(),
    onSuccess: async (snapshot) => {
      await applyAttendanceSnapshot(queryClient, snapshot);
    },
  });
}

export function useToggleBreak() {
  const queryClient = useQueryClient();

  return useMutation<AttendanceSnapshot, ApiError, void>({
    mutationFn: () => startOrEndBreak(),
    onSuccess: async (snapshot) => {
      await applyAttendanceSnapshot(queryClient, snapshot);
    },
  });
}

export function useDismissLateBanner() {
  const queryClient = useQueryClient();

  return useMutation<AttendanceSnapshot, ApiError, void>({
    mutationFn: () => hideLateBanner(),
    onSuccess: async (snapshot) => {
      await applyAttendanceSnapshot(queryClient, snapshot);
    },
  });
}

export function useSaveStamp() {
  const queryClient = useQueryClient();

  return useMutation<AttendanceSnapshot, ApiError, { date: string; draft: StampDraft }>({
    mutationFn: (input) => updateStamp(input),
    onSuccess: async (snapshot) => {
      await applyAttendanceSnapshot(queryClient, snapshot);
    },
  });
}
