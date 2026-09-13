import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render-with-providers';

import { RequestDetailPage } from './request-detail-page';

const { getLeaveRequestById, withdrawLeaveRequest } = vi.hoisted(() => ({
  getLeaveRequestById: vi.fn(),
  withdrawLeaveRequest: vi.fn(),
}));

vi.mock('../api/leave-api', () => ({
  getLeaveRequestById,
  withdrawLeaveRequest,
  listLeaveBalances: vi.fn().mockResolvedValue([]),
  listLeaveRequests: vi.fn().mockResolvedValue([]),
  createLeaveRequest: vi.fn(),
}));

const request = {
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
};

describe('RequestDetailPage', () => {
  beforeEach(() => {
    getLeaveRequestById.mockReset().mockResolvedValue(request);
    withdrawLeaveRequest.mockReset().mockResolvedValue({ ...request, status: 'cancelled' });
  });

  it('shows the pending request and cancels it', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <Routes>
        <Route path="/time-off/:requestId" element={<RequestDetailPage />} />
        <Route path="/time-off" element={<p>Time off</p>} />
      </Routes>,
      { route: '/time-off/req-1' },
    );

    expect(await screen.findByRole('heading', { name: '25–26 Aug' })).toBeInTheDocument();
    expect(screen.getByText('Family visit.')).toBeInTheDocument();
    expect(screen.getByText('Waiting on Nadia Khan')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel request' }));

    expect(withdrawLeaveRequest).toHaveBeenCalledWith('req-1');
  });
});
