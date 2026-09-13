import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render-with-providers';

import { AdminDashboardPage } from './admin-dashboard-page';

const { getDashboard } = vi.hoisted(() => ({
  getDashboard: vi.fn(),
}));

vi.mock('../api/dashboard-api', () => ({
  getDashboard,
}));

const dashboard = {
  headcount: 2,
  present: 1,
  remote: 1,
  pendingApprovals: 1,
  pendingPunches: 0,
  pendingLeaves: 1,
  lateToday: 0,
  averageLatenessLabel: '—',
  onLeave: 0,
  annualOnLeave: 0,
  sickOnLeave: 0,
  activity: [
    {
      employeeId: 'emp-1',
      fullName: 'Ada Lovelace',
      employeeNumber: 'EMP-1001',
      title: 'Engineer',
      timeLabel: '09:00',
      detail: 'On-time',
      direction: 'In',
    },
  ],
};

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    getDashboard.mockReset();
  });

  it('shows presence totals and punch activity', async () => {
    getDashboard.mockResolvedValue(dashboard);

    renderWithProviders(<AdminDashboardPage />);

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('View all')).toBeInTheDocument();
  });

  it('surfaces a failed request', async () => {
    getDashboard.mockRejectedValue(new Error('The server could not be reached.'));

    renderWithProviders(<AdminDashboardPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('The server could not be reached.');
  });
});
