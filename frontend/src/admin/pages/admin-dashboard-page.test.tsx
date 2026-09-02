import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderAdminPage } from '@/test/render-admin-page';

import { AdminDashboardPage } from './admin-dashboard-page';

describe('AdminDashboardPage', () => {
  it('shows operational metrics instead of a greeting', () => {
    renderAdminPage(<AdminDashboardPage />);

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.queryByText(/good (morning|evening)/i)).not.toBeInTheDocument();
    expect(screen.getByText('Headcount')).toBeInTheDocument();
    expect(screen.getByText('Pending approvals')).toBeInTheDocument();
    expect(screen.getAllByText('Sara Alam').length).toBeGreaterThan(0);
  });

  it('links to the approvals queue', () => {
    renderAdminPage(<AdminDashboardPage />);

    expect(screen.getByRole('link', { name: 'Review approvals' })).toHaveAttribute('href', '/approvals');
    expect(screen.getByRole('link', { name: 'View all approvals' })).toHaveAttribute('href', '/approvals');
  });
});
