import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderAdminPage } from '@/test/render-admin-page';

import { AdminApprovalsPage } from './admin-approvals-page';

describe('AdminApprovalsPage', () => {
  it('lists pending requests', () => {
    renderAdminPage(<AdminApprovalsPage />);

    expect(screen.getByRole('heading', { name: 'Approvals' })).toBeInTheDocument();
    expect(screen.getByText(/7 pending/)).toBeInTheDocument();
    expect(screen.getByText('Annual leave · 4 Sep 2026')).toBeInTheDocument();
  });

  it('filters to late arrivals', async () => {
    const user = userEvent.setup();
    renderAdminPage(<AdminApprovalsPage />);

    await user.click(screen.getByRole('button', { name: /late arrival 2/i }));

    expect(screen.getByText('Late by 35m · 2 Sep 2026')).toBeInTheDocument();
    expect(screen.queryByText('Annual leave · 4 Sep 2026')).not.toBeInTheDocument();
  });

  it('removes a row after approve', async () => {
    const user = userEvent.setup();
    renderAdminPage(<AdminApprovalsPage />);

    const approveButtons = screen.getAllByRole('button', { name: 'Approve' });
    const first = approveButtons[0];

    if (!first) {
      throw new Error('Expected an Approve button.');
    }

    await user.click(first);

    expect(screen.getByText(/6 pending/)).toBeInTheDocument();
    expect(screen.queryByText('Annual leave · 4 Sep 2026')).not.toBeInTheDocument();
  });
});
