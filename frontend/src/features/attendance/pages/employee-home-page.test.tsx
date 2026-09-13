import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render-with-providers';

import { EmployeeHomePage } from './employee-home-page';

const { getAttendance, getAttendanceCalendar, clockIn, listHolidays } = vi.hoisted(() => ({
  getAttendance: vi.fn(),
  getAttendanceCalendar: vi.fn(),
  clockIn: vi.fn(),
  listHolidays: vi.fn(),
}));

vi.mock('../api/attendance-api', async () => {
  const actual = await vi.importActual('../api/attendance-api');
  return {
    ...actual,
    getAttendance,
    getAttendanceCalendar,
    getTimesheet: vi.fn().mockResolvedValue([]),
    getStamp: vi.fn(),
    clockIn,
    clockOut: vi.fn(),
    startOrEndBreak: vi.fn(),
    hideLateBanner: vi.fn(),
    updateStamp: vi.fn(),
  };
});

vi.mock('@/features/holidays/api/holidays-api', () => ({
  listHolidays,
}));

vi.mock('@/features/leave/api/leave-api', () => ({
  listLeaveBalances: vi.fn().mockResolvedValue([]),
  listLeaveRequests: vi.fn().mockResolvedValue([]),
  getLeaveRequestById: vi.fn(),
  createLeaveRequest: vi.fn(),
  withdrawLeaveRequest: vi.fn(),
}));

const snapshot = {
  clockedIn: false,
  onBreak: false,
  clockInTime: '',
  recordedTimer: '0h 00m 00s',
  recordedShort: '0h',
  percentOfShift: 0,
  currentTime: '10:15',
  estimatedOut: '18:00',
  timeUntilOut: '',
  locationLabel: 'Dhaka · ready',
  locationReadyLabel: 'Dhaka · ready',
  lateBannerVisible: false,
  lateDayFixed: true,
  lateDayIso: null,
  lateDayTitle: '',
  lateDayDetail: '',
  weekTotalLabel: '0h / 40h',
  weekShiftsLabel: '0 of 5 shifts',
  weekShiftsOk: false,
  overtimeLabel: 'Overtime accrued · 0h',
  weekDays: [],
  clockInDetail: '—',
  breakDetail: '—',
  punchLogSummaryLabel: 'This week',
  todayIso: '2026-09-13',
  todayLabel: 'Sun 13 Sep 2026',
};

describe('EmployeeHomePage', () => {
  beforeEach(() => {
    getAttendance.mockReset();
    getAttendanceCalendar.mockReset();
    clockIn.mockReset();
    listHolidays.mockReset().mockResolvedValue({ todayIso: '2026-09-13', holidays: [] });
    getAttendanceCalendar.mockResolvedValue([]);
  });

  it('shows punch in when the employee is out', async () => {
    getAttendance.mockResolvedValue(snapshot);

    renderWithProviders(<EmployeeHomePage />);

    expect(await screen.findByRole('heading', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByText('Not clocked in')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Punch in' })).toBeInTheDocument();
  });

  it('punches in from the shift card', async () => {
    const user = userEvent.setup();
    getAttendance.mockResolvedValue(snapshot);
    clockIn.mockResolvedValue({ ...snapshot, clockedIn: true, clockInTime: '10:16' });

    renderWithProviders(<EmployeeHomePage />);

    await user.click(await screen.findByRole('button', { name: 'Punch in' }));

    expect(clockIn).toHaveBeenCalledOnce();
  });

  it('surfaces a failed request', async () => {
    getAttendance.mockRejectedValue(new Error('The server could not be reached.'));

    renderWithProviders(<EmployeeHomePage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('The server could not be reached.');
  });
});
