import type { CalendarMonth } from './home-search';

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

interface StoreState {
  clockedIn: boolean;
  onBreak: boolean;
  lateBannerDismissed: boolean;
  lateDayFixed: boolean;
  requests: LeaveRequest[];
}

const AUGUST_HOURS: Record<number, string> = {
  3: '8h 05m',
  4: '8h 12m',
  5: '7h 58m',
  6: '8h 00m',
  7: '8h 21m',
  10: '8h 04m',
  11: '8h 18m',
  13: '8h 02m',
  14: '8h 09m',
  17: '8h 06m',
  18: '8h 11m',
};

const INITIAL_REQUESTS: LeaveRequest[] = [
  {
    id: 'aug-25',
    type: 'Annual',
    datesLabel: '25–26 Aug 2026',
    fromLabel: 'Tue 25 Aug 2026',
    toLabel: 'Wed 26 Aug 2026',
    rangeShort: 'Tue 25 – Wed 26 Aug 2026',
    heading: '25–26 Aug',
    days: 2,
    status: 'pending',
    statusLabel: 'Pending · Nadia',
    approverName: 'Nadia Chowdhury',
    note: 'Family visit.',
    sentLabel: 'Sent 20 Aug, 09:41',
    waitingLabel: 'Waiting on Nadia Chowdhury',
    remainingAfterLabel: '10 annual days left',
    inboxTitle: '25–26 Aug waiting on Nadia',
    inboxDetail: 'Sent today 09:41',
  },
  {
    id: 'aug-7',
    type: 'Sick',
    datesLabel: '7 Aug 2026',
    fromLabel: 'Fri 7 Aug 2026',
    toLabel: 'Fri 7 Aug 2026',
    rangeShort: 'Fri 7 Aug 2026',
    heading: '7 Aug',
    days: 1,
    status: 'approved',
    statusLabel: 'Approved',
    approverName: 'Nadia Chowdhury',
    note: '',
    sentLabel: 'Sent 6 Aug, 18:02',
    waitingLabel: '',
    remainingAfterLabel: '7 sick days left',
    inboxTitle: 'Sick day 7 Aug approved',
    inboxDetail: 'Approved 6 Aug',
  },
  {
    id: 'jul-29',
    type: 'Casual',
    datesLabel: '29 Jul 2026',
    fromLabel: 'Wed 29 Jul 2026',
    toLabel: 'Wed 29 Jul 2026',
    rangeShort: 'Wed 29 Jul 2026',
    heading: '29 Jul',
    days: 1,
    status: 'rejected',
    statusLabel: 'Rejected',
    approverName: 'Nadia Chowdhury',
    note: '',
    sentLabel: 'Sent 28 Jul, 11:14',
    waitingLabel: '',
    remainingAfterLabel: '5 casual days left',
    inboxTitle: 'Casual 29 Jul rejected',
    inboxDetail: 'Rejected 28 Jul',
  },
];

const LEAVE_BALANCES: LeaveBalance[] = [
  { type: 'Annual', remaining: 12, total: 20 },
  { type: 'Casual', remaining: 5, total: 10 },
  { type: 'Sick', remaining: 7, total: 10 },
];

function createState(): StoreState {
  return {
    clockedIn: true,
    onBreak: false,
    lateBannerDismissed: false,
    lateDayFixed: false,
    requests: INITIAL_REQUESTS.map((request) => ({ ...request })),
  };
}

let state = createState();

export function resetEmployeeAppStore(): void {
  state = createState();
}

export function getAttendanceSnapshot(): AttendanceSnapshot {
  const clockedIn = state.clockedIn;

  return {
    clockedIn,
    onBreak: state.onBreak,
    clockInTime: '09:02',
    recordedTimer: clockedIn ? '6h 32m 43s' : '0h 00m 00s',
    recordedShort: clockedIn ? '6h 32m' : '0h',
    percentOfShift: clockedIn ? 81 : 0,
    currentTime: clockedIn ? '16:32' : '08:47',
    estimatedOut: '18:00',
    timeUntilOut: '1h 28m left',
    locationLabel: 'Dhaka HQ · IP verified',
    locationReadyLabel: 'Dhaka HQ · ready',
    lateBannerVisible: !state.lateBannerDismissed && !state.lateDayFixed,
    lateDayFixed: state.lateDayFixed,
    weekTotalLabel: clockedIn ? '32h 32m / 40h' : '24h 00m / 40h',
    weekShiftsLabel: clockedIn ? '4 of 5 shifts' : '3 of 5 shifts',
    weekShiftsOk: clockedIn,
    overtimeLabel: 'Overtime accrued · 0h 35m',
    weekDays: clockedIn ? clockedInWeek() : clockedOutWeek(),
  };
}

