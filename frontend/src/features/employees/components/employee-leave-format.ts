import type { LeaveBalance, LeaveRequest } from '@/lib/employee-app-types';

const FROZEN_TODAY = '2026-08-20';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export type LeaveHistoryFilter = 'all' | 'pending' | 'approved' | 'rejected';

export function leaveTitle(type: string): string {
  if (type === 'Annual') return 'Annual Leave';
  if (type === 'Casual') return 'Casual Leave';
  if (type === 'Sick') return 'Sick / Medical';
  return type;
}

export function pendingDaysFor(requests: LeaveRequest[], type: string): number {
  return requests
    .filter((request) => request.type === type && request.status === 'pending')
    .reduce((sum, request) => sum + request.days, 0);
}

export function usedDays(balance: LeaveBalance): number {
  return Math.max(0, balance.total - balance.remaining);
}

export function availableDays(remaining: number, pending: number): number {
  return Math.max(0, remaining - pending);
}

export function percentOf(part: number, total: number): number {
  if (total <= 0) return 0;
  return (part / total) * 100;
}

export function isUpcomingIso(iso: string): boolean {
  return iso >= FROZEN_TODAY;
}

export function formatHolidayLong(iso: string): string {
  const parts = iso.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  const monthName = MONTHS[month - 1];
  const weekday = WEEKDAYS[weekdayIndex(year, month, day)];

  if (monthName === undefined || weekday === undefined || Number.isNaN(day)) {
    return iso;
  }

  return `${weekday}, ${String(day)} ${monthName} ${String(year)} (Office Closed)`;
}

export function requestFootnote(request: LeaveRequest): string {
  if (request.status === 'pending') {
    return [request.sentLabel, request.waitingLabel].filter((part) => part.length > 0).join(' · ');
  }

  if (request.status === 'rejected') {
    return request.note.length > 0
      ? `Rejected by ${request.approverName} · ${request.note}`
      : `Rejected by ${request.approverName}`;
  }

  if (request.status === 'approved') {
    return request.inboxDetail.length > 0
      ? `${request.inboxDetail} · ${request.approverName}`
      : `Approved by ${request.approverName}`;
  }

  return request.inboxDetail;
}

export function daysLabel(days: number): string {
  return `· ${String(days)} Day${days === 1 ? '' : 's'}`;
}

function weekdayIndex(year: number, month: number, day: number): number {
  const offsets = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  const offset = offsets[month - 1];
  if (offset === undefined) {
    return 0;
  }

  const y = month < 3 ? year - 1 : year;
  return (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + offset + day) % 7;
}
