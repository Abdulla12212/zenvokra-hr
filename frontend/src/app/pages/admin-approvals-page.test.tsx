import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderAdminApp } from '@/test/render-admin-app';

describe('AdminApprovalsPage', () => {
  it('shows pending requests with approve and reject', async () => {
    renderAdminApp('/admin/approvals');

    expect(await screen.findByRole('heading', { name: 'Approvals' })).toBeInTheDocument();
    expect(screen.getAllByText('Nadia Chowdhury').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
  });
});
