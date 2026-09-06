import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderAdminApp } from '@/test/render-admin-app';

describe('AdminOrganizationPage', () => {
  it('shows locked plan fields and editable contact fields', async () => {
    renderAdminApp('/admin/organization');

    expect(await screen.findByRole('heading', { name: 'Organization profile' })).toBeInTheDocument();
    expect(screen.getByText('ACME-BD-2024')).toBeInTheDocument();
    expect(screen.getByText('Locked · entered by the platform owner')).toBeInTheDocument();
    expect(screen.getByLabelText(/company display name/i)).toHaveValue('Acme Consulting');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });
});
