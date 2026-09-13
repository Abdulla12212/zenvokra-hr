import { api } from '@/lib/api-client';

export type WeekTone = 'ok' | 'warn' | 'now' | 'empty';

export interface WeekBar {
  id: string;
  day: string;
  hoursLabel: string;
  fillPercent: number;
  tone: WeekTone;
}

export interface AttendanceSnapshot {
  clockedIn: boolean;
  onBreak: boolean;
  clockInTime: string;
  recordedTimer: string;
  recordedShort: string;
  percentOfShift: number;
  currentTime: string;
  estimatedOut: string;
  timeUntilOut: string;
  locationLabel: string;
  locationReadyLabel: string;
  lateBannerVisible: boolean;
  lateDayFixed: boolean;
  lateDayIso: string | null;
  lateDayTitle: string;
  lateDayDetail: string;
  weekTotalLabel: string;
  weekShiftsLabel: string;
  weekShiftsOk: boolean;
  overtimeLabel: string;
  weekDays: WeekBar[];
  clockInDetail: string;
  breakDetail: string;
  punchLogSummaryLabel: string;
  todayIso: string;
  todayLabel: string;
}

export interface PunchLogEntry {
  id: string;
  title: string;
  detail: string;
  tone: 'primary' | 'mute' | 'warn' | 'ok';
  action?: 'edit' | 'fix' | null;
}

export interface PunchLogGroup {
  id: string;
  heading: string;
  entries: PunchLogEntry[];
}

export interface StampDraft {
  inTime: string;
  outTime: string;
  breakStart: string;
  breakEnd: string;
  note: string;
}

export interface CalendarCell {
  day: number | null;
  weekend: boolean;
  today: boolean;
  selected: boolean;
  inRange: boolean;
  kind: 'empty' | 'weekend' | 'present' | 'late' | 'leave' | 'closed' | 'today' | 'scheduled';
  metaPrimary?: string | null;
  metaSecondary?: string | null;
  showPlane?: boolean;
  clockIn?: string | null;
  clockOut?: string | null;
  hours?: string | null;
  breakDuration?: string | null;
  note?: string | null;
}

export function getAttendance(signal?: AbortSignal): Promise<AttendanceSnapshot> {
  return api.get<AttendanceSnapshot>('/api/attendance', { signal });
}

export function getTimesheet(signal?: AbortSignal): Promise<PunchLogGroup[]> {
  return api.get<PunchLogGroup[]>('/api/attendance/log', { signal });
}

export function getAttendanceCalendar(
  year: number,
  month: number,
  day: number,
  signal?: AbortSignal,
): Promise<CalendarCell[]> {
  return api.get<CalendarCell[]>('/api/attendance/calendar', {
    query: { year, month, day },
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

export function updateStamp(input: {
  date: string;
  draft: StampDraft;
}): Promise<AttendanceSnapshot> {
  return api.put<AttendanceSnapshot>('/api/attendance/stamps', {
    date: input.date,
    inTime: input.draft.inTime,
    outTime: input.draft.outTime,
    breakStart: input.draft.breakStart,
    breakEnd: input.draft.breakEnd,
    note: input.draft.note,
  });
}