export function punchIn(): AttendanceSnapshot {
  state.clockedIn = true;
  state.onBreak = false;
  return getAttendanceSnapshot();
}

export function punchOut(): AttendanceSnapshot {
  state.clockedIn = false;
  state.onBreak = false;
  return getAttendanceSnapshot();
}

export function toggleBreak(): AttendanceSnapshot {
  if (state.clockedIn) {
    state.onBreak = !state.onBreak;
  }

  return getAttendanceSnapshot();
}

export function dismissLateBanner(): AttendanceSnapshot {
  state.lateBannerDismissed = true;
  return getAttendanceSnapshot();
}

export function saveStamp(day: number, draft: StampDraft): AttendanceSnapshot {
  if (day === 19) {
    state.lateDayFixed = draft.inTime <= '09:15';
  }

  return getAttendanceSnapshot();
}

export function getLeaveBalances(): LeaveBalance[] {
  return LEAVE_BALANCES;
}

export function getLeaveRequests(): LeaveRequest[] {
  return state.requests.filter((request) => request.status !== 'cancelled');
}

export function getLeaveRequest(id: string): LeaveRequest | undefined {
  return state.requests.find((request) => request.id === id);
}

export function sendLeaveRequest(input: {
  type: LeaveType;
  fromLabel: string;
  toLabel: string;
  note: string;
}): LeaveRequest {
  const existing = state.requests.find((request) => request.id === 'aug-25');

  if (existing?.status === 'pending') {
    existing.type = input.type;
    existing.note = input.note;
    existing.fromLabel = input.fromLabel;
    existing.toLabel = input.toLabel;
    return existing;
  }

  const created: LeaveRequest = {
    id: 'aug-25',
    type: input.type,
    datesLabel: '25–26 Aug 2026',
    fromLabel: input.fromLabel,
    toLabel: input.toLabel,
    rangeShort: 'Tue 25 – Wed 26 Aug 2026',
    heading: '25–26 Aug',
    days: 2,
    status: 'pending',
    statusLabel: 'Pending · Nadia',
    approverName: 'Nadia Chowdhury',
    note: input.note,
    sentLabel: 'Sent 20 Aug, 09:41',
    waitingLabel: 'Waiting on Nadia Chowdhury',
    remainingAfterLabel: '10 annual days left',
    inboxTitle: '25–26 Aug waiting on Nadia',
    inboxDetail: 'Sent today 09:41',
  };

  state.requests = [created, ...state.requests.filter((request) => request.id !== 'aug-25')];
  return created;
}

export function cancelLeaveRequest(id: string): LeaveRequest | undefined {
  const request = state.requests.find((row) => row.id === id);

  if (request?.status !== 'pending') {
    return request;
  }

  request.status = 'cancelled';
  request.statusLabel = 'Cancelled';
  return request;
}

