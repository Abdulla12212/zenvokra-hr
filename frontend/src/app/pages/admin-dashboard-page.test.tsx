import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderAdminApp } from '@/test/render-admin-app';

describe('AdminDashboardPage', () => {
  it('shows presence, pending approvals, and punch activity', async () => {
    renderAdminApp('/admin');

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('On duty presence')).toBeInTheDocument();
    expect(screen.getAllByText('Pending approvals').length).toBeGreaterThan(0);
    expect(screen.getByText('Nadia Chowdhury')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Grant' })).toBeInTheDocument();
    expect(screen.getByText('Live punch activity')).toBeInTheDocument();
  });
});
