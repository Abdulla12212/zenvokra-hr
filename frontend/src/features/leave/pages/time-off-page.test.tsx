import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render-with-providers';

import { TimeOffPage } from './time-off-page';

const { listLeaveBalances, listLeaveRequests, listHolidays } = vi.hoisted(() => ({
  listLeaveBalances: vi.fn(),
  listLeaveRequests: vi.fn(),
  listHolidays: vi.fn(),
}));

vi.mock('../api/leave-api', () => ({
  listLeaveBalances,
  listLeaveRequests,
  getLeaveRequestById: vi.fn(),
  createLeaveRequest: vi.fn(),
  withdrawLeaveRequest: vi.fn(),
}));

vi.mock('@/features/holidays/api/holidays-api', () => ({
  listHolidays,
}));

describe('TimeOffPage', () => {
  beforeEach(() => {
    listLeaveBalances.mockReset();
    listLeaveRequests.mockReset();
    listHolidays.mockReset().mockResolvedValue({ todayIso: '2026-09-13', holidays: [] });
  });

  it('shows balances and a pending request', async () => {
    listLeaveBalances.mockResolvedValue([
      { type: 'Annual', remaining: 20, total: 20 },
      { type: 'Casual', remaining: 10, total: 10 },
      { type: 'Sick', remaining: 10, total: 10 },
    ]);
    listLeaveRequests.mockResolvedValue([
      {
        id: 'req-1',
        type: 'Annual',
        datesLabel: '25–26 Aug 2026',
        fromLabel: 'Tue 25 Aug 2026',
        toLabel: 'Wed 26 Aug 2026',
        rangeShort: 'Tue 25 – Wed 26 Aug 2026',
        heading: '25–26 Aug',
        days: 2,
        status: 'pending',
        statusLabel: 'Pending · Nadia',
        approverName: 'Nadia Khan',
        note: 'Family visit.',
        sentLabel: 'Sent 13 Sep, 10:00',
        waitingLabel: 'Waiting on Nadia Khan',
        remainingAfterLabel: '18 annual days left',
        inboxTitle: '25–26 Aug waiting on Nadia',
        inboxDetail: 'Sent today 10:00',
      },
    ]);

    renderWithProviders(<TimeOffPage />);

    expect(await screen.findByRole('heading', { name: 'Time off' })).toBeInTheDocument();
    expect(screen.getAllByText('Annual').length).toBeGreaterThan(0);
    expect(screen.getByText('25–26 Aug 2026')).toBeInTheDocument();
    expect(screen.getByText('Pending · Nadia')).toBeInTheDocument();
  });

  it('shows an empty state', async () => {
    listLeaveBalances.mockResolvedValue([{ type: 'Annual', remaining: 20, total: 20 }]);
    listLeaveRequests.mockResolvedValue([]);

    renderWithProviders(<TimeOffPage />);

    expect(await screen.findByText('No time-off requests yet.')).toBeInTheDocument();
  });
});
