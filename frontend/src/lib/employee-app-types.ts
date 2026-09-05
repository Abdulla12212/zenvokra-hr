export type LeaveType = 'Annual' | 'Casual' | 'Sick';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type WeekTone = 'ok' | 'warn' | 'now' | 'empty';

export type InboxKind = 'leave' | 'punch' | 'in' | 'holiday';

export interface LeaveRequest {
  id: string;
  type: LeaveType;
  datesLabel: string;
  fromLabel: string;
  toLabel: string;
  rangeShort: string;
  heading: string;
  days: number;
  status: LeaveStatus;
  statusLabel: string;
  approverName: string;
  note: string;
  sentLabel: string;
  waitingLabel: string;
  remainingAfterLabel: string;
  inboxTitle: string;
  inboxDetail: string;
}

export interface LeaveBalance {
  type: LeaveType;
  remaining: number;
  total: number;
}

export interface ClosedDay {
  date: string;
  name: string;
  detail: string;
}

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
  weekTotalLabel: string;
  weekShiftsLabel: string;
  weekShiftsOk: boolean;
  overtimeLabel: string;
  weekDays: WeekBar[];
  clockInDetail: string;
  breakDetail: string;
  punchLogSummaryLabel: string;
}

export interface PunchLogEntry {
  id: string;
  title: string;
  detail: string;
  tone: 'primary' | 'mute' | 'warn' | 'ok';
  action?: 'edit' | 'fix';
}

export interface PunchLogGroup {
  id: string;
  heading: string;
  entries: PunchLogEntry[];
}

export interface InboxItem {
  id: string;
  kind: InboxKind;
  title: string;
  detail: string;
  badgeLabel: string;
  badgeVariant: 'late' | 'present' | 'default';
  actionLabel?: string;
  actionTo?: string;
  unread: boolean;
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
  metaPrimary?: string;
  metaSecondary?: string;
  showPlane?: boolean;
}
