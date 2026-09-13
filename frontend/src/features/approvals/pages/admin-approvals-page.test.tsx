import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render-with-providers';

import { AdminApprovalsPage } from './admin-approvals-page';

const { listApprovals, decideApproval } = vi.hoisted(() => ({
  listApprovals: vi.fn(),
  decideApproval: vi.fn(),
}));

vi.mock('../api/approvals-api', () => ({
  listApprovals,
  decideApproval,
}));

const leave = {
  id: 'leave-1',
  kind: 'leave',
  status: 'pending',
  employeeId: 'emp-1',
  employeeName: 'Ada Lovelace',
  employeeNumber: 'EMP-1001',
  title: 'Engineer',
  location: 'London',
  summary: 'Annual leave · 2 days',
  detail: '25–26 Sep 2026',
  note: 'Family visit',
  managerVerified: true,
  recordedLabel: '',
  requestedLabel: '',
  sentLabel: 'Submitted today at 10:00',
  sentAtUtc: '2026-09-13T10:00:00Z',
  decidedAtUtc: null,
};

describe('AdminApprovalsPage', () => {
  beforeEach(() => {
    listApprovals.mockReset();
    decideApproval.mockReset();
  });

  it('shows pending leave requests from the API', async () => {
    listApprovals.mockResolvedValue({
      pending: [leave],
      resolved: [],
      pendingPunches: 0,
      pendingLeaves: 1,
    });

    renderWithProviders(<AdminApprovalsPage />);

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText(/family visit/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
  });

  it('explains an empty queue', async () => {
    listApprovals.mockResolvedValue({
      pending: [],
      resolved: [],
      pendingPunches: 0,
      pendingLeaves: 0,
    });

    renderWithProviders(<AdminApprovalsPage />);

    expect(await screen.findByText(/nothing waiting/i)).toBeInTheDocument();
  });

  it('approves a request and refetches the queue', async () => {
    listApprovals.mockResolvedValueOnce({
      pending: [leave],
      resolved: [],
      pendingPunches: 0,
      pendingLeaves: 1,
    });
    decideApproval.mockResolvedValue({
      pending: [],
      resolved: [{ ...leave, status: 'approved' }],
      pendingPunches: 0,
      pendingLeaves: 0,
    });
    listApprovals.mockResolvedValue({
      pending: [],
      resolved: [{ ...leave, status: 'approved' }],
      pendingPunches: 0,
      pendingLeaves: 0,
    });

    renderWithProviders(<AdminApprovalsPage />);

    await userEvent.click(await screen.findByRole('button', { name: /approve/i }));

    await waitFor(() => {
      expect(decideApproval).toHaveBeenCalledWith('leave-1', {
        kind: 'leave',
        decision: 'approve',
      });
    });

    expect(await screen.findByText(/nothing waiting/i)).toBeInTheDocument();
  });
});
