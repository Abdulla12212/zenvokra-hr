import { api } from '@/lib/api-client';
import type { CalendarMonth } from '@/lib/home-search';
import type {
  AttendanceSnapshot,
  CalendarCell,
  PunchLogGroup,
  StampDraft,
} from '@/lib/employee-app-types';

export type { AttendanceSnapshot, CalendarCell, PunchLogGroup, StampDraft };

export function getAttendance(signal?: AbortSignal): Promise<AttendanceSnapshot> {
  return api.get<AttendanceSnapshot>('/api/attendance', { signal });
}

export function getTimesheet(signal?: AbortSignal): Promise<PunchLogGroup[]> {
  return api.get<PunchLogGroup[]>('/api/attendance/log', { signal });
}

export function getAttendanceCalendar(
  month: CalendarMonth,
  day: number,
  signal?: AbortSignal,
): Promise<CalendarCell[]> {
  return api.get<CalendarCell[]>('/api/attendance/calendar', {
    query: { month, day },
    signal,
  });
}

export function getStamp(date: string, signal?: AbortSignal): Promise<StampDraft> {
  return api.get<StampDraft>('/api/attendance/stamps', { query: { date }, signal });
}

export function clockIn(): Promise<AttendanceSnapshot> {
  return api.post<AttendanceSnapshot>('/api/attendance/clock-in', {});
}

export function clockOut(): Promise<AttendanceSnapshot> {
  return api.post<AttendanceSnapshot>('/api/attendance/clock-out', {});
}

export function startOrEndBreak(): Promise<AttendanceSnapshot> {
  return api.post<AttendanceSnapshot>('/api/attendance/break', {});
}

export function hideLateBanner(): Promise<AttendanceSnapshot> {
  return api.post<AttendanceSnapshot>('/api/attendance/late-banner/dismiss', {});
}

export function updateStamp(input: { date: string; draft: StampDraft }): Promise<AttendanceSnapshot> {
  return api.put<AttendanceSnapshot>('/api/attendance/stamps', {
    date: input.date,
    inTime: input.draft.inTime,
    outTime: input.draft.outTime,
    breakStart: input.draft.breakStart,
    breakEnd: input.draft.breakEnd,
    note: input.draft.note,
  });
}
