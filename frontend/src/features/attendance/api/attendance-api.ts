import {
  dismissLateBanner,
  getAttendanceSnapshot,
  getPunchLog,
  getStampDraft,
  punchIn,
  punchOut,
  saveStamp,
  toggleBreak,
  type AttendanceSnapshot,
  type PunchLogGroup,
  type StampDraft,
} from '@/lib/employee-app-store';

export type { AttendanceSnapshot, PunchLogGroup, StampDraft };

export function getAttendance(_signal?: AbortSignal): Promise<AttendanceSnapshot> {
  return Promise.resolve(getAttendanceSnapshot());
}

export function getTimesheet(_signal?: AbortSignal): Promise<PunchLogGroup[]> {
  return Promise.resolve(getPunchLog());
}

export function getStamp(day: number, _signal?: AbortSignal): Promise<StampDraft> {
  return Promise.resolve(getStampDraft(day));
}

export function clockIn(): Promise<AttendanceSnapshot> {
  return Promise.resolve(punchIn());
}

export function clockOut(): Promise<AttendanceSnapshot> {
  return Promise.resolve(punchOut());
}

export function startOrEndBreak(): Promise<AttendanceSnapshot> {
  return Promise.resolve(toggleBreak());
}

export function hideLateBanner(): Promise<AttendanceSnapshot> {
  return Promise.resolve(dismissLateBanner());
}

export function updateStamp(input: { day: number; draft: StampDraft }): Promise<AttendanceSnapshot> {
  return Promise.resolve(saveStamp(input.day, input.draft));
}
