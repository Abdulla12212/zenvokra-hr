import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render-with-providers';

import { EmployeeHomePage } from './employee-home-page';

const { getAttendance, getAttendanceCalendar, getPunchLog, clockIn, clockOut, listHolidays } =
  vi.hoisted(() => ({
    getAttendance: vi.fn(),
    getAttendanceCalendar: vi.fn(),
    getPunchLog: vi.fn(),
    clockIn: vi.fn(),
    clockOut: vi.fn(),
    listHolidays: vi.fn(),
  }));

vi.mock('../api/attendance-api', async () => {
  const actual = await vi.importActual('../api/attendance-api');
  return {
    ...actual,
    getAttendance,
    getAttendanceCalendar,
    getPunchLog,
    getStamp: vi.fn(),
    clockIn,
    clockOut,
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
  clockOutTime: '',
  clockInAt: null,
  clockOutAt: null,
  recordedSeconds: 0,
  priorWorkedSeconds: 0,
  openSinceAt: null,
};

describe('EmployeeHomePage', () => {
  beforeEach(() => {
    getAttendance.mockReset();
    getAttendanceCalendar.mockReset();
    getPunchLog.mockReset().mockResolvedValue([]);
    clockIn.mockReset();
    clockOut.mockReset();
    listHolidays.mockReset().mockResolvedValue({ todayIso: '2026-09-13', holidays: [] });
    getAttendanceCalendar.mockResolvedValue([]);
  });

  it('shows clock in when the employee is out', async () => {
    getAttendance.mockResolvedValue(snapshot);

    renderWithProviders(<EmployeeHomePage />);

    expect(await screen.findByRole('heading', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByText('Not clocked in')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clock in' })).toBeInTheDocument();
    expect(screen.getByText('0h 00m 00s')).toBeInTheDocument();
  });

  it('clocks in from the shift card', async () => {
    const user = userEvent.setup();
    getAttendance.mockResolvedValue(snapshot);
    clockIn.mockResolvedValue({
      ...snapshot,
      clockedIn: true,
      clockInTime: '10:16',
      clockInAt: '2026-09-13T10:16:00+06:00',
      recordedSeconds: 0,
      priorWorkedSeconds: 0,
      openSinceAt: new Date().toISOString(),
    });

    renderWithProviders(<EmployeeHomePage />);

    await user.click(await screen.findByRole('button', { name: 'Clock in' }));

    expect(clockIn).toHaveBeenCalledOnce();
  });

  it('clocks out from the shift card', async () => {
    const user = userEvent.setup();
    getAttendance.mockResolvedValue({
      ...snapshot,
      clockedIn: true,
      clockInTime: '10:16',
      clockInAt: '2026-09-13T10:16:00+06:00',
      recordedSeconds: 120,
      priorWorkedSeconds: 120,
      openSinceAt: new Date().toISOString(),
    });
    clockOut.mockResolvedValue({
      ...snapshot,
      clockedIn: false,
      clockInTime: '10:16',
      clockOutTime: '10:18',
      clockInAt: '2026-09-13T10:16:00+06:00',
      clockOutAt: '2026-09-13T10:18:00+06:00',
      recordedSeconds: 120,
      priorWorkedSeconds: 120,
      openSinceAt: null,
    });

    renderWithProviders(<EmployeeHomePage />);

    await user.click(await screen.findByRole('button', { name: 'Clock out' }));

    expect(clockOut).toHaveBeenCalledOnce();
    expect(await screen.findByText('Paused')).toBeInTheDocument();
    expect(screen.getByText('0h 02m 00s')).toBeInTheDocument();
  });

  it('keeps the timer when clock-out reports zero worked seconds', async () => {
    const user = userEvent.setup();
    const opened = new Date(Date.now() - 90_000).toISOString();
    getAttendance.mockResolvedValue({
      ...snapshot,
      clockedIn: true,
      clockInTime: '10:16',
      clockInAt: opened,
      recordedSeconds: 0,
      priorWorkedSeconds: 0,
      openSinceAt: opened,
    });
    clockOut.mockResolvedValue({
      ...snapshot,
      clockedIn: false,
      clockInTime: '10:16',
      clockOutTime: '10:18',
      clockInAt: opened,
      clockOutAt: new Date().toISOString(),
      recordedSeconds: 0,
      priorWorkedSeconds: 0,
      openSinceAt: null,
    });

    renderWithProviders(<EmployeeHomePage />);

    expect(await screen.findByText('Running')).toBeInTheDocument();
    const running = screen.getByText(/\d+h \d{2}m \d{2}s/);
    expect(running.textContent).not.toBe('0h 00m 00s');

    await user.click(screen.getByRole('button', { name: 'Clock out' }));

    expect(await screen.findByText('Paused')).toBeInTheDocument();
    expect(screen.getByText(/\d+h \d{2}m \d{2}s/).textContent).not.toBe('0h 00m 00s');
  });

  it('renders the month grid when the URL has no calendar query', async () => {
    getAttendance.mockResolvedValue(snapshot);
    getAttendanceCalendar.mockResolvedValue([
      {
        day: 13,
        weekend: true,
        today: true,
        selected: true,
        inRange: false,
        kind: 'today',
      },
    ]);

    renderWithProviders(<EmployeeHomePage />, { route: '/' });

    expect(await screen.findByText('Mon')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(getAttendanceCalendar).toHaveBeenCalled();
    const [year, month] = getAttendanceCalendar.mock.calls[0] as [number, number];
    expect(year).toBeGreaterThanOrEqual(1);
    expect(year).toBeLessThanOrEqual(9999);
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);
  });

  it('does not send year 0 from an old home link', async () => {
    getAttendance.mockResolvedValue(snapshot);
    getAttendanceCalendar.mockResolvedValue([]);

    renderWithProviders(<EmployeeHomePage />, { route: '/?year=0&month=1&day=1' });

    await screen.findByRole('heading', { name: 'Home' });

    const [year, month] = getAttendanceCalendar.mock.calls[0] as [number, number];
    const today = new Date();
    expect(year).toBe(today.getFullYear());
    expect(month).toBe(today.getMonth() + 1);
  });

  it('does not show timesheet logs on the week card', async () => {
    getAttendance.mockResolvedValue(snapshot);

    renderWithProviders(<EmployeeHomePage />);

    expect(await screen.findByRole('heading', { name: 'Home' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Timesheet logs' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Punch log' })).toBeInTheDocument();
  });

  it('shows the selected past day so it can be edited', async () => {
    getAttendance.mockResolvedValue(snapshot);
    getAttendanceCalendar.mockResolvedValue([
      {
        day: 5,
        weekend: false,
        today: false,
        selected: false,
        inRange: false,
        kind: 'present',
        clockIn: '09:00',
        clockOut: '18:00',
        hours: '8h',
      },
    ]);

    renderWithProviders(<EmployeeHomePage />, { route: '/?year=2026&month=9&day=5' });

    expect(await screen.findByText('Selected day')).toBeInTheDocument();
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('18:00')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit punch' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clock in' })).not.toBeInTheDocument();
  });

  it('lets the employee edit a punch from the log', async () => {
    getAttendance.mockResolvedValue(snapshot);
    getPunchLog.mockResolvedValue([
      {
        id: '2026-09-12',
        heading: 'Sat 12 Sep · Present',
        entries: [
          {
            id: '2026-09-12',
            title: 'In 09:00 · Out 18:00',
            detail: '8h · on-time',
            tone: 'ok',
            action: 'edit',
          },
        ],
      },
    ]);

    renderWithProviders(<EmployeeHomePage />, {
      route: '/?year=2026&month=9&day=13&sheet=punch-log',
    });

    expect(await screen.findByRole('heading', { name: 'Punch log' })).toBeInTheDocument();
    expect(screen.queryByText('Timesheet')).not.toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/?year=2026&month=9&day=12&sheet=fix-punch',
    );
  });

  it('surfaces a failed request', async () => {
    getAttendance.mockRejectedValue(new Error('The server could not be reached.'));

    renderWithProviders(<EmployeeHomePage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('The server could not be reached.');
  });
});