export function getInboxItems(): InboxItem[] {
  const attendance = getAttendanceSnapshot();
  const pending = state.requests.find((request) => request.status === 'pending');
  const items: InboxItem[] = [];

  if (pending) {
    items.push({
      id: pending.id,
      kind: 'leave',
      title: pending.inboxTitle,
      detail: pending.inboxDetail,
      badgeLabel: 'Leave',
      badgeVariant: 'late',
      actionLabel: 'Open',
      actionTo: `/time-off/${pending.id}`,
    });
  }

  if (!attendance.lateDayFixed) {
    items.push({
      id: 'late-19',
      kind: 'punch',
      title: '19 Aug marked late',
      detail: 'Today 08:12',
      badgeLabel: 'Punch',
      badgeVariant: 'late',
      actionLabel: 'Edit',
      actionTo: '/?sheet=fix-punch&day=19',
    });
  }

  if (attendance.clockedIn) {
    items.push({
      id: 'checked-in',
      kind: 'in',
      title: 'Checked in 09:02',
      detail: 'Dhaka HQ',
      badgeLabel: 'In',
      badgeVariant: 'present',
    });
  }

  items.push({
    id: 'holiday-sep-5',
    kind: 'holiday',
    title: 'Office closed 5 Sep',
    detail: 'Company Day · paid · not leave',
    badgeLabel: 'Holiday',
    badgeVariant: 'default',
    actionLabel: 'Show on calendar',
    actionTo: '/?month=september&day=5',
  });

  return items;
}

export function getPunchLog(): PunchLogGroup[] {
  const attendance = getAttendanceSnapshot();
  const today: PunchLogGroup = {
    id: 'thu-20',
    heading: attendance.clockedIn ? 'Thu 20 Aug · Active' : 'Thu 20 Aug · Out',
    entries: attendance.clockedIn
      ? [
          {
            id: 'in',
            title: 'In 09:02',
            detail: 'On-time · Dhaka HQ · IP verified',
            tone: 'primary',
            action: 'edit',
          },
          {
            id: 'break',
            title: 'Break 12:15–13:05',
            detail: '50m lunch',
            tone: 'mute',
          },
          {
            id: 'now',
            title: 'Now 16:32',
            detail: '6h 32m recorded',
            tone: 'primary',
          },
        ]
      : [
          {
            id: 'due',
            title: 'Due 09:00',
            detail: 'Not clocked in',
            tone: 'mute',
          },
        ],
  };

  const wednesday: PunchLogGroup = state.lateDayFixed
    ? {
        id: 'wed-19',
        heading: 'Wed 19 Aug · Present',
        entries: [
          {
            id: 'wed-fixed',
            title: 'In 09:00 · Out 18:05',
            detail: '8h 05m · on-time',
            tone: 'ok',
          },
        ],
      }
    : {
        id: 'wed-19',
        heading: 'Wed 19 Aug · Late',
        entries: [
          {
            id: 'wed-late',
            title: 'In 09:42 · Out 18:08',
            detail: '8h 26m · 42m tardiness',
            tone: 'warn',
            action: 'fix',
          },
        ],
      };

  return [
    today,
    wednesday,
    {
      id: 'tue-18',
      heading: 'Tue 18 Aug · Present',
      entries: [
        {
          id: 'tue',
          title: 'In 08:58 · Out 18:09',
          detail: '8h 11m · on-time',
          tone: 'ok',
        },
      ],
    },
  ];
}

export function getStampDraft(day: number): StampDraft {
  if (day === 19) {
    return {
      inTime: state.lateDayFixed ? '09:00' : '09:00',
      outTime: '18:05',
      breakStart: '12:15',
      breakEnd: '13:05',
      note: 'In was 09:00. Punch missed.',
    };
  }

  return {
    inTime: '09:02',
    outTime: '18:00',
    breakStart: '12:15',
    breakEnd: '13:05',
    note: '',
  };
}

