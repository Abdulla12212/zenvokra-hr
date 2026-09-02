import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderAdminPage } from '@/test/render-admin-page';

import { AdminEmployeesPage } from './admin-employees-page';

describe('AdminEmployeesPage', () => {
  it('lists seeded employees', () => {
    renderAdminPage(<AdminEmployeesPage />);

    expect(screen.getByRole('heading', { name: 'Employees' })).toBeInTheDocument();
    expect(screen.getByText('Sara Alam')).toBeInTheDocument();
    expect(screen.getByText('EMP-1001')).toBeInTheDocument();
  });

  it('creates an employee from the dialog', async () => {
    const user = userEvent.setup();
    renderAdminPage(<AdminEmployeesPage />);

    await user.click(screen.getByRole('button', { name: 'Add employee' }));

    await user.type(screen.getByLabelText('Full name'), 'Nabila Chowdhury');
    await user.type(screen.getByLabelText('Work email'), 'nabila.chowdhury@acme.com');
    await user.selectOptions(screen.getByLabelText('Department'), 'Engineering');
    await user.type(screen.getByLabelText('Job title'), 'Product Manager');
    await user.type(screen.getByLabelText('Start date'), '2026-09-01');
    await user.selectOptions(screen.getByLabelText('Location'), 'Dhaka, Bangladesh');
    await user.click(screen.getByRole('button', { name: 'Save employee' }));

    expect(await screen.findByText('Nabila Chowdhury')).toBeInTheDocument();
  });
});
