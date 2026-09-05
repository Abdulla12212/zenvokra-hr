import {
  cancelLeaveRequest,
  dismissLateBanner,
  getAttendanceSnapshot,
  getCalendarDays,
  getClosedDays,
  getInboxItems,
  getLeaveBalances,
  getLeaveRequest,
  getLeaveRequests,
  getPunchLog,
  getStampDraft,
  punchIn,
  punchOut,
  saveStamp,
  sendLeaveRequest,
  toggleBreak,
} from '@/lib/employee-app-store';
import type { CalendarMonth } from '@/lib/home-search';
import type { LeaveType, StampDraft } from '@/lib/employee-app-types';

export const leaveApiMock = {
  listLeaveBalances: () => Promise.resolve(getLeaveBalances()),
  listLeaveRequests: () => Promise.resolve(getLeaveRequests()),
  getLeaveRequestById: (id: string) => Promise.resolve(getLeaveRequest(id)),
  createLeaveRequest: (input: { type: LeaveType; from: string; to: string; note: string }) =>
    Promise.resolve(sendLeaveRequest(input)),
  withdrawLeaveRequest: (id: string) => Promise.resolve(cancelLeaveRequest(id)),
  listClosedDays: () => Promise.resolve(getClosedDays()),
};

export const attendanceApiMock = {
  getAttendance: () => Promise.resolve(getAttendanceSnapshot()),
  getTimesheet: () => Promise.resolve(getPunchLog()),
  getAttendanceCalendar: (month: CalendarMonth, day: number) =>
    Promise.resolve(getCalendarDays(month, day)),
  getStamp: (date: string) => Promise.resolve(getStampDraft(dayNumber(date))),
  clockIn: () => Promise.resolve(punchIn()),
  clockOut: () => Promise.resolve(punchOut()),
  startOrEndBreak: () => Promise.resolve(toggleBreak()),
  hideLateBanner: () => Promise.resolve(dismissLateBanner()),
  updateStamp: (input: { date: string; draft: StampDraft }) =>
    Promise.resolve(saveStamp(dayNumber(input.date), input.draft)),
};

export const inboxApiMock = {
  listInbox: () => Promise.resolve(getInboxItems()),
};

function dayNumber(date: string): number {
  const day = Number(date.slice(8, 10));
  return Number.isInteger(day) ? day : 20;
}