export function buildCalendarDays(
  month: CalendarMonth,
  selected: number,
  clockedIn: boolean,
  lateDayFixed: boolean,
): CalendarCell[] {
  const days = month === 'september' ? septemberDays() : augustDays();
  const weekend =
    month === 'september'
      ? new Set([5, 6, 12, 13, 19, 20, 26, 27])
      : new Set([1, 2, 8, 9, 15, 16, 22, 23, 29, 30]);
  const present = month === 'august' ? new Set(Object.keys(AUGUST_HOURS).map(Number)) : new Set<number>();
  const late = month === 'august' ? new Set(lateDayFixed ? [12] : [12, 19]) : new Set<number>();
  const pendingLeave = state.requests.some((request) => request.id === 'aug-25' && request.status === 'pending');
  const leave = month === 'august' && pendingLeave ? new Set([25, 26]) : new Set<number>();
  const holiday = month === 'september' ? new Set([5]) : new Set([15]);
  const today = month === 'august' ? 20 : null;
  const range = selected === 25 || selected === 26 ? [25, 26] : [];

  return days.map((day) => {
    if (day === null) {
      return {
        day: null,
        weekend: false,
        today: false,
        selected: false,
        inRange: false,
        kind: 'empty',
      };
    }

    const isToday = day === today;
    const isWeekend = weekend.has(day);
    const isHoliday = holiday.has(day);
    const isLeave = leave.has(day);
    const isLate = late.has(day);
    const isPresent = present.has(day) || (day === 19 && lateDayFixed);
    const isFutureWeekday = month === 'august' && day > 20 && !isWeekend && !isLeave && !isHoliday;
    const isSeptWeekday = month === 'september' && !isWeekend && !isHoliday;

    let kind: CalendarCell['kind'] = 'scheduled';
    if (isWeekend && !isHoliday) kind = 'weekend';
    if (isPresent && !isLate && !isToday) kind = 'present';
    if (isLate) kind = 'late';
    if (isLeave) kind = 'leave';
    if (isHoliday) kind = 'closed';
    if (isToday) kind = 'today';

    let metaPrimary: string | undefined;
    let metaSecondary: string | undefined;
    let showPlane = false;

    if (isToday && clockedIn) {
      metaPrimary = '6h 32m';
      metaSecondary = 'Active';
    } else if (isToday && !clockedIn) {
      metaSecondary = 'Due 09:00';
    } else if (isLate) {
      metaPrimary = 'Late';
      metaSecondary = day === 12 ? '09:35' : '09:42';
    } else if (isLeave) {
      metaSecondary = 'Annual Leave';
      showPlane = true;
    } else if (isHoliday) {
      metaPrimary = 'Closed';
    } else if (day === 19 && lateDayFixed) {
      metaPrimary = '8h 05m';
    } else if (isPresent) {
      metaPrimary = AUGUST_HOURS[day];
    } else if (isFutureWeekday || isSeptWeekday) {
      metaSecondary = 'Scheduled';
    } else if (isWeekend) {
      metaSecondary = 'Weekend';
    }

    return {
      day,
      weekend: isWeekend,
      today: isToday,
      selected: day === selected || range.includes(day),
      inRange: range.includes(day),
      kind,
      metaPrimary,
      metaSecondary,
      showPlane,
    };
  });
}

function clockedInWeek(): WeekBar[] {
  return [
    { id: 'mon', day: 'Mon', hoursLabel: '8h', fillPercent: 100, tone: 'ok' },
    { id: 'tue', day: 'Tue', hoursLabel: '8h', fillPercent: 100, tone: 'ok' },
    { id: 'wed', day: 'Wed', hoursLabel: '8h*', fillPercent: 100, tone: 'warn' },
    { id: 'thu', day: 'Thu', hoursLabel: '6.5h', fillPercent: 81, tone: 'now' },
    { id: 'fri', day: 'Fri', hoursLabel: '0h', fillPercent: 0, tone: 'empty' },
  ];
}

function clockedOutWeek(): WeekBar[] {
  return [
    { id: 'mon', day: 'Mon', hoursLabel: '8h', fillPercent: 100, tone: 'ok' },
    { id: 'tue', day: 'Tue', hoursLabel: '8h', fillPercent: 100, tone: 'ok' },
    { id: 'wed', day: 'Wed', hoursLabel: '8h*', fillPercent: 100, tone: 'warn' },
    { id: 'thu', day: 'Thu', hoursLabel: '0h', fillPercent: 0, tone: 'empty' },
    { id: 'fri', day: 'Fri', hoursLabel: '0h', fillPercent: 0, tone: 'empty' },
  ];
}

function augustDays(): (number | null)[] {
  return [
    null,
    null,
    null,
    null,
    null,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28,
    29,
    30,
    31,
    null,
    null,
    null,
    null,
    null,
    null,
  ];
}

function septemberDays(): (number | null)[] {
  return [
    null,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28,
    29,
    30,
    null,
    null,
    null,
    null,
  ];
}
